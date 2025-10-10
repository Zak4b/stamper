import React, { useState, useRef, useEffect, useCallback } from "react";
import { StampPosition } from "../../lib/pdfStamper";
import { FileText, Download, Trash2 } from "lucide-react";
import { Rectangle } from "tesseract.js";
import ProcessingStats from "../progress/ProcessingStats";
import PDFRow from "../pdf/PDFRow";
import ConfirmModal from "../modals/ConfirmModal";
import { usePDFContext } from "../../hooks/usePDFContext";
import { type PDFFile } from "../../types/PDFFile";
import { downloadAll, downloadSingle } from "../../lib/downloadUtils";
import { analyzeFile, stampFile } from "../../lib/pdfProcessingUtils";

interface Props {
	stampPosition: StampPosition;
	ocrRegion?: Rectangle;
	ocrPageNumber: number;
}

const BatchStamper: React.FC<Props> = ({ stampPosition, ocrRegion, ocrPageNumber }) => {
	const { loadedPDFs, addPDFs, updatePDF, clearPDFs } = usePDFContext();
	const [showClearConfirm, setShowClearConfirm] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	async function handleFilesSelected(files: FileList) {
		const newFiles: PDFFile[] = Array.from(files)
			.filter((f) => f.type === "application/pdf")
			.map((file) => ({
				file,
				numeroDossier: "",
				status: "pending" as const,
				ocrProgress: 0,
			}));

		addPDFs(newFiles);

		// Analyser chaque nouveau fichier avec OCR
		for (let i = loadedPDFs.length; i < loadedPDFs.length + newFiles.length; i++) {
			const fileIndex = i;
			const file = newFiles[i - loadedPDFs.length].file;
			await analyzeFile(fileIndex, file, ocrPageNumber, ocrRegion, updatePDF);
		}
	}

	function handleClearPDFs() {
		clearPDFs();
		setShowClearConfirm(false);
	}

	function handleDownloadSingle(pdfFile: PDFFile) {
		downloadSingle(pdfFile);
	}

	const processPDF = useCallback(
		async (file: PDFFile, fileIndex: number) => {
			if (file.status !== "analyzed") return;
			await stampFile(fileIndex, file, stampPosition, updatePDF);
		},
		[stampPosition, updatePDF]
	);

	// Surveiller les fichiers analyzed et les tamponner automatiquement
	useEffect(() => {
		const analyzedFiles = loadedPDFs.map((file, index) => ({ file, index })).filter(({ file }) => file.status === "analyzed");
		analyzedFiles.forEach(({ file, index }) => processPDF(file, index));
	}, [loadedPDFs, processPDF]);

	const handleDownloadAll = async () => await downloadAll(loadedPDFs);

	const completedCount = loadedPDFs.filter((f) => f.status === "completed").length;
	const errorCount = loadedPDFs.filter((f) => f.status === "error").length;
	const ocrCount = loadedPDFs.filter((f) => f.status === "ocr").length;
	const analyzedCount = loadedPDFs.filter((f) => f.status === "analyzed").length;
	const processingCount = loadedPDFs.filter((f) => f.status === "processing").length;
	const pendingCount = loadedPDFs.filter((f) => f.status === "pending").length;

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h2 className="text-xl font-semibold text-gray-900">Traitement par lot</h2>
				</div>
				<div className="flex gap-3">
					<label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
						<FileText className="w-4 h-4" />
						<span className="text-sm font-medium">Charger des PDFs</span>
						<input ref={fileInputRef} type="file" multiple accept=".pdf" className="hidden" onChange={(e) => e.target.files && handleFilesSelected(e.target.files)} />
					</label>
					{loadedPDFs.length > 0 && (
						<>
							<button
								onClick={() => setShowClearConfirm(true)}
								className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
							>
								<Trash2 className="w-4 h-4" />
								Effacer tout
							</button>
							{completedCount > 0 && (
								<button onClick={handleDownloadAll} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors">
									<Download className="w-4 h-4" />
									Télécharger tout (ZIP)
								</button>
							)}
						</>
					)}
				</div>
			</div>

			{loadedPDFs.length > 0 ? (
				<>
					<ProcessingStats pending={pendingCount} ocr={ocrCount} analyzed={analyzedCount} processing={processingCount} completed={completedCount} errors={errorCount} />
					<div className="space-y-2 max-h-96 overflow-y-auto">
						{loadedPDFs.map((pdfFile, index) => (
							<PDFRow key={index} pdfFile={pdfFile} index={index} onUpdatePDF={updatePDF} onDownload={handleDownloadSingle} />
						))}
					</div>
				</>
			) : (
				<div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
					<FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
					<p>Aucun PDF chargé. Cliquez sur "Charger des PDFs" pour commencer.</p>
				</div>
			)}

			<ConfirmModal
				isOpen={showClearConfirm}
				title="Effacer tous les PDFs"
				description={`Êtes-vous sûr de vouloir supprimer tous les ${loadedPDFs.length} PDF(s) de la liste ? Cette action est irréversible.`}
				confirmLabel="Effacer tout"
				cancelLabel="Annuler"
				onConfirm={handleClearPDFs}
				onCancel={() => setShowClearConfirm(false)}
			/>
		</div>
	);
};

export default BatchStamper;
