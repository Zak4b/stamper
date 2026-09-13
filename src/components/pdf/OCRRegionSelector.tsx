import React, { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { Rectangle } from "tesseract.js";
import { Search } from "lucide-react";
import { usePDFRenderingContext } from "../../hooks/usePDFRenderingContext";
import PDFRenderer from "./PDFRenderer";

interface Props {
	pdfFile: File;
	onRegionSelected: (region: Rectangle | undefined) => void;
	onPageChanged?: (pageNumber: number) => void;
	currentRegion?: Rectangle; // Région actuelle depuis le context
	initialPage?: number; // Page initiale depuis le context
	actions?: ReactNode; // Actions additionnelles affichées dans la barre d'outils
}

// Composant pour afficher la région sélectionnée
const RegionOverlay: React.FC<{ region: Rectangle | null }> = ({ region }) => {
	const { canvasMetrics } = usePDFRenderingContext();

	if (!region || !canvasMetrics.width || !canvasMetrics.height) return null;

	return (
		<div
			className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
			style={{
				left: `${canvasMetrics.offsetLeft + (region.left / canvasMetrics.width) * canvasMetrics.offsetWidth}px`,
				top: `${canvasMetrics.offsetTop + (region.top / canvasMetrics.height) * canvasMetrics.offsetHeight}px`,
				width: `${(region.width / canvasMetrics.width) * canvasMetrics.offsetWidth}px`,
				height: `${(region.height / canvasMetrics.height) * canvasMetrics.offsetHeight}px`,
			}}
		/>
	);
};

// Hook personnalisé pour la logique de sélection de région
function useRegionSelection(
	initialRegion: Rectangle | null | undefined,
	onSelectionCommitted?: (region: Rectangle | undefined) => void
) {
	const [isSelecting, setIsSelecting] = useState(false);
	const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
	const [region, setRegion] = useState<Rectangle | null>(initialRegion || null);
	const regionRef = useRef<Rectangle | null>(initialRegion || null);

	// Keep a ref for commit on mouseUp (avoid depending on `region` state in handlers)
	useEffect(() => {
		regionRef.current = region;
	}, [region]);

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

		const r = regionRef.current;
		if (onSelectionCommitted) {
			// Ne notifie que si la zone est suffisamment grande
			if (r && r.width > 10 && r.height > 10) onSelectionCommitted(r);
		}
	};

	return {
		isSelecting,
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

const OCRRegionSelector: React.FC<Props> = ({ pdfFile, onRegionSelected, onPageChanged, currentRegion, initialPage, actions }) => {
	const [currentPage, setCurrentPage] = useState(initialPage || 0);
	const isInitialMount = useRef(true);
	const { isSelecting, region, setRegion, mouseEventHandlers } = useRegionSelection(currentRegion, (r) => {
		onRegionSelected(r);
	});

	// Synchroniser avec la région du context
	useEffect(() => {
		// Pendant le drag de la souris, on laisse la région locale piloter l'affichage.
		// Sinon on peut créer une boucle de re-render (contexte -> props -> setRegion -> effet).
		if (isSelecting) return;

		setRegion((prev) => {
			const next = currentRegion || null;
			if (prev === next) return prev;
			if (!prev || !next) return next;
			if (prev.left === next.left && prev.top === next.top && prev.width === next.width && prev.height === next.height) return prev;
			return next;
		});
	}, [currentRegion, isSelecting, setRegion]);

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

	// Note: on ne notifie le parent qu'au mouseUp via `useRegionSelection`

	function handleUseFullPage() {
		setRegion(null);
		onRegionSelected(undefined);
	}

	function handlePageChange(page: number) {
		setCurrentPage(page);
	}

	const additionalControls = (
		<>
			<button onClick={handleUseFullPage} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-xs font-medium whitespace-nowrap">
				Page complète
			</button>
			{actions}
		</>
	);

	return (
		<PDFRenderer
			pdfFile={pdfFile}
			initialPage={initialPage}
			onPageChange={handlePageChange}
			additionalControls={additionalControls}
			mouseEventHandlers={mouseEventHandlers}
			title={
				<span className="flex items-center gap-2">
					<Search className="w-4 h-4 text-blue-600 shrink-0" />
					<span className="truncate">Zone de recherche du numéro de dossier</span>
				</span>
			}
			description="Sélectionnez la zone où se trouve le numéro de dossier en cliquant et glissant sur le PDF, ou utilisez la page complète pour une recherche automatique."
		>
			<RegionOverlay region={region} />
		</PDFRenderer>
	);
};

export default OCRRegionSelector;
