import { PDFFile } from "../types/PDFFile";

export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");

	a.href = url;
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

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
	downloadBlob(content, "pdfs_tamponnés.zip");
}

/**
 * Télécharge un PDF individuel
 */
export function downloadSingle(pdfFile: PDFFile): void {
	if (!pdfFile.stampedData || !pdfFile.docId) return;

	const blob = new Blob([new Uint8Array(pdfFile.stampedData)], { type: "application/pdf" });
	downloadBlob(blob, `${pdfFile.docId}_tamponné.pdf`);
}
