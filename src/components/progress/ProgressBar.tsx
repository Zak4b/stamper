import React from "react";

interface ProgressBarProps {
	processed: number;
	total: number;
	success: number;
	errors: number;
	isProcessing: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ processed, total, success, errors, isProcessing }) => {
	const percentage = total > 0 ? (processed / total) * 100 : 0;
	const successPercentage = total > 0 ? (success / total) * 100 : 0;
	const errorPercentage = total > 0 ? (errors / total) * 100 : 0;

	return (
		<div className="mb-6 p-4 bg-gray-50 rounded-lg">
			<div className="flex items-center justify-between mb-3">
				<h3 className="text-sm font-semibold text-gray-700">Progression du traitement</h3>
				<div className="text-sm text-gray-600">
					{processed} / {total} documents traités
				</div>
			</div>

			<div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
				<div className="h-full flex">
					{/* Barre de succès (vert) */}
					<div className="bg-green-500 transition-all duration-300" style={{ width: `${successPercentage}%` }} />
					{/* Barre d'erreurs (rouge) */}
					<div className="bg-red-500 transition-all duration-300" style={{ width: `${errorPercentage}%` }} />
					{/* Barre de progression (si en cours) */}
					{isProcessing && processed < total && (
						<div className="bg-blue-500 animate-pulse transition-all duration-300" style={{ width: `${(Math.min(5, total - processed) / total) * 100}%` }} />
					)}
				</div>
			</div>

			<div className="flex items-center justify-between text-xs text-gray-600">
				<div className="flex gap-4">
					<div className="flex items-center gap-1">
						<div className="w-2 h-2 bg-green-500 rounded-full"></div>
						<span>{success} réussis</span>
					</div>
					{errors > 0 && (
						<div className="flex items-center gap-1">
							<div className="w-2 h-2 bg-red-500 rounded-full"></div>
							<span>{errors} erreurs</span>
						</div>
					)}
					{isProcessing && (
						<div className="flex items-center gap-1">
							<div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
							<span>Traitement en cours...</span>
						</div>
					)}
				</div>
				<div>{Math.round(percentage)}% terminé</div>
			</div>
		</div>
	);
};

export default ProgressBar;
