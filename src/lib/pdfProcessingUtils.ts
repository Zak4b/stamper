import { PDFFile } from "../types/PDFFile";
import { StampPosition, stampPDFWithAnomalyDetection } from "./pdfStamper";
import { getAllDossiers } from "./database";
import { Rectangle } from "tesseract.js";

/**
 * Analyse un fichier PDF avec OCR
 */
export async function analyzeFile(
	fileIndex: number,
	file: File,
	ocrPageNumber: number,
	ocrRegion: Rectangle | undefined,
	updateFile: (index: number, updates: Partial<PDFFile>) => void
): Promise<void> {
	try {
		// Marquer comme en cours d'OCR
		updateFile(fileIndex, { status: "ocr", ocrProgress: 0 });

		const { performOCRWithProgress } = await import("./ocrHelper");
		const result = await performOCRWithProgress(file, ocrPageNumber, ocrRegion, (progress: number) => {
			updateFile(fileIndex, { ocrProgress: progress });
		});

		const detectedNumber = result.detectedNumbers[0] || "NON DÉTECTÉ";

		// Marquer comme analysé
		updateFile(fileIndex, {
			numeroDossier: detectedNumber,
			status: "analyzed",
			ocrConfidence: result.confidence,
			detectedNumbers: result.detectedNumbers,
			ocrProgress: 100,
		});
	} catch (error) {
		updateFile(fileIndex, {
			numeroDossier: "ERREUR OCR",
			status: "error",
			error: error instanceof Error ? error.message : "Erreur OCR",
		});
	}
}

/**
 * Tamponne un fichier PDF analysé
 */
export async function stampFile(fileIndex: number, pdfFile: PDFFile, stampPosition: StampPosition, updateFile: (index: number, updates: Partial<PDFFile>) => void): Promise<void> {
	if (pdfFile.status !== "analyzed") return;
	try {
		// Marquer comme en cours de tamponnage
		updateFile(fileIndex, { status: "processing" });

		const dossiers = await getAllDossiers();
		const dossier = dossiers.find((d) => d.numero_dossier === pdfFile.numeroDossier);

		if (!dossier) {
			throw new Error("Numéro de dossier non trouvé dans la base de données");
		}

		const stampedBytes = await stampPDFWithAnomalyDetection(pdfFile.file, {
			position: stampPosition,
			text: dossier.valeur_tampon,
			fontSize: 14,
			color: { r: 0, g: 0, b: 0 },
		});

		// Marquer comme terminé
		updateFile(fileIndex, {
			status: "completed",
			stampedData: stampedBytes,
		});
	} catch (error) {
		updateFile(fileIndex, {
			status: "error",
			error: error instanceof Error ? error.message : "Erreur de tamponnage",
		});
	}
}

/**
 * Tamponne tous les fichiers analysés d'une liste
 */
export async function stampAllAnalyzedFiles(pdfFiles: PDFFile[], stampPosition: StampPosition, updateFile: (index: number, updates: Partial<PDFFile>) => void): Promise<void> {
	for (let i = 0; i < pdfFiles.length; i++) {
		const pdfFile = pdfFiles[i];

		// Tamponner seulement les fichiers analysés
		if (pdfFile.status === "analyzed" && pdfFile.numeroDossier !== "NON DÉTECTÉ") {
			await stampFile(i, pdfFile, stampPosition, updateFile);
		}
	}
}
