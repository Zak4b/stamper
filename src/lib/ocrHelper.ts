import { PSM, Rectangle } from "tesseract.js";
import { createCanvasFromRegion } from "./pdfRenderer";
import { ocrWorkerManager } from "./ocrWorkerManager";
import { getEnabledPatterns } from "../config/appConfig";
import { PDF_RENDER_SCALE } from "../config/pdfRender";

export interface OCRResult {
	text: string;
	confidence: number;
	ids: string[];
}

function extractIds(text: string): string[] {
	const foundIds = new Set<string>();
	const enabledPatterns = getEnabledPatterns();

	for (const pattern of enabledPatterns) {
		const matches = text.matchAll(pattern.pattern);

		for (const match of matches) {
			const captureIndex = pattern.captureGroup || 1;
			let extractedId = match[captureIndex];

			if (extractedId) {
				// Appliquer la transformation si définie
				if (pattern.transform) {
					extractedId = pattern.transform(extractedId);
				}
				foundIds.add(extractedId);
			}
		}
	}
	return Array.from(foundIds);
}

export async function performOCRWithProgress(pdfFile: File, pageNumber: number, region: Rectangle | undefined, onProgress: (progress: number) => void): Promise<OCRResult> {
	onProgress(0);
	const imageData = await createCanvasFromRegion(pdfFile, pageNumber, region, PDF_RENDER_SCALE);

	// Une région est un bloc de texte isolé : l'analyse de mise en page du mode AUTO
	// y cherche une structure qui n'existe pas. Sur une page entière elle reste
	// nécessaire, sinon des colonnes voisines sont fusionnées en une même ligne.
	const result = await ocrWorkerManager.addTask(imageData, onProgress, {
		tessedit_pageseg_mode: region ? PSM.SINGLE_BLOCK : PSM.AUTO,
	});

	const ids = extractIds(result.text);
	console.debug("OCR Result:", {
		ids: ids,
		result,
	});

	return {
		text: result.text,
		confidence: result.confidence,
		ids: ids,
	};
}
