import React from "react";

interface Props {
	currentPage: number;
	pageCount: number;
	onPageChange: (page: number) => void;
	disabled?: boolean;
}

const PageNavigation: React.FC<Props> = ({ currentPage, pageCount, onPageChange, disabled = false }) => {
	return (
		<div className="flex items-center gap-4">
			<button
				onClick={() => onPageChange(Math.max(0, currentPage - 1))}
				disabled={disabled || currentPage === 0}
				className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				Page précédente
			</button>
			<span className="text-sm text-gray-600">
				Page {currentPage + 1} / {pageCount}
			</span>
			<button
				onClick={() => onPageChange(Math.min(pageCount - 1, currentPage + 1))}
				disabled={disabled || currentPage === pageCount - 1}
				className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				Page suivante
			</button>
		</div>
	);
};

export default PageNavigation;
