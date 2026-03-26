// Single source of truth for the canvas/render scale used across the app.
// This scale is applied both when previewing pages (PDF.js) and when generating
// OCR canvases, and it must be consistent with the canvas -> PDF-lib coordinate mapping.
export const PDF_RENDER_SCALE = 1.5;

export function canvasToPdfUnits(valueInCanvasPixels: number): number {
	return valueInCanvasPixels / PDF_RENDER_SCALE;
}

