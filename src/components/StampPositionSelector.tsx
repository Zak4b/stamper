import { useState, useRef } from "react";
import { StampPosition } from "../lib/pdfStamper";
import { usePDFRenderer } from "../hooks/usePDFRenderer";
import { useCanvasCoordinates } from "../hooks/useCanvasCoordinates";

interface Props {
	pdfFile: File;
	onPositionSelected: (position: StampPosition) => void;
	currentPosition?: StampPosition;
}

export default function StampPositionSelector({ pdfFile, onPositionSelected, currentPosition }: Props) {
	const { currentPage, pageCount, canvasRef, goToPage } = usePDFRenderer(pdfFile, { useReorientation: true });
	const { getCanvasCoordinates } = useCanvasCoordinates();
	const [position, setPosition] = useState<StampPosition>(currentPosition || { x: 50, y: 50, page: 0 });
	const containerRef = useRef<HTMLDivElement>(null);

	function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const coords = getCanvasCoordinates(e, canvas);
		const { x, y } = coords;

		const newPosition = { x, y, page: currentPage };
		setPosition(newPosition);
		onPositionSelected(newPosition);
	}

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<h2 className="text-xl font-semibold text-gray-900 mb-4">Sélectionner la position du tampon</h2>

			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<button
						onClick={() => goToPage(Math.max(0, currentPage - 1))}
						disabled={currentPage === 0}
						className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						Page précédente
					</button>
					<span className="text-sm text-gray-600">
						Page {currentPage + 1} / {pageCount}
					</span>
					<button
						onClick={() => goToPage(Math.min(pageCount - 1, currentPage + 1))}
						disabled={currentPage === pageCount - 1}
						className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						Page suivante
					</button>
				</div>

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

			<p className="mt-4 text-sm text-gray-600">Cliquez sur le PDF pour définir la position du tampon. Un point rouge indique l'emplacement sélectionné.</p>
		</div>
	);
}
