import React, { ReactNode, useEffect, useRef } from "react";
import { renderPDFPage, type PDFPageSize } from "../../lib/pdfRenderer";
import { useCanvasCoordinates } from "../../hooks/useCanvasCoordinates";
import { PDFPageProvider, type PDFPageContextType } from "../../contexts/PDFPageContext";

export interface PageMouseEventHandlers {
	onClick?: (x: number, y: number, page: number) => void;
	onMouseDown?: (x: number, y: number, page: number) => void;
	onMouseMove?: (x: number, y: number, page: number) => void;
	onMouseUp?: (x: number, y: number, page: number) => void;
	onMouseLeave?: (x: number, y: number, page: number) => void;
}

interface Props {
	pdfFile: File;
	pageIndex: number;
	size: PDFPageSize;
	mouseEventHandlers?: PageMouseEventHandlers;
	canvasClassName?: string;
	children?: ReactNode;
	registerElement: (pageIndex: number, element: HTMLElement | null) => void;
}

const PDFPageCanvas: React.FC<Props> = ({ pdfFile, pageIndex, size, mouseEventHandlers, canvasClassName = "cursor-crosshair", children, registerElement }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const { getCanvasCoordinates } = useCanvasCoordinates();

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		let cancelled = false;
		renderPDFPage(pdfFile, canvas, pageIndex, { useReorientation: true }).catch((error) => {
			if (!cancelled) console.error(`Erreur lors du rendu de la page ${pageIndex + 1}:`, error);
		});

		return () => {
			cancelled = true;
		};
	}, [pdfFile, pageIndex]);

	const handleMouseEvent = (handler: ((x: number, y: number, page: number) => void) | undefined) => {
		if (!handler) return undefined;
		return (e: React.MouseEvent<HTMLCanvasElement>) => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			const { x, y } = getCanvasCoordinates(e, canvas);
			handler(x, y, pageIndex);
		};
	};

	const pageContext: PDFPageContextType = { pageIndex, width: size.width, height: size.height };

	return (
		<div
			ref={(el) => registerElement(pageIndex, el)}
			data-page-index={pageIndex}
			className="relative shrink-0 w-full bg-white shadow-sm"
			// La boîte a ses dimensions définitives avant même que le canvas ne soit
			// peint : pas de frame vide ni de saut de layout au montage.
			// `inline-size` fait de la page un conteneur de requête : les overlays
			// peuvent dimensionner leur texte en `cqw`, sans mesurer le canvas.
			style={{ aspectRatio: `${size.width} / ${size.height}`, containerType: "inline-size" }}
		>
			<canvas
				ref={canvasRef}
				className={`block w-full h-full ${canvasClassName}`}
				onClick={handleMouseEvent(mouseEventHandlers?.onClick)}
				onMouseDown={handleMouseEvent(mouseEventHandlers?.onMouseDown)}
				onMouseMove={handleMouseEvent(mouseEventHandlers?.onMouseMove)}
				onMouseUp={handleMouseEvent(mouseEventHandlers?.onMouseUp)}
				onMouseLeave={handleMouseEvent(mouseEventHandlers?.onMouseLeave)}
			/>
			<PDFPageProvider value={pageContext}>{children}</PDFPageProvider>
		</div>
	);
};

export default PDFPageCanvas;
