import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
	currentPage: number;
	pageCount: number;
	onPageChange: (page: number) => void;
	disabled?: boolean;
}

const buttonClasses =
	"p-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors";

const PageNavigation: React.FC<Props> = ({ currentPage, pageCount, onPageChange, disabled = false }) => {
	return (
		<div className="flex items-center gap-2 shrink-0">
			<button
				onClick={() => onPageChange(Math.max(0, currentPage - 1))}
				disabled={disabled || currentPage === 0}
				className={buttonClasses}
				title="Page précédente"
				aria-label="Page précédente"
			>
				<ChevronLeft className="w-4 h-4" />
			</button>
			<span className="text-xs text-gray-600 tabular-nums whitespace-nowrap">
				{currentPage + 1} / {pageCount}
			</span>
			<button
				onClick={() => onPageChange(Math.min(pageCount - 1, currentPage + 1))}
				disabled={disabled || currentPage === pageCount - 1}
				className={buttonClasses}
				title="Page suivante"
				aria-label="Page suivante"
			>
				<ChevronRight className="w-4 h-4" />
			</button>
		</div>
	);
};

export default PageNavigation;
