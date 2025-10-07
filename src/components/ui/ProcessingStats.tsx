interface ProcessingStatsProps {
	total: number;
	pending: number;
	ocr: number;
	analyzed: number;
	completed: number;
	errors: number;
	isProcessing: boolean;
}

export default function ProcessingStats({ total, pending, ocr, analyzed, completed, errors, isProcessing }: ProcessingStatsProps) {
	const finished = completed + errors;
	const percentage = total > 0 ? (finished / total) * 100 : 0;

	return (
		<div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-gray-800">État du traitement</h3>
				<div className="text-sm font-mono text-gray-600 bg-white px-3 py-1 rounded-full">
					{completed} / {total} terminés ({Math.round(percentage)}%)
				</div>
			</div>

			{/* Barre de progression principale */}
			<div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden shadow-inner">
				<div className="h-full flex">
					<div className="bg-green-500 transition-all duration-500" style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }} title={`${completed} terminés`} />
					<div className="bg-red-500 transition-all duration-500" style={{ width: `${total > 0 ? (errors / total) * 100 : 0}%` }} title={`${errors} erreurs`} />
					<div
						className="bg-blue-500 animate-pulse transition-all duration-500"
						style={{ width: `${total > 0 ? (analyzed / total) * 100 : 0}%` }}
						title={`${analyzed} analysés en attente de tamponnage`}
					/>
					<div
						className="bg-yellow-500 animate-pulse transition-all duration-500"
						style={{ width: `${total > 0 ? (ocr / total) * 100 : 0}%` }}
						title={`${ocr} analyse OCR en cours`}
					/>
				</div>
			</div>

			{/* Statistiques détaillées */}
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
				{pending > 0 && (
					<div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
						<div className="w-3 h-3 bg-gray-400 rounded-full"></div>
						<span className="text-gray-700">
							<span className="font-semibold">{pending}</span> en attente
						</span>
					</div>
				)}

				{ocr > 0 && (
					<div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
						<div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
						<span className="text-gray-700">
							<span className="font-semibold">{ocr}</span> analyse OCR
						</span>
					</div>
				)}

			{analyzed > 0 && (
				<div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
					<div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
					<span className="text-gray-700">
						<span className="font-semibold">{analyzed}</span> analysés
					</span>
				</div>
			)}
			
			{completed > 0 && (
				<div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
					<div className="w-3 h-3 bg-green-500 rounded-full"></div>
					<span className="text-gray-700">
						<span className="font-semibold">{completed}</span> terminés
					</span>
				</div>
			)}				{errors > 0 && (
					<div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
						<div className="w-3 h-3 bg-red-500 rounded-full"></div>
						<span className="text-gray-700">
							<span className="font-semibold">{errors}</span> erreurs
						</span>
					</div>
				)}
			</div>

			{isProcessing && (
				<div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
					<div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
					<span className="font-medium">Traitement en cours...</span>
				</div>
			)}
		</div>
	);
}
