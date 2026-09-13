import { useContext } from "react";
import { PDFPageContext } from "../contexts/PDFPageContext";

export function usePDFPageContext() {
	const context = useContext(PDFPageContext);
	if (!context) {
		throw new Error("usePDFPageContext must be used within a PDFPageProvider");
	}
	return context;
}
