import React, { useState } from "react";
import { StampPosition } from "../../lib/pdfStamper";
import { usePDFRenderingContext } from "../../hooks/usePDFRenderingContext";
import PDFRenderer from "./PDFRenderer";
import { appConfig } from "../../config/appConfig";
import { PDF_RENDER_SCALE } from "../../config/pdfRender";

interface Props {
	pdfFile: File;
	onPositionSelected: (position: StampPosition) => void;
	currentPosition?: StampPosition;
}

// Composant pour afficher la position sélectionnée
const PositionMarker: React.FC<{ position: StampPosition | null }> = ({ position }) => {
	const { canvasRef, currentPage } = usePDFRenderingContext();

	if (!position || position.page !== currentPage || !canvasRef.current) return null;

	const canvas = canvasRef.current;
	const scale = PDF_RENDER_SCALE;

	return (
		<div
			className="absolute pointer-events-none whitespace-nowrap select-none bg-white/80 border border-blue-600 rounded px-1"
			style={{
				left: `${canvas.offsetLeft + (position.x / canvas.width) * canvas.offsetWidth}px`,
				top: `${canvas.offsetTop + (position.y / canvas.height) * canvas.offsetHeight}px`,
				fontFamily: appConfig.stampStyle.fontFamily,
				fontSize: `${appConfig.stampStyle.fontSize * scale}px`,
				color: appConfig.stampStyle.fontColor,
				lineHeight: 1,
				transform: "translateY(calc(-100% + 0.25em))",
			}}
		>
			{`${new Date().toLocaleDateString("fr-FR", {
				day: "numeric",
				month: "numeric",
				year: "numeric",
			})}`}
		</div>
	);
};

const StampPositionSelector: React.FC<Props> = ({ pdfFile, onPositionSelected, currentPosition }) => {
	const [position, setPosition] = useState<StampPosition | null>(currentPosition || null);
	const [currentPage, setCurrentPage] = useState(0);
	const [isDragging, setIsDragging] = useState(false);

	function handleMouseDown(x: number, y: number) {
		setIsDragging(true);
		const newPosition: StampPosition = { x, y, page: currentPage };
		setPosition(newPosition);
	}

	function handleMouseMove(x: number, y: number) {
		if (isDragging) {
			const newPosition: StampPosition = { x, y, page: currentPage };
			setPosition(newPosition);
		}
	}

	function handleMouseUp() {
		if (isDragging && position) {
			setIsDragging(false);
			onPositionSelected(position);
		}
	}

	function handleMouseLeave() {
		if (isDragging && position) {
			setIsDragging(false);
			onPositionSelected(position);
		}
	}

	function handlePageChange(page: number) {
		setCurrentPage(page);
	}

	const mouseEventHandlers = {
		onMouseDown: handleMouseDown,
		onMouseMove: handleMouseMove,
		onMouseUp: handleMouseUp,
		onMouseLeave: handleMouseLeave,
	};

	const additionalControls = position && (
		<div className="text-sm text-gray-600">
			Position: X={Math.round(position.x)}, Y={Math.round(position.y)}, Page={position.page + 1}
		</div>
	);

	return (
		<PDFRenderer
			pdfFile={pdfFile}
			onPageChange={handlePageChange}
			title="Sélectionner la position du tampon"
			additionalControls={additionalControls}
			mouseEventHandlers={mouseEventHandlers}
			canvasClassName={isDragging ? "cursor-grabbing mx-auto" : "cursor-grab mx-auto"}
		>
			<PositionMarker position={position} />
		</PDFRenderer>
	);
};

export default StampPositionSelector;
