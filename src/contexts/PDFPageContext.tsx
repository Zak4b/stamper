import { createContext, ReactNode } from "react";

/**
 * Géométrie d'une page rendue, en pixels de rendu (échelle PDF_RENDER_SCALE).
 * Les overlays se positionnent en pourcentage de ces dimensions : ils suivent
 * donc automatiquement la taille d'affichage du canvas, sans mesure JS.
 */
export interface PDFPageContextType {
	pageIndex: number;
	width: number;
	height: number;
}

const PDFPageContext = createContext<PDFPageContextType | null>(null);

interface PDFPageProviderProps {
	value: PDFPageContextType;
	children: ReactNode;
}

export function PDFPageProvider({ value, children }: PDFPageProviderProps) {
	return <PDFPageContext.Provider value={value}>{children}</PDFPageContext.Provider>;
}

export { PDFPageContext };
