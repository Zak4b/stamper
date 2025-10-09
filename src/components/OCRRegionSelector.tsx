import React, { useState, useEffect, useRef, useCallback } from "react";
import { Rectangle } from "tesseract.js";
import { Search } from "lucide-react";
import { usePDFRenderingContext } from "../hooks/usePDFRenderingContext";
import PDFRenderer from "./PDFRenderer";

interface Props {
	pdfFile: File;
	onRegionSelected: (region: Rectangle | undefined) => void;
	onPageChanged?: (pageNumber: number) => void;
	currentRegion?: Rectangle; // Région actuelle depuis le context
	initialPage?: number; // Page initiale depuis le context
}

// Composant pour afficher la région sélectionnée
const RegionOverlay: React.FC<{ region: Rectangle | null }> = ({ region }) => {
	const { canvasRef } = usePDFRenderingContext();

	if (!region || !canvasRef.current) return null;

	const canvas = canvasRef.current;

	return (
		<div
			className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none"
			style={{
				left: `${canvas.offsetLeft + (region.left / canvas.width) * canvas.offsetWidth}px`,
				top: `${canvas.offsetTop + (region.top / canvas.height) * canvas.offsetHeight}px`,
				width: `${(region.width / canvas.width) * canvas.offsetWidth}px`,
				height: `${(region.height / canvas.height) * canvas.offsetHeight}px`,
			}}
		/>
	);
};

// Hook personnalisé pour la logique de sélection de région
function useRegionSelection(initialRegion?: Rectangle | null) {
	const [isSelecting, setIsSelecting] = useState(false);
	const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
	const [region, setRegion] = useState<Rectangle | null>(initialRegion || null);

	const handleMouseDown = (x: number, y: number) => {
		setIsSelecting(true);
		setStartPos({ x, y });
		setRegion(null);
	};

	const handleMouseMove = (x: number, y: number) => {
		if (!isSelecting || !startPos) return;

		const left = Math.min(startPos.x, x);
		const top = Math.min(startPos.y, y);
		const width = Math.abs(x - startPos.x);
		const height = Math.abs(y - startPos.y);

		setRegion({ left, top, width, height });
	};

	const handleMouseUp = () => {
		setIsSelecting(false);
	};

	return {
		region,
		setRegion,
		mouseEventHandlers: {
			onMouseDown: handleMouseDown,
			onMouseMove: handleMouseMove,
			onMouseUp: handleMouseUp,
			onMouseLeave: handleMouseUp,
		},
	};
}

const OCRRegionSelector: React.FC<Props> = ({ pdfFile, onRegionSelected, onPageChanged, currentRegion, initialPage }) => {
	const [currentPage, setCurrentPage] = useState(initialPage || 0);
	const isInitialMount = useRef(true);
	const { region, setRegion, mouseEventHandlers } = useRegionSelection(currentRegion);

	// Synchroniser avec la région du context
	useEffect(() => {
		setRegion(currentRegion || null);
	}, [currentRegion, setRegion]);

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

	// Écouter les changements de région pour notifier le parent
	useEffect(() => {
		if (region && region.width > 10 && region.height > 10) {
			onRegionSelected(region);
		}
	}, [region, onRegionSelected]);

	function handleUseFullPage() {
		setRegion(null);
		onRegionSelected(undefined);
	}

	function handlePageChange(page: number) {
		setCurrentPage(page);
	}

	const additionalControls = (
		<button onClick={handleUseFullPage} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
			Utiliser la page complète
		</button>
	);

	return (
		<PDFRenderer
			pdfFile={pdfFile}
			initialPage={initialPage}
			onPageChange={handlePageChange}
			additionalControls={additionalControls}
			mouseEventHandlers={mouseEventHandlers}
			title={
				<div className="flex items-center gap-2">
					<Search className="w-5 h-5 text-blue-600" />
					<span>Zone de recherche du numéro de dossier</span>
				</div>
			}
			description="Sélectionnez la zone où se trouve le numéro de dossier en cliquant et glissant sur le PDF, ou utilisez la page complète pour une recherche automatique."
		>
			<RegionOverlay region={region} />
		</PDFRenderer>
	);
};

export default OCRRegionSelector;
