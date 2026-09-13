import React, { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { getPDFPageSizes, type PDFPageSize } from "../../lib/pdfRenderer";
import PDFPageCanvas, { type PageMouseEventHandlers } from "./PDFPageCanvas";
import PageNavigation from "../navigation/PageNavigation";

interface Props {
	pdfFile: File;
	initialPage?: number;
	children?: ReactNode;
	onPageChange?: (pageNumber: number) => void;
	additionalControls?: ReactNode;
	title?: ReactNode;
	description?: string;
	mouseEventHandlers?: PageMouseEventHandlers;
	canvasClassName?: string;
}

/**
 * Affiche toutes les pages du PDF les unes sous les autres, un canvas par page.
 *
 * Les documents traités font une dizaine de pages au maximum : toutes les pages
 * sont rendues, sans virtualisation. `children` est rendu une fois par page,
 * dans le contexte de cette page : un overlay se filtre lui-même via `pageIndex`.
 */
const NO_PAGES: PDFPageSize[] = [];

const PDFRenderer: React.FC<Props> = ({
	pdfFile,
	initialPage,
	children,
	additionalControls,
	onPageChange,
	title,
	description,
	mouseEventHandlers,
	canvasClassName,
}) => {
	// Les dimensions sont stockées avec le fichier auquel elles appartiennent :
	// changer de PDF les invalide par dérivation, sans reset dans un effet.
	const [loaded, setLoaded] = useState<{ file: File; sizes: PDFPageSize[] } | null>(null);
	const pageSizes = loaded?.file === pdfFile ? loaded.sizes : NO_PAGES;
	const [visiblePage, setVisiblePage] = useState(initialPage ?? 0);
	const scrollRef = useRef<HTMLDivElement>(null);
	const pageElements = useRef(new Map<number, HTMLElement>());
	const hasScrolledToInitial = useRef(false);

	const registerElement = useCallback((pageIndex: number, element: HTMLElement | null) => {
		if (element) pageElements.current.set(pageIndex, element);
		else pageElements.current.delete(pageIndex);
	}, []);

	useEffect(() => {
		let cancelled = false;
		hasScrolledToInitial.current = false;

		getPDFPageSizes(pdfFile, { useReorientation: true })
			.then((sizes) => {
				if (!cancelled) setLoaded({ file: pdfFile, sizes });
			})
			.catch((error) => console.error("Erreur lors du chargement du PDF:", error));

		return () => {
			cancelled = true;
		};
	}, [pdfFile]);

	// Page « courante » = la plus visible dans le conteneur scrollable.
	useEffect(() => {
		const root = scrollRef.current;
		if (!root || pageSizes.length === 0) return;

		const ratios = new Map<number, number>();
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const index = Number((entry.target as HTMLElement).dataset.pageIndex);
					ratios.set(index, entry.intersectionRatio);
				}

				let best = -1;
				let bestRatio = 0;
				for (const [index, ratio] of ratios) {
					if (ratio > bestRatio) {
						bestRatio = ratio;
						best = index;
					}
				}
				if (best >= 0) setVisiblePage(best);
			},
			{ root, threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
		);

		pageElements.current.forEach((element) => observer.observe(element));
		return () => observer.disconnect();
	}, [pageSizes]);

	useEffect(() => {
		onPageChange?.(visiblePage);
	}, [visiblePage, onPageChange]);

	const scrollToPage = useCallback((page: number, behavior: ScrollBehavior = "smooth") => {
		const element = pageElements.current.get(page);
		if (!element) return;
		element.scrollIntoView({ block: "start", behavior });
	}, []);

	// Ouvrir directement sur la page mémorisée (zone OCR déjà choisie, par exemple).
	useEffect(() => {
		if (hasScrolledToInitial.current || pageSizes.length === 0) return;
		hasScrolledToInitial.current = true;
		if (initialPage) scrollToPage(initialPage, "auto");
	}, [pageSizes, initialPage, scrollToPage]);

	return (
		<div className="flex-1 min-h-0 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
			{/* Barre d'outils compacte : titre, aide, pagination et contrôles sur une seule ligne */}
			<div className="shrink-0 flex items-center gap-3 px-3 h-12 border-b border-gray-100">
				{title && (
					<div className="flex items-center gap-2 min-w-0 text-sm font-semibold text-gray-900">
						<span className="truncate">{title}</span>
						{description && (
							<span title={description} className="text-gray-400 hover:text-gray-600 transition-colors cursor-help shrink-0">
								<Info className="w-4 h-4" />
							</span>
						)}
					</div>
				)}
				<div className="flex-1" />
				{additionalControls}
				<PageNavigation currentPage={visiblePage} pageCount={Math.max(pageSizes.length, 1)} onPageChange={scrollToPage} disabled={pageSizes.length === 0} />
			</div>

			<div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto bg-gray-100 rounded-b-lg">
				<div className="mx-auto w-full max-w-3xl flex flex-col gap-3 p-3">
					{pageSizes.map((size, index) => (
						<PDFPageCanvas
							key={index}
							pdfFile={pdfFile}
							pageIndex={index}
							size={size}
							mouseEventHandlers={mouseEventHandlers}
							canvasClassName={canvasClassName}
							registerElement={registerElement}
						>
							{children}
						</PDFPageCanvas>
					))}
				</div>
			</div>
		</div>
	);
};

export default PDFRenderer;
