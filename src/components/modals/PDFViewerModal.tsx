import React, { useState } from "react";
import { X, Save } from "lucide-react";
import PDFRenderer from "../pdf/PDFRenderer";

interface PDFViewerModalProps {
	isOpen: boolean;
	onClose: () => void;
	pdfFile: File;
	currentDocId?: string;
	onSave: (newDocId: string) => void;
}

const PDFViewerModal: React.FC<PDFViewerModalProps> = ({ isOpen, onClose, pdfFile, currentDocId, onSave }) => {
	const [manualId, setManualId] = useState(currentDocId || "");

	if (!isOpen) return null;

	const handleSave = () => {
		if (manualId.trim()) {
			onSave(manualId.trim());
			onClose();
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
			<div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
				<div className="shrink-0 flex items-center justify-between gap-3 px-4 h-12 border-b border-gray-200">
					<h2 className="text-base font-semibold text-gray-900">Saisie manuelle</h2>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5" aria-label="Fermer">
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="flex-1 min-h-0 flex flex-col gap-3 p-3">
					<input
						type="text"
						value={manualId}
						onChange={(e) => setManualId(e.target.value)}
						className="shrink-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="Entrez le numéro de dossier"
						autoFocus
					/>

					<PDFRenderer pdfFile={pdfFile} title="Document" />
				</div>

				<div className="shrink-0 px-4 py-2 border-t border-gray-200 flex justify-end gap-3">
					<button onClick={onClose} className="px-4 py-1.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
						Annuler
					</button>
					<button
						onClick={handleSave}
						disabled={!manualId.trim()}
						className="inline-flex items-center gap-2 px-5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<Save className="w-4 h-4" />
						Enregistrer et continuer
					</button>
				</div>
			</div>
		</div>
	);
};

export default PDFViewerModal;
