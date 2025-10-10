import React from "react";
import StatItem from "./StatItem";
import MultiProgressBar from "./MultiProgressBar";
import { AlertCircle, CheckCircle } from "lucide-react";
import { PDFFile } from "../../types/PDFFile";

interface ProcessingStatsProps {
	PDFs: PDFFile[];
}

const ProcessingStats: React.FC<ProcessingStatsProps> = ({ PDFs }) => {
	const pending = PDFs.filter((f) => f.status === "pending").length;
	const ocr = PDFs.filter((f) => f.status === "ocr").length;
	const analyzed = PDFs.filter((f) => f.status === "analyzed").length;
	const processing = PDFs.filter((f) => f.status === "processing").length;
	const completed = PDFs.filter((f) => f.status === "completed").length;
	const errors = PDFs.filter((f) => f.status === "error").length;

	const total: number = pending + ocr + analyzed + processing + completed + errors;
	const finished: boolean = completed + errors == total;
	const percentage: number = total > 0 ? (completed / total) * 100 : 0;

	return (
		<>
			<div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold text-gray-800">État du traitement</h3>
					<div className="text-sm font-mono text-gray-600 bg-white px-3 py-1 rounded-full">{Math.floor(percentage)}%</div>
				</div>

				{/* Barre de progression principale */}
				<MultiProgressBar
					total={total}
					segments={[
						{ value: completed, color: "bg-green-500", title: `${completed} terminés` },
						{ value: errors, color: "bg-red-500", title: `${errors} erreurs` },
						{ value: processing, color: "bg-indigo-500", animate: true, title: `${processing} tamponnage en cours` },
						{ value: analyzed, color: "bg-blue-500", title: `${analyzed} analysés en attente de tamponnage` },
						{ value: ocr, color: "bg-yellow-500", animate: true, title: `${ocr} analyse OCR en cours` },
					]}
					className="mb-4"
				/>

				{/* Statistiques détaillées */}
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
					<StatItem count={pending} label="en attente" color="bg-gray-400" />
					<StatItem count={ocr} label="analyse OCR" color="bg-yellow-500" animate />
					<StatItem count={analyzed} label="analysés" color="bg-blue-500" />
					<StatItem count={processing} label="tamponnage" color="bg-indigo-500" animate />
					<StatItem count={completed} label="terminés" color="bg-green-500" />
					<StatItem count={errors} label="erreurs" color="bg-red-500" />
				</div>

				{!finished && (
					<div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
						<div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
						<span className="font-medium">Traitement en cours...</span>
					</div>
				)}
			</div>

			<div className="mb-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
				<div className="flex gap-6">
					<div className="flex items-center gap-2">
						<CheckCircle className="w-5 h-5 text-green-600" />
						<span className="text-sm font-medium text-gray-700">
							{completed} terminé{completed > 1 ? "s" : ""}
						</span>
					</div>
					{errors > 0 && (
						<div className="flex items-center gap-2">
							<AlertCircle className="w-5 h-5 text-red-600" />
							<span className="text-sm font-medium text-gray-700">
								{errors} erreur{errors > 1 ? "s" : ""}
							</span>
						</div>
					)}
				</div>
			</div>
		</>
	);
};

export default ProcessingStats;
