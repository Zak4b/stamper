import React, { useState, useEffect, useRef, type ReactNode } from "react";
import { Rectangle } from "tesseract.js";
import { Search } from "lucide-react";
import { usePDFPageContext } from "../../hooks/usePDFPageContext";
import PDFRenderer from "./PDFRenderer";

interface Props {
	pdfFile: File;
	onRegionSelected: (region: Rectangle | undefined) => void;
	onPageChanged?: (pageNumber: number) => void;
	currentRegion?: Rectangle; // Région actuelle depuis le store
	initialPage?: number; // Page initiale depuis le store
	actions?: ReactNode; // Actions additionnelles affichées dans la barre d'outils
}

/** Une région est toujours rattachée à la page sur laquelle elle a été tracée. */
interface PagedRegion {
	region: Rectangle;
	page: number;
}

// Composant pour afficher la région sélectionnée
const RegionOverlay: React.FC<{ selection: PagedRegion | null }> = ({ selection }) => {
	const { pageIndex, width, height } = usePDFPageContext();

	if (!selection || selection.page !== pageIndex) return null;

	const { region } = selection;

	return (
		<div
			className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
			style={{
				left: `${(region.left / width) * 100}%`,
				top: `${(region.top / height) * 100}%`,
				width: `${(region.width / width) * 100}%`,
				height: `${(region.height / height) * 100}%`,
			}}
		/>
	);
};

// Hook personnalisé pour la logique de sélection de région
function useRegionSelection(initialSelection: PagedRegion | null, onSelectionCommitted: (selection: PagedRegion) => void) {
	const [isSelecting, setIsSelecting] = useState(false);
	const [startPos, setStartPos] = useState<{ x: number; y: number; page: number } | null>(null);
	const [selection, setSelection] = useState<PagedRegion | null>(initialSelection);
	const selectionRef = useRef<PagedRegion | null>(initialSelection);

	// Keep a ref for commit on mouseUp (avoid depending on `selection` state in handlers)
	useEffect(() => {
		selectionRef.current = selection;
	}, [selection]);

	const handleMouseDown = (x: number, y: number, page: number) => {
		setIsSelecting(true);
		setStartPos({ x, y, page });
		setSelection(null);
	};

	const handleMouseMove = (x: number, y: number, page: number) => {
		// Un glissement qui déborde sur une autre page est ignoré : la zone reste
		// contenue dans la page où elle a commencé.
		if (!isSelecting || !startPos || page !== startPos.page) return;

		setSelection({
			page: startPos.page,
			region: {
				left: Math.min(startPos.x, x),
				top: Math.min(startPos.y, y),
				width: Math.abs(x - startPos.x),
				height: Math.abs(y - startPos.y),
			},
		});
	};

	const handleMouseUp = () => {
		if (!isSelecting) return;
		setIsSelecting(false);

		const current = selectionRef.current;
		// Ne notifie que si la zone est suffisamment grande
		if (current && current.region.width > 10 && current.region.height > 10) onSelectionCommitted(current);
	};

	return {
		isSelecting,
		selection,
		setSelection,
		mouseEventHandlers: {
			onMouseDown: handleMouseDown,
			onMouseMove: handleMouseMove,
			onMouseUp: handleMouseUp,
			onMouseLeave: handleMouseUp,
		},
	};
}

const OCRRegionSelector: React.FC<Props> = ({ pdfFile, onRegionSelected, onPageChanged, currentRegion, initialPage, actions }) => {
	// Page actuellement à l'écran : sert uniquement à « Page complète », qui n'a
	// pas de région pour porter sa page.
	const [visiblePage, setVisiblePage] = useState(initialPage ?? 0);

	const { isSelecting, selection, setSelection, mouseEventHandlers } = useRegionSelection(
		currentRegion ? { region: currentRegion, page: initialPage ?? 0 } : null,
		(committed) => {
			onRegionSelected(committed.region);
			onPageChanged?.(committed.page);
		}
	);

	// Synchroniser avec la région du store
	useEffect(() => {
		// Pendant le drag de la souris, on laisse la sélection locale piloter
		// l'affichage. Sinon on peut créer une boucle de re-render
		// (store -> props -> setSelection -> effet).
		if (isSelecting) return;

		setSelection((prev) => {
			if (!currentRegion) return prev === null ? prev : null;

			const page = prev?.page ?? initialPage ?? 0;
			const p = prev?.region;
			if (p && p.left === currentRegion.left && p.top === currentRegion.top && p.width === currentRegion.width && p.height === currentRegion.height) {
				return prev;
			}
			return { region: currentRegion, page };
		});
	}, [currentRegion, initialPage, isSelecting, setSelection]);

	function handleUseFullPage() {
		setSelection(null);
		onRegionSelected(undefined);
		onPageChanged?.(visiblePage);
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
			onPageChange={setVisiblePage}
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
			<RegionOverlay selection={selection} />
		</PDFRenderer>
	);
};

export default OCRRegionSelector;
