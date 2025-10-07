import * as pdfjsLib from "pdfjs-dist";

// Configuration du worker pour PDF.js
// Vite va automatiquement résoudre le chemin vers le worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

// Export de pdfjsLib pour utilisation dans l'application
export { pdfjsLib };
export type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
