import { useState, useRef } from "react";
import { StampPosition } from "../lib/pdfStamper";
import { usePDFRenderer } from "../hooks/usePDFRenderer";
import { useCanvasCoordinates } from "../hooks/useCanvasCoordinates";
import PageNavigation from "./PageNavigation";

interface Props {
	pdfFile: File;
	onPositionSelected: (position: StampPosition) => void;
	currentPosition?: StampPosition;
}

export default function StampPositionSelector({ pdfFile, onPositionSelected, currentPosition }: Props) {
	const { currentPage, pageCount, canvasRef, goToPage } = usePDFRenderer(pdfFile, { useReorientation: true });
	const { getCanvasCoordinates } = useCanvasCoordinates();
	const [position, setPosition] = useState<StampPosition | null>(currentPosition || null);
	const containerRef = useRef<HTMLDivElement>(null);

	function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const coords = getCanvasCoordinates(e, canvas);
		const { x, y } = coords;

		const newPosition: StampPosition = { x, y, page: currentPage };
		setPosition(newPosition);
		onPositionSelected(newPosition);
	}

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<h2 className="text-xl font-semibold text-gray-900 mb-4">Sélectionner la position du tampon</h2>

			<div className="mb-4 flex items-center justify-between">
				<PageNavigation currentPage={currentPage} pageCount={pageCount} onPageChange={goToPage} />

				{position && (
					<div className="text-sm text-gray-600">
						Position: X={Math.round(position.x)}, Y={Math.round(position.y)}, Page={position.page + 1}
					</div>
				)}
			</div>

			<div ref={containerRef} className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-auto bg-gray-50" style={{ maxHeight: "600px" }}>
				<canvas ref={canvasRef} onClick={handleCanvasClick} className="cursor-crosshair mx-auto" />
				{position && position.page === currentPage && canvasRef.current && (
					<div
						className="absolute w-6 h-6 -ml-3 -mt-3 bg-red-500 rounded-full border-2 border-white shadow-lg pointer-events-none"
						style={{
							left: `${canvasRef.current.offsetLeft + (position.x / canvasRef.current.width) * canvasRef.current.offsetWidth}px`,
							top: `${canvasRef.current.offsetTop + (position.y / canvasRef.current.height) * canvasRef.current.offsetHeight}px`,
						}}
					/>
				)}
			</div>
		</div>
	);
}
