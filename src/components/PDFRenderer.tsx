import React, { ReactNode } from "react";
import { usePDFRenderer } from "../hooks/usePDFRenderer";
import { useCanvasCoordinates } from "../hooks/useCanvasCoordinates";
import { PDFRenderingProvider, PDFRenderingContextType } from "../contexts/PDFRenderingContext";
import PageNavigation from "./PageNavigation";

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
	canvasClassName = "cursor-crosshair mx-auto",
}) => {
	const { currentPage, pageCount, canvasRef, goToPage } = usePDFRenderer(pdfFile, {
		useReorientation: true,
		initialPage,
	});
	const { getCanvasCoordinates } = useCanvasCoordinates();

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
		currentPage,
		pageCount,
		getCanvasCoordinates: (e: React.MouseEvent<HTMLCanvasElement>) => getCanvasCoordinates(e, canvasRef.current!),
	};

	return (
		<div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6`}>
			{title && (
				<div className="mb-4">
					<div className="text-xl font-semibold text-gray-900 mb-2">{title}</div>
					{description && <p className="text-sm text-gray-600">{description}</p>}
				</div>
			)}

			<div className="mb-4 flex items-center justify-between">
				<PageNavigation currentPage={currentPage} pageCount={pageCount} onPageChange={handlePageChange} />
				{additionalControls}
			</div>

			<div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-auto bg-gray-50" style={{ maxHeight: "600px" }}>
				<canvas
					ref={canvasRef}
					className={canvasClassName}
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
