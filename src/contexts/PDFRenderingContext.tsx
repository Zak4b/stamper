import { createContext, ReactNode } from "react";

export interface PDFRenderingContextType {
	canvasRef: React.RefObject<HTMLCanvasElement | null>;
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
