import { useState, useEffect, useRef, useCallback } from "react";
import { Rectangle } from "tesseract.js";
import { Search } from "lucide-react";
import { usePDFRenderer } from "../hooks/usePDFRenderer";
import { useCanvasCoordinates } from "../hooks/useCanvasCoordinates";
import PageNavigation from "./PageNavigation";

interface Props {
	pdfFile: File;
	onRegionSelected: (region: Rectangle | undefined) => void;
	onPageChanged?: (pageNumber: number) => void;
	currentRegion?: Rectangle; // Région actuelle depuis le context
	initialPage?: number; // Page initiale depuis le context
}

export default function OCRRegionSelector({ pdfFile, onRegionSelected, onPageChanged, currentRegion, initialPage }: Props) {
	const { currentPage, pageCount, canvasRef, goToPage } = usePDFRenderer(pdfFile, { useReorientation: true, initialPage });
	const { getCanvasCoordinates } = useCanvasCoordinates();
	const [isSelecting, setIsSelecting] = useState(false);
	const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
	const [region, setRegion] = useState<Rectangle | null>(currentRegion || null);
	const isInitialMount = useRef(true);

	// Synchroniser avec la région du context
	useEffect(() => {
		setRegion(currentRegion || null);
	}, [currentRegion]);

	// Stable callback pour éviter les re-renders
	const stableOnPageChanged = useCallback(
		(page: number) => {
			onPageChanged?.(page);
		},
		[onPageChanged]
	);

	// Appeler onPageChanged seulement après la première initialisation
	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
			return;
		}
		stableOnPageChanged(currentPage);
	}, [currentPage, stableOnPageChanged]);

	function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const coords = getCanvasCoordinates(e, canvas);

		setIsSelecting(true);
		setStartPos(coords);
		setRegion(null);
	}

	function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
		if (!isSelecting || !startPos) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const coords = getCanvasCoordinates(e, canvas);

		const { x, y } = coords;
		const left = Math.min(startPos.x, x);
		const top = Math.min(startPos.y, y);
		const width = Math.abs(x - startPos.x);
		const height = Math.abs(y - startPos.y);

		setRegion({ left, top, width, height });
	}

	function handleMouseUp() {
		setIsSelecting(false);
		if (region && region.width > 10 && region.height > 10) {
			onRegionSelected(region);
		}
	}

	function handleUseFullPage() {
		setRegion(null);
		onRegionSelected(undefined);
	}

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div className="flex items-center gap-2 mb-4">
				<Search className="w-5 h-5 text-blue-600" />
				<h3 className="text-lg font-semibold text-gray-900">Zone de recherche du numéro de dossier</h3>
			</div>

			<p className="text-sm text-gray-600 mb-4">
				Sélectionnez la zone où se trouve le numéro de dossier en cliquant et glissant sur le PDF, ou utilisez la page complète pour une recherche automatique.
			</p>

			<div className="mb-4 flex items-center justify-between">
				<PageNavigation currentPage={currentPage} pageCount={pageCount} onPageChange={goToPage} />

				<button onClick={handleUseFullPage} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
					Utiliser la page complète
				</button>
			</div>

			<div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-auto bg-gray-50" style={{ maxHeight: "600px" }}>
				<canvas
					ref={canvasRef}
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseUp}
					className="cursor-crosshair mx-auto"
				/>
				{region && canvasRef.current && (
					<div
						className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none"
						style={{
							left: `${canvasRef.current.offsetLeft + (region.left / canvasRef.current.width) * canvasRef.current.offsetWidth}px`,
							top: `${canvasRef.current.offsetTop + (region.top / canvasRef.current.height) * canvasRef.current.offsetHeight}px`,
							width: `${(region.width / canvasRef.current.width) * canvasRef.current.offsetWidth}px`,
							height: `${(region.height / canvasRef.current.height) * canvasRef.current.offsetHeight}px`,
						}}
					/>
				)}
			</div>
		</div>
	);
}
