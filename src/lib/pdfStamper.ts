import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

export interface StampPosition {
	x: number;
	y: number;
	page: number;
}

export interface StampConfig {
	position: StampPosition;
	text: string;
	fontSize?: number;
	color?: { r: number; g: number; b: number };
}

export async function stampPDF(pdfBytes: Uint8Array, config: StampConfig, isReoriented: boolean = false): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.load(pdfBytes);
	const pages = pdfDoc.getPages();

	if (config.position.page >= pages.length) {
		throw new Error("Page number out of range");
	}

	const page = pages[config.position.page];
	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const fontSize = config.fontSize || 12;
	const color = config.color || { r: 0, g: 0, b: 0 };

	// Obtenir les informations sur la rotation de la page
	const rotation = page.getRotation().angle;
	const pageWidth = page.getWidth();
	const pageHeight = page.getHeight();

	// Convertir les coordonnées du système canvas (origine en haut à gauche)
	// vers le système PDF-lib (origine en bas à gauche)
	// et ajuster pour l'échelle utilisée dans le canvas (1.5)

	// Les coordonnées viennent d'un canvas avec scale: 1.5, il faut les convertir
	const scaleFactor = 1.5;
	const actualX = config.position.x / scaleFactor;
	const actualY = config.position.y / scaleFactor;

	let finalX: number;
	let finalY: number;

	if (isReoriented) {
		// Pour un PDF réorienté, les coordonnées peuvent être utilisées plus directement
		// car le contenu a été réorganisé dans le bon sens
		finalX = actualX;
		finalY = pageHeight - actualY; // Conversion standard canvas->PDF (origine en bas)
	} else {
		// Les coordonnées viennent du canvas "redressé" par PDF.js
		// mais pdf-lib utilise les coordonnées de la page dans son orientation originale
		// Nous devons transformer les coordonnées du système redressé vers le système original
		finalX = actualX;
		finalY = pageHeight - actualY; // Conversion standard canvas->PDF (origine en bas)

		// Transformation inverse : du système redressé vers le système original tourné
		switch (rotation) {
			case 90: // Page originale tournée de 90° -> redressée par PDF.js
				// Les coordonnées canvas sont basées sur le rendu redressé (width x height)
				// mais pdf-lib utilise les coordonnées originales (height x width après rotation)
				finalX = actualY;
				finalY = pageWidth - actualX;
				break;
			case 180: // Page originale tournée de 180°
				finalX = pageWidth - actualX;
				finalY = pageHeight - actualY;
				break;
			case 270: // Page originale tournée de 270°
				finalX = actualY;
				finalY = pageHeight - actualX;
				break;
			default: // 0° - pas de rotation
				// Utiliser les valeurs par défaut déjà calculées
				break;
		}
	}

	// Pas de rotation du texte car nous plaçons dans le système de coordonnées original
	const textRotation = 0;

	console.log("Stamping PDF:", {
		originalPosition: config.position,
		pageWidth,
		pageHeight,
		rotation,
		scaleFactor,
		finalX,
		finalY,
		textRotation,
		text: config.text,
		fontSize,
	});

	page.drawText(config.text, {
		x: finalX,
		y: finalY,
		size: fontSize,
		font: font,
		color: rgb(color.r, color.g, color.b),
		rotate: textRotation === 0 ? undefined : degrees(textRotation),
	});

	return await pdfDoc.save();
}

export async function getPDFInfo(pdfBytes: Uint8Array) {
	const pdfDoc = await PDFDocument.load(pdfBytes);
	const pages = pdfDoc.getPages();

	return {
		pageCount: pages.length,
		pages: pages.map((page, index) => ({
			index,
			width: page.getWidth(),
			height: page.getHeight(),
		})),
	};
}

/**
 * Stampe un PDF en détectant et corrigeant automatiquement les anomalies d'orientation
 * Si des anomalies sont détectées, crée un nouveau PDF réorienté avec tout le contenu
 */
export async function stampPDFWithAnomalyDetection(originalFile: File, config: StampConfig): Promise<Uint8Array> {
	const arrayBuffer = await originalFile.arrayBuffer();
	const pdfBytes = new Uint8Array(arrayBuffer);

	// Importer les fonctions de réorientation de manière dynamique pour éviter les dépendances circulaires
	const { needsReorientation, reorientPDF } = await import("./pdfReorientation");

	// Vérifier si le PDF a besoin d'être réorienté
	const needsReorient = await needsReorientation(pdfBytes);

	let finalPdfBytes = pdfBytes;

	if (needsReorient) {
		console.log("Anomalies d'orientation détectées - Réorientation du PDF...");

		// Créer un nouveau PDF réorienté
		const reorientedBytes = await reorientPDF(pdfBytes);
		finalPdfBytes = new Uint8Array(reorientedBytes);

		console.log("PDF réorienté avec succès");
	}

	// Maintenant que les previews utilisent aussi la réorientation,
	// les coordonnées sont toujours dans le référentiel du PDF réorienté/correct
	// Donc on peut toujours utiliser isReoriented = true pour simplifier les calculs
	return await stampPDF(finalPdfBytes, config, true);
}
