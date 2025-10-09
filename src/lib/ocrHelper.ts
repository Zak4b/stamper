import { Rectangle } from "tesseract.js";
import { createCanvasFromRegion } from "./pdfRenderer";
import { ocrWorkerManager } from "./ocrWorkerManager";

export interface OCRResult {
	text: string;
	confidence: number;
	ids: string[];
}

// Configuration des patterns d'extraction d'ID
interface IDPattern {
	name: string;
	pattern: RegExp;
	captureGroup?: number; // Groupe de capture à utiliser (par défaut 1)
	transform?: (match: string) => string; // Fonction de transformation optionnelle
}

const patternList: IDPattern[] = [
	{
		name: "PREFD66",
		pattern: /(PREFD66-\d{2}-\d{4})/gi,
	},
	{
		name: "PREFD66_alt",
		pattern: /PREFD66-(\d{2}-\d{4})/gi,
		transform: (match) => `PREFD66-${match}`,
	},
];

function extractIds(text: string): string[] {
	const foundIds = new Set<string>();

	for (const pattern of patternList) {
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
	const imageData = await createCanvasFromRegion(pdfFile, pageNumber, region, 1.5);

	const result = await ocrWorkerManager.addTask(imageData, onProgress);

	const ids = extractIds(result.text);
	console.debug("OCR Result:", {
		text: result.text,
		confidence: result.confidence,
		ids: ids,
	});

	return {
		text: result.text,
		confidence: result.confidence,
		ids: ids,
	};
}
