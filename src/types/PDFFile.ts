export interface PDFFile {
	file: File;
	numeroDossier: string;
	status: "pending" | "ocr" | "analyzed" | "processing" | "completed" | "error";
	error?: string;
	stampedData?: Uint8Array;
	ocrConfidence?: number;
	detectedNumbers?: string[];
	ocrProgress?: number;
}
