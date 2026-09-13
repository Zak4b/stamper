import { createContext, ReactNode } from "react";

/**
 * Géométrie mesurée du canvas : taille interne (pixels de rendu PDF) et taille
 * réellement affichée (le canvas est réduit pour tenir dans la hauteur dispo).
 * Les overlays s'appuient dessus plutôt que sur le ref, pour rester alignés.
 */
export interface CanvasMetrics {
	width: number;
	height: number;
	offsetLeft: number;
	offsetTop: number;
	offsetWidth: number;
	offsetHeight: number;
}

export const EMPTY_CANVAS_METRICS: CanvasMetrics = { width: 0, height: 0, offsetLeft: 0, offsetTop: 0, offsetWidth: 0, offsetHeight: 0 };

export interface PDFRenderingContextType {
	canvasRef: React.RefObject<HTMLCanvasElement | null>;
	canvasMetrics: CanvasMetrics;
	currentPage: number;
	pageCount: number;
	getCanvasCoordinates: (e: React.MouseEvent<HTMLCanvasElement>) => { x: number; y: number };
}

const PDFRenderingContext = createContext<PDFRenderingContextType | null>(null);

interface PDFRenderingProviderProps {
	value: PDFRenderingContextType;
	children: ReactNode;
}

export function PDFRenderingProvider({ value, children }: PDFRenderingProviderProps) {
	return <PDFRenderingContext.Provider value={value}>{children}</PDFRenderingContext.Provider>;
}

export { PDFRenderingContext };
