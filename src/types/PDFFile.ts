export interface PDFFile {
	file: File;
	docId?: string;
	status: "pending" | "ocr" | "analyzed" | "processing" | "completed" | "error";
	error?: string;
	stampedData?: Uint8Array;
	ocrConfidence?: number;
	detectedIds?: string[];
	ocrProgress?: number;
}
