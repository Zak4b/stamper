// Utilitaires pour le rendu et la gestion des PDFs
import { Rectangle } from "tesseract.js";
import { pdfjsLib, PDFPageProxy } from "./pdfLoader";

export interface PDFRenderOptions {
	scale?: number;
	maxRetries?: number;
	preserveRotation?: boolean; // Si true, ne corrige pas la rotation automatiquement
	useReorientation?: boolean; // Si true, utilise la réorientation automatique pour les anomalies
}

export interface PDFPageInfo {
	pageCount: number;
	currentPage: number;
}

/**
 * Gestion des erreurs de canvas simultané avec retry automatique
 */
export async function renderPDFPageWithRetry(page: PDFPageProxy, canvas: HTMLCanvasElement, viewport: pdfjsLib.PageViewport, maxRetries: number = 3): Promise<void> {
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			const context = canvas.getContext("2d")!;
			// @ts-expect-error - PDF.js API types might not be fully compatible
			await page.render({
				canvasContext: context,
				viewport: viewport,
			}).promise;
			return;
		} catch (error) {
			if (error instanceof Error && error.message.includes("same canvas")) {
				if (attempt === maxRetries) {
					console.error("Impossible de rendre le PDF après plusieurs tentatives");
					return;
				}
				const delay = 100 + Math.random() * 200;
				await new Promise((resolve) => setTimeout(resolve, delay));
			} else {
				console.error("Erreur lors du rendu PDF:", error);
				return;
			}
		}
	}
}

/**
 * Charge un PDF et retourne les informations de base
 */
export async function loadPDFDocument(pdfFile: File) {
	const arrayBuffer = await pdfFile.arrayBuffer();
	const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
	const pdf = await loadingTask.promise;

	return pdf;
}

/**
 * Rend une page PDF sur un canvas avec gestion d'erreurs
 */
export async function renderPDFPage(pdfFile: File, canvas: HTMLCanvasElement, pageNumber: number, options: PDFRenderOptions = {}): Promise<PDFPageInfo> {
	const { scale = 1.5, maxRetries = 3, preserveRotation = false, useReorientation = false } = options;

	if (useReorientation) {
		return await renderPDFPageWithReorientation(pdfFile, canvas, pageNumber, { scale, maxRetries, preserveRotation });
	}

	const pdf = await loadPDFDocument(pdfFile);
	const page = await pdf.getPage(pageNumber + 1);

	const viewport = page.getViewport({
		scale,
		rotation: preserveRotation ? 0 : undefined, // 0 = pas de correction automatique
	});

	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error("Cannot get canvas context");
	}

	canvas.height = viewport.height;
	canvas.width = viewport.width;

	await renderPDFPageWithRetry(page, canvas, viewport, maxRetries);

	return {
		pageCount: pdf.numPages,
		currentPage: pageNumber,
	};
}

/**
 * Rend une page PDF avec réorientation automatique des anomalies
 */
async function renderPDFPageWithReorientation(
	pdfFile: File,
	canvas: HTMLCanvasElement,
	pageNumber: number,
	options: Omit<PDFRenderOptions, "useReorientation"> = {}
): Promise<PDFPageInfo> {
	const { scale = 1.5, maxRetries = 3 } = options;

	try {
		// Importer dynamiquement les fonctions de réorientation
		const { needsReorientation, reorientPDF } = await import("./pdfReorientation");

		const arrayBuffer = await pdfFile.arrayBuffer();
		const pdfBytes = new Uint8Array(arrayBuffer);

		// Vérifier si le PDF a besoin d'être réorienté
		const needsReorient = await needsReorientation(pdfBytes);

		let finalPdfBytes = pdfBytes;

		if (needsReorient) {
			console.log("Réorientation nécessaire pour le preview - création d'un PDF temporaire...");
			const reorientedBytes = await reorientPDF(pdfBytes);
			finalPdfBytes = new Uint8Array(reorientedBytes);
		}

		// Créer un fichier temporaire avec les bytes réorientés
		const reorientedFile = new File([finalPdfBytes], pdfFile.name, { type: "application/pdf" });

		// Utiliser la fonction de rendu standard sur le PDF réorienté
		const pdf = await loadPDFDocument(reorientedFile);
		const page = await pdf.getPage(pageNumber + 1);

		const viewport = page.getViewport({ scale });

		const context = canvas.getContext("2d");
		if (!context) {
			throw new Error("Cannot get canvas context");
		}

		canvas.height = viewport.height;
		canvas.width = viewport.width;

		await renderPDFPageWithRetry(page, canvas, viewport, maxRetries);

		return {
			pageCount: pdf.numPages,
			currentPage: pageNumber,
		};
	} catch (error) {
		console.error("Erreur lors du rendu avec réorientation, fallback vers rendu standard:", error);
		// Fallback vers le rendu standard en cas d'erreur
		return await renderPDFPage(pdfFile, canvas, pageNumber, { ...options, useReorientation: false });
	}
}

/**
 * Crée un canvas temporaire avec une région spécifique du PDF
 */
export async function createCanvasFromRegion(pdfFile: File, pageNumber: number, region?: Rectangle, scale: number = 1.5): Promise<string> {
	// Utiliser la réorientation pour être cohérent avec les previews
	let canvas: HTMLCanvasElement;

	try {
		const { needsReorientation, reorientPDF } = await import("./pdfReorientation");

		const arrayBuffer = await pdfFile.arrayBuffer();
		const pdfBytes = new Uint8Array(arrayBuffer);

		const needsReorient = await needsReorientation(pdfBytes);

		let finalFile = pdfFile;

		if (needsReorient) {
			const reorientedBytes = await reorientPDF(pdfBytes);
			finalFile = new File([new Uint8Array(reorientedBytes)], pdfFile.name, { type: "application/pdf" });
		}

		const pdf = await loadPDFDocument(finalFile);
		const page = await pdf.getPage(pageNumber + 1);
		const viewport = page.getViewport({ scale });

		canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");
		if (!context) {
			throw new Error("Cannot create canvas context");
		}

		canvas.height = viewport.height;
		canvas.width = viewport.width;

		await renderPDFPageWithRetry(page, canvas, viewport);
	} catch (error) {
		console.error("Erreur lors de la réorientation pour OCR, fallback vers rendu standard:", error);
		// Fallback vers la méthode standard
		const pdf = await loadPDFDocument(pdfFile);
		const page = await pdf.getPage(pageNumber + 1);
		const viewport = page.getViewport({ scale });

		canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");
		if (!context) {
			throw new Error("Cannot create canvas context");
		}

		canvas.height = viewport.height;
		canvas.width = viewport.width;

		await renderPDFPageWithRetry(page, canvas, viewport);
	}

	let imageData: string;
	if (region) {
		const tempCanvas = document.createElement("canvas");
		const tempContext = tempCanvas.getContext("2d");
		if (!tempContext) {
			throw new Error("Cannot create temp canvas context");
		}

		tempCanvas.width = region.width;
		tempCanvas.height = region.height;

		tempContext.drawImage(canvas, region.left, region.top, region.width, region.height, 0, 0, region.width, region.height);
		imageData = tempCanvas.toDataURL("image/png");
	} else {
		imageData = canvas.toDataURL("image/png");
	}

	return imageData;
}
