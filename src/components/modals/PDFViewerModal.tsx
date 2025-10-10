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
			<div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
				<div className="flex items-center justify-between p-4 border-b border-gray-200">
					<div className="flex-1">
						<h2 className="text-xl font-semibold text-gray-900">Saisie manuelle</h2>
					</div>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
						<X className="w-6 h-6" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-4">
					<input
						type="text"
						value={manualId}
						onChange={(e) => setManualId(e.target.value)}
						className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="Entrez le numéro de dossier"
						autoFocus
					/>

					<div className="border border-gray-300 rounded-lg overflow-hidden">
						<PDFRenderer pdfFile={pdfFile} />
					</div>
				</div>

				<div className="p-4 border-t border-gray-200 flex justify-end gap-3">
					<button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
						Annuler
					</button>
					<button
						onClick={handleSave}
						disabled={!manualId.trim()}
						className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
