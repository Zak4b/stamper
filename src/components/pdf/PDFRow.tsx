import React, { useState } from "react";
import { FileText, CheckCircle, AlertCircle, CreditCard as Edit2, Loader } from "lucide-react";
import { PDFFile } from "../../types/PDFFile";

interface PDFRowProps {
	pdfFile: PDFFile;
	index: number;
	onUpdatePDF: (index: number, updates: Partial<PDFFile>) => void;
	onDownload: (pdfFile: PDFFile) => void;
}

const PDFRow: React.FC<PDFRowProps> = ({ pdfFile, index, onUpdatePDF, onDownload }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState<string>("");

	const handleStartEditing = () => {
		setEditValue(pdfFile.numeroDossier || "");
		setIsEditing(true);
	};

	const handleSaveEdit = () => {
		setIsEditing(false);
		onUpdatePDF(index, {
			numeroDossier: editValue,
			error: undefined,
			status: "analyzed", // Remettre le statut à "analyzed" pour déclencher le traitement automatique
		});
	};

	const handleCancelEdit = () => setIsEditing(false);

	const getStatusDisplay = () => {
		switch (pdfFile.status) {
			case "ocr":
				return (
					<div className="flex items-center gap-2">
						<Loader className="w-4 h-4 text-blue-600 animate-spin" />
						<span className="text-xs text-blue-600 font-medium">OCR {Math.round(pdfFile.ocrProgress || 0)}%</span>
					</div>
				);
			case "pending":
				return <span className="text-xs text-gray-500">En attente</span>;
			case "analyzed":
				return <span className="text-xs text-green-600 font-medium">Analysé ✓</span>;
			case "processing":
				return (
					<div className="flex items-center gap-2">
						<Loader className="w-4 h-4 text-indigo-600 animate-spin" />
						<span className="text-xs text-indigo-600 font-medium">Tamponnage...</span>
					</div>
				);
			case "completed":
				return (
					<>
						<CheckCircle className="w-5 h-5 text-green-600" />
						<button onClick={() => onDownload(pdfFile)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
							Télécharger
						</button>
					</>
				);
			case "error":
				return <AlertCircle className="w-5 h-5 text-red-600" />;
			default:
				return null;
		}
	};

	return (
		<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
			<div className="flex items-center gap-3 flex-1">
				<FileText className="w-5 h-5 text-gray-400" />
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium text-gray-900 truncate">{pdfFile.file.name}</p>

					{isEditing ? (
						<div className="flex items-center gap-2 mt-1">
							<input
								type="text"
								value={editValue}
								onChange={(e) => setEditValue(e.target.value)}
								className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
								placeholder="Numéro de dossier"
							/>
							<button onClick={handleSaveEdit} className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
								OK
							</button>
							<button onClick={handleCancelEdit} className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
								Annuler
							</button>
						</div>
					) : (
						<div className="flex items-center gap-2">
							<p className="text-xs text-gray-500">
								Dossier: {pdfFile.numeroDossier || "En attente..."}
								{pdfFile.ocrConfidence && <span className="ml-2 text-gray-400">({Math.round(pdfFile.ocrConfidence)}% confiance)</span>}
							</p>
							{pdfFile.status !== "ocr" && (
								<button onClick={handleStartEditing} className="text-gray-400 hover:text-blue-600" title="Modifier le numéro">
									<Edit2 className="w-3 h-3" />
								</button>
							)}
						</div>
					)}

					{pdfFile.detectedNumbers && pdfFile.detectedNumbers.length > 1 && (
						<p className="text-xs text-gray-400 mt-1">Autres détectés: {pdfFile.detectedNumbers.slice(1, 3).join(", ")}</p>
					)}

					{pdfFile.error && <p className="text-xs text-red-600 mt-1">{pdfFile.error}</p>}
				</div>
			</div>

			<div className="flex items-center gap-3">{getStatusDisplay()}</div>
		</div>
	);
};

export default PDFRow;
