import { useContext } from "react";
import { PDFContext } from "../contexts/PDFContext";

// Infer the type from the context value
type PDFContextType = NonNullable<Parameters<typeof PDFContext.Provider>[0]["value"]>;

export function usePDFContext(): PDFContextType {
	const context = useContext(PDFContext);
	if (context === undefined) {
		throw new Error("usePDFContext must be used within a PDFProvider");
	}
	return context;
}
