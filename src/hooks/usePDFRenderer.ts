import { useState, useRef, useEffect, useCallback } from "react";
import { renderPDFPage, PDFRenderOptions } from "../lib/pdfRenderer";

export function usePDFRenderer(pdfFile: File, options: PDFRenderOptions = {}) {
	const [currentPage, setCurrentPage] = useState(0);
	const [pageCount, setPageCount] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const stableOptions = useRef(options);
	stableOptions.current = options;

	const loadPDF = useCallback(async () => {
		if (!canvasRef.current) return;

		setIsLoading(true);
		try {
			const pageInfo = await renderPDFPage(pdfFile, canvasRef.current, currentPage, stableOptions.current);
			setPageCount(pageInfo.pageCount);
		} catch (error) {
			console.error("Erreur lors du chargement du PDF:", error);
		} finally {
			setIsLoading(false);
		}
	}, [pdfFile, currentPage]);

	useEffect(() => {
		loadPDF();
	}, [loadPDF]);

	const goToPage = useCallback(
		(page: number) => {
			if (page >= 0 && page < pageCount) {
				setCurrentPage(page);
			}
		},
		[pageCount]
	);

	return {
		currentPage,
		pageCount,
		isLoading,
		canvasRef,
		goToPage,
	};
}
