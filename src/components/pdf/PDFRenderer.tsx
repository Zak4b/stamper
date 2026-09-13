import React, { ReactNode, useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Info } from "lucide-react";
import { usePDFRenderer } from "../../hooks/usePDFRenderer";
import { useCanvasCoordinates } from "../../hooks/useCanvasCoordinates";
import { PDFRenderingProvider, PDFRenderingContextType, type CanvasMetrics, EMPTY_CANVAS_METRICS } from "../../contexts/PDFRenderingContext";
import PageNavigation from "../navigation/PageNavigation";

interface MouseEventHandlers {
	onClick?: (x: number, y: number) => void;
	onMouseDown?: (x: number, y: number) => void;
	onMouseMove?: (x: number, y: number) => void;
	onMouseUp?: (x: number, y: number) => void;
	onMouseLeave?: (x: number, y: number) => void;
}

interface Props {
	pdfFile: File;
	initialPage?: number;
	children?: ReactNode;
	onPageChange?: (pageNumber: number) => void;
	additionalControls?: ReactNode;
	title?: ReactNode;
	description?: string;
	mouseEventHandlers?: MouseEventHandlers;
	canvasClassName?: string;
}

const PDFRenderer: React.FC<Props> = ({
	pdfFile,
	initialPage,
	children,
	additionalControls,
	onPageChange,
	title,
	description,
	mouseEventHandlers,
	canvasClassName = "cursor-crosshair",
}) => {
	const { currentPage, pageCount, canvasRef, goToPage } = usePDFRenderer(pdfFile, {
		useReorientation: true,
		initialPage,
	});
	const { getCanvasCoordinates } = useCanvasCoordinates();
	// Le canvas est réduit à l'écran pour tenir dans la hauteur disponible : on mesure
	// sa géométrie pour que les overlays (région OCR, tampon) suivent le redimensionnement.
	const [canvasMetrics, setCanvasMetrics] = useState<CanvasMetrics>(EMPTY_CANVAS_METRICS);

	const measureCanvas = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		setCanvasMetrics((prev) => {
			const next: CanvasMetrics = {
				width: canvas.width,
				height: canvas.height,
				offsetLeft: canvas.offsetLeft,
				offsetTop: canvas.offsetTop,
				offsetWidth: canvas.offsetWidth,
				offsetHeight: canvas.offsetHeight,
			};
			const unchanged = (Object.keys(next) as (keyof CanvasMetrics)[]).every((key) => prev[key] === next[key]);
			return unchanged ? prev : next;
		});
	}, [canvasRef]);

	// Mesure après chaque rendu de page (la taille interne du canvas change avec la page).
	useLayoutEffect(measureCanvas);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const observer = new ResizeObserver(measureCanvas);
		observer.observe(canvas);
		return () => observer.disconnect();
	}, [canvasRef, measureCanvas]);

	const handlePageChange = (page: number) => {
		goToPage(page);
		onPageChange?.(page);
	};

	// Fonctions pour convertir les événements souris en coordonnées x,y
	const handleMouseEvent = (handler: ((x: number, y: number) => void) | undefined) => {
		if (!handler) return undefined;
		return (e: React.MouseEvent<HTMLCanvasElement>) => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			const { x, y } = getCanvasCoordinates(e, canvas);
			handler(x, y);
		};
	};

	// Contexte pour les enfants
	const renderingContextValue: PDFRenderingContextType = {
		canvasRef,
		canvasMetrics,
		currentPage,
		pageCount,
		getCanvasCoordinates: (e: React.MouseEvent<HTMLCanvasElement>) => getCanvasCoordinates(e, canvasRef.current!),
	};

	return (
		<div className="flex-1 min-h-0 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
			{/* Barre d'outils compacte : titre, aide, pagination et contrôles sur une seule ligne */}
			<div className="shrink-0 flex items-center gap-3 px-3 h-12 border-b border-gray-100">
				{title && (
					<div className="flex items-center gap-2 min-w-0 text-sm font-semibold text-gray-900">
						<span className="truncate">{title}</span>
						{description && (
							<span title={description} className="text-gray-400 hover:text-gray-600 transition-colors cursor-help shrink-0">
								<Info className="w-4 h-4" />
							</span>
						)}
					</div>
				)}
				<div className="flex-1" />
				{additionalControls}
				<PageNavigation currentPage={currentPage} pageCount={pageCount} onPageChange={handlePageChange} />
			</div>

			<div className="relative flex-1 min-h-0 overflow-auto bg-gray-100 rounded-b-lg flex items-start justify-center p-2">
				<canvas
					ref={canvasRef}
					className={`block max-w-full max-h-full object-contain shadow-sm ${canvasClassName}`}
					onClick={handleMouseEvent(mouseEventHandlers?.onClick)}
					onMouseDown={handleMouseEvent(mouseEventHandlers?.onMouseDown)}
					onMouseMove={handleMouseEvent(mouseEventHandlers?.onMouseMove)}
					onMouseUp={handleMouseEvent(mouseEventHandlers?.onMouseUp)}
					onMouseLeave={handleMouseEvent(mouseEventHandlers?.onMouseLeave)}
				/>
				<PDFRenderingProvider value={renderingContextValue}>{children}</PDFRenderingProvider>
			</div>
		</div>
	);
};

export default PDFRenderer;
