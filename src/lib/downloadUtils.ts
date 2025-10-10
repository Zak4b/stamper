import { PDFFile } from "../types/PDFFile";

/**
 * Télécharge tous les PDFs traités dans un fichier ZIP
 */
export async function downloadAll(pdfFiles: PDFFile[]): Promise<void> {
	const JSZip = (await import("jszip")).default;
	const zip = new JSZip();

	pdfFiles.forEach((pdfFile) => {
		if (pdfFile.status === "completed" && pdfFile.stampedData) {
			zip.file(`${pdfFile.docId}_tamponné.pdf`, new Uint8Array(pdfFile.stampedData));
		}
	});

	const content = await zip.generateAsync({ type: "blob" });
	const url = URL.createObjectURL(content);
	const a = document.createElement("a");
	a.href = url;
	a.download = "pdfs_tamponnés.zip";
	a.click();

	// Nettoyer l'URL après téléchargement
	setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Télécharge un PDF individuel
 */
export function downloadSingle(pdfFile: PDFFile): void {
	if (!pdfFile.stampedData) return;

	const blob = new Blob([new Uint8Array(pdfFile.stampedData)], { type: "application/pdf" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${pdfFile.docId}_tamponné.pdf`;
	a.click();

	// Nettoyer l'URL après téléchargement
	setTimeout(() => URL.revokeObjectURL(url), 100);
}
