import React, { useState } from "react";
import { StampPosition } from "../../lib/pdfStamper";
import { usePDFRenderingContext } from "../../hooks/usePDFRenderingContext";
import PDFRenderer from "./PDFRenderer";

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

	return (
		<div
			className="absolute w-6 h-6 -ml-3 -mt-3 bg-red-500 rounded-full border-2 border-white shadow-lg pointer-events-none"
			style={{
				left: `${canvas.offsetLeft + (position.x / canvas.width) * canvas.offsetWidth}px`,
				top: `${canvas.offsetTop + (position.y / canvas.height) * canvas.offsetHeight}px`,
			}}
		/>
	);
};

const StampPositionSelector: React.FC<Props> = ({ pdfFile, onPositionSelected, currentPosition }) => {
	const [position, setPosition] = useState<StampPosition | null>(currentPosition || null);
	const [currentPage, setCurrentPage] = useState(0);

	function handleCanvasClick(x: number, y: number) {
		const newPosition: StampPosition = { x, y, page: currentPage };
		setPosition(newPosition);
		onPositionSelected(newPosition);
	}

	function handlePageChange(page: number) {
		setCurrentPage(page);
	}

	const mouseEventHandlers = {
		onClick: handleCanvasClick,
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
		>
			<PositionMarker position={position} />
		</PDFRenderer>
	);
};

export default StampPositionSelector;
