import { Rectangle } from "tesseract.js";
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

	const result = await ocrWorkerManager.addTask(imageData, onProgress);

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
