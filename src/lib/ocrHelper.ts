import { createWorker, Rectangle } from "tesseract.js";
import { createCanvasFromRegion } from "./pdfRenderer";

export interface OCRResult {
	text: string;
	confidence: number;
	detectedNumbers: string[];
}

function extractNumbers(text: string): string[] {
	const pattern = /PREFD66-(\d{2}-\d{4})/gi;
	const numbers = new Set<string>();

	const matches = text.matchAll(pattern);
	for (const match of matches) {
		if (match[1]) {
			numbers.add(`PREFD66-${match[1]}`);
		}
	}

	return Array.from(numbers);
}

export async function performOCRWithProgress(pdfFile: File, pageNumber: number, region: Rectangle | undefined, onProgress: (progress: number) => void): Promise<OCRResult> {
	onProgress(10);

	const imageData = await createCanvasFromRegion(pdfFile, pageNumber, region, 1.5);

	onProgress(60);

	const worker = await createWorker("fra", 1, {
		logger: (m) => {
			if (m.status === "recognizing text") {
				onProgress(60 + m.progress * 40);
			}
		},
		workerPath: "/tesseract/worker.min.js",
		langPath: "/tesseract",
		corePath: "/tesseract/tesseract-core.wasm.js",
	});

	const { data } = await worker.recognize(imageData);
	await worker.terminate();

	onProgress(100);

	const numbers = extractNumbers(data.text);
	console.debug("OCR Result:", { text: data.text, confidence: data.confidence, detectedNumbers: numbers });

	return {
		text: data.text,
		confidence: data.confidence,
		detectedNumbers: numbers,
	};
}
