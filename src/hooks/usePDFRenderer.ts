import { useState, useRef, useEffect, useCallback } from "react";
import { renderPDFPage, PDFRenderOptions } from "../lib/pdfRenderer";

interface UsePDFRendererOptions extends PDFRenderOptions {
	initialPage?: number;
}

export function usePDFRenderer(pdfFile: File, options: UsePDFRendererOptions = {}) {
	const [currentPage, setCurrentPage] = useState(options.initialPage || 0);
	const [pageCount, setPageCount] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	// Un rendu lancé pour une page peut se terminer après celui de la page suivante.
	// On ignore alors son résultat plutôt que d'écraser le canvas.
	const renderIdRef = useRef(0);

	const stableOptions = useRef(options);
	stableOptions.current = options;

	// Synchroniser avec la page initiale seulement quand initialPage change
	useEffect(() => {
		if (options.initialPage !== undefined) {
			setCurrentPage(options.initialPage);
		}
	}, [options.initialPage]);

	const loadPDF = useCallback(async () => {
		if (!canvasRef.current) return;

		const renderId = ++renderIdRef.current;
		setIsLoading(true);
		try {
			const pageInfo = await renderPDFPage(pdfFile, canvasRef.current, currentPage, stableOptions.current);
			if (renderId !== renderIdRef.current) return;
			setPageCount(pageInfo.pageCount);
		} catch (error) {
			console.error("Erreur lors du chargement du PDF:", error);
		} finally {
			if (renderId === renderIdRef.current) setIsLoading(false);
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
