// Utilitaires pour le rendu et la gestion des PDFs
import { Rectangle } from "tesseract.js";
import { pdfjsLib, PDFPageProxy } from "./pdfLoader";
import { getPreparedPDF, preparePDFDocument } from "./pdfDocumentCache";
import { PDF_RENDER_SCALE } from "../config/pdfRender";

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
			await page.render({
				canvas,
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

export interface PDFPageSize {
	width: number;
	height: number;
}

/**
 * Dimensions de rendu de chaque page, lues une fois pour dimensionner les
 * conteneurs avant que les canvas ne soient peints (évite tout saut de layout).
 */
export async function getPDFPageSizes(pdfFile: File, options: PDFRenderOptions = {}): Promise<PDFPageSize[]> {
	const { scale = PDF_RENDER_SCALE, preserveRotation = false, useReorientation = false } = options;

	const { pdf } = await getPreparedPDF(pdfFile, useReorientation);

	const sizes: PDFPageSize[] = [];
	for (let i = 1; i <= pdf.numPages; i++) {
		const page = await pdf.getPage(i);
		const viewport = page.getViewport({ scale, rotation: preserveRotation ? 0 : undefined });
		sizes.push({ width: viewport.width, height: viewport.height });
	}
	return sizes;
}

/**
 * Dessine une page déjà ouverte sur un canvas, en le dimensionnant au viewport.
 */
async function drawPage(page: PDFPageProxy, canvas: HTMLCanvasElement, scale: number, preserveRotation: boolean, maxRetries: number): Promise<void> {
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
}

/**
 * Rend une page PDF sur un canvas avec gestion d'erreurs.
 *
 * Le document est mis en cache par identité de `File` : changer de page ou
 * d'étape ne relit ni ne reparse le fichier.
 */
export async function renderPDFPage(pdfFile: File, canvas: HTMLCanvasElement, pageNumber: number, options: PDFRenderOptions = {}): Promise<PDFPageInfo> {
	const { scale = PDF_RENDER_SCALE, maxRetries = 3, preserveRotation = false, useReorientation = false } = options;

	let pdf;
	try {
		pdf = (await getPreparedPDF(pdfFile, useReorientation)).pdf;
	} catch (error) {
		if (!useReorientation) throw error;
		// Fallback vers le rendu standard si la réorientation échoue
		console.error("Erreur lors du rendu avec réorientation, fallback vers rendu standard:", error);
		pdf = (await getPreparedPDF(pdfFile, false)).pdf;
	}

	const page = await pdf.getPage(pageNumber + 1);
	await drawPage(page, canvas, scale, preserveRotation, maxRetries);

	return {
		pageCount: pdf.numPages,
		currentPage: pageNumber,
	};
}

/**
 * Crée un canvas temporaire avec une région spécifique du PDF
 */
export async function createCanvasFromRegion(pdfFile: File, pageNumber: number, region?: Rectangle, scale: number = PDF_RENDER_SCALE): Promise<string> {
	// Fichier ponctuel (un PDF du lot) : on prépare hors cache et on libère
	// immédiatement, sinon chaque fichier OCRisé garderait un document pdf.js ouvert.
	let prepared;
	try {
		// Utiliser la réorientation pour être cohérent avec les previews
		prepared = await preparePDFDocument(pdfFile, true);
	} catch (error) {
		console.error("Erreur lors de la réorientation pour OCR, fallback vers rendu standard:", error);
		prepared = await preparePDFDocument(pdfFile, false);
	}

	const canvas = document.createElement("canvas");
	try {
		const page = await prepared.pdf.getPage(pageNumber + 1);
		await drawPage(page, canvas, scale, false, 3);
	} finally {
		void prepared.pdf.destroy().catch(() => undefined);
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
