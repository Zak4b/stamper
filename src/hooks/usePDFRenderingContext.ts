import { useContext } from "react";
import { PDFRenderingContext } from "../contexts/PDFRenderingContext";

export function usePDFRenderingContext() {
	const context = useContext(PDFRenderingContext);
	if (!context) {
		throw new Error("usePDFRenderingContext must be used within a PDFRenderingProvider");
	}
	return context;
}
