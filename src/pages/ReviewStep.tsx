import React, { useState } from "react";
import { usePDFContext } from "../hooks/usePDFContext";
import { AlertCircle, CheckCircle, Download, FileText } from "lucide-react";
import { type PDFFile } from "../types/PDFFile";
import { downloadSingle } from "../lib/downloadUtils";
import { analyzeFile, stampFile } from "../lib/pdfProcessingUtils";
import { StampPosition } from "../lib/pdfStamper";
import { Rectangle } from "tesseract.js";
import PDFRow from "../components/pdf/PDFRow";
import PDFViewerModal from "../components/modals/PDFViewerModal";

interface Props {
	stampPosition: StampPosition;
	ocrRegion?: Rectangle;
	ocrPageNumber: number;
}

const ReviewStep: React.FC<Props> = ({ stampPosition, ocrRegion, ocrPageNumber }) => {
	const { loadedPDFs, updatePDF } = usePDFContext();
	const [viewerState, setViewerState] = useState<{ isOpen: boolean; pdfFile?: PDFFile; index?: number }>({
		isOpen: false,
	});

	const errorFiles = loadedPDFs.filter((pdf) => pdf.status === "error");
	const successFiles = loadedPDFs.filter((pdf) => pdf.status === "completed");

	const handleRetry = async (pdfFile: PDFFile, index: number) => {
		updatePDF(index, { status: "pending", error: undefined });

		await analyzeFile(index, pdfFile.file, ocrPageNumber, ocrRegion, updatePDF);

		const updatedFile = loadedPDFs[index];
		if (updatedFile.status === "analyzed") {
			await stampFile(index, updatedFile, stampPosition, updatePDF);
		}
	};

	const handleDownload = (pdfFile: PDFFile) => {
		downloadSingle(pdfFile);
	};

	const handleViewPDF = (pdfFile: PDFFile, index: number) => {
		setViewerState({ isOpen: true, pdfFile, index });
	};

	const handleCloseViewer = () => {
		setViewerState({ isOpen: false });
	};

	const handleSaveManualId = (newDocId: string) => {
		if (viewerState.index !== undefined) {
			updatePDF(viewerState.index, {
				docId: newDocId,
				error: undefined,
				status: "analyzed",
			});
		}
		handleCloseViewer();
	};

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			{errorFiles.length > 0 && (
				<div className="mb-8">
					<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
						<AlertCircle className="w-5 h-5 text-red-600" />
						Fichiers en erreur
					</h3>
					<div className="space-y-3">
						{errorFiles.map((pdfFile) => {
							const originalIndex = loadedPDFs.indexOf(pdfFile);
							return (
								<PDFRow
									key={originalIndex}
									pdfFile={pdfFile}
									index={originalIndex}
									onUpdatePDF={updatePDF}
									onDownload={handleDownload}
									onRetry={handleRetry}
									onViewPDF={handleViewPDF}
								/>
							);
						})}
					</div>
				</div>
			)}

			{successFiles.length > 0 && (
				<div>
					<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
						<CheckCircle className="w-5 h-5 text-green-600" />
						Fichiers traités avec succès
					</h3>
					<div className="space-y-2 max-h-96 overflow-y-auto">
						{successFiles.map((pdfFile) => {
							const originalIndex = loadedPDFs.indexOf(pdfFile);
							return (
								<div key={originalIndex} className="bg-green-50 border border-green-200 rounded-lg p-3">
									<div className="flex items-center justify-between gap-4">
										<div className="flex items-center gap-3 flex-1 min-w-0">
											<CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
											<div className="flex-1 min-w-0">
												<div className="font-medium text-gray-900 truncate">{pdfFile.file.name}</div>
												{pdfFile.docId && <div className="text-sm text-gray-600">ID: {pdfFile.docId}</div>}
											</div>
										</div>
										<button
											onClick={() => handleDownload(pdfFile)}
											className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex-shrink-0"
										>
											<Download className="w-4 h-4" />
											Télécharger
										</button>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{loadedPDFs.length === 0 && (
				<div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
					<FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
					<p>Aucun fichier traité.</p>
				</div>
			)}

			{viewerState.isOpen && viewerState.pdfFile && (
				<PDFViewerModal
					isOpen={viewerState.isOpen}
					onClose={handleCloseViewer}
					pdfFile={viewerState.pdfFile.file}
					currentDocId={viewerState.pdfFile.docId}
					onSave={handleSaveManualId}
				/>
			)}
		</div>
	);
};

export default ReviewStep;
