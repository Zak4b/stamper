import React, { useState, type ReactNode } from "react";
import { StampPosition } from "../../lib/pdfStamper";
import { usePDFPageContext } from "../../hooks/usePDFPageContext";
import PDFRenderer from "./PDFRenderer";
import { appConfig } from "../../config/appConfig";
import { PDF_RENDER_SCALE } from "../../config/pdfRender";

interface Props {
	pdfFile: File;
	onPositionSelected: (position: StampPosition) => void;
	currentPosition?: StampPosition;
	actions?: ReactNode; // Actions additionnelles affichées dans la barre d'outils
}

// Composant pour afficher la position sélectionnée
const PositionMarker: React.FC<{ position: StampPosition | null }> = ({ position }) => {
	const { pageIndex, width, height } = usePDFPageContext();

	if (!position || position.page !== pageIndex) return null;

	// Position et taille exprimées relativement à la page : elles suivent la
	// largeur d'affichage du canvas sans aucune mesure JS (`cqw` = 1% de la
	// largeur du conteneur, voir `containerType` sur le wrapper de page).
	const fontSizeInCqw = ((appConfig.stampStyle.fontSize * PDF_RENDER_SCALE) / width) * 100;

	return (
		<div
			className="absolute pointer-events-none whitespace-nowrap select-none bg-white/80 border border-blue-600 rounded px-1"
			style={{
				left: `${(position.x / width) * 100}%`,
				top: `${(position.y / height) * 100}%`,
				fontFamily: appConfig.stampStyle.fontFamily,
				fontSize: `${fontSizeInCqw}cqw`,
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

const StampPositionSelector: React.FC<Props> = ({ pdfFile, onPositionSelected, currentPosition, actions }) => {
	const [position, setPosition] = useState<StampPosition | null>(currentPosition || null);
	// Page sur laquelle le glissement a commencé : un déplacement qui déborde sur
	// la page suivante ne doit pas déplacer le tampon de page.
	const [dragPage, setDragPage] = useState<number | null>(null);

	function handleMouseDown(x: number, y: number, page: number) {
		setDragPage(page);
		setPosition({ x, y, page });
	}

	function handleMouseMove(x: number, y: number, page: number) {
		if (dragPage === null || page !== dragPage) return;
		setPosition({ x, y, page });
	}

	function commitDrag() {
		if (dragPage === null) return;
		setDragPage(null);
		if (position) onPositionSelected(position);
	}

	const mouseEventHandlers = {
		onMouseDown: handleMouseDown,
		onMouseMove: handleMouseMove,
		onMouseUp: commitDrag,
		onMouseLeave: commitDrag,
	};

	const additionalControls = (
		<>
			{position && (
				<span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
					X {Math.round(position.x)} · Y {Math.round(position.y)} · p.{position.page + 1}
				</span>
			)}
			{actions}
		</>
	);

	return (
		<PDFRenderer
			pdfFile={pdfFile}
			initialPage={currentPosition?.page}
			title="Sélectionner la position du tampon"
			additionalControls={additionalControls}
			mouseEventHandlers={mouseEventHandlers}
			canvasClassName={dragPage !== null ? "cursor-grabbing" : "cursor-grab"}
		>
			<PositionMarker position={position} />
		</PDFRenderer>
	);
};

export default StampPositionSelector;
