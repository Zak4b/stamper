import React, { useState } from "react";
import { usePDFContext } from "../hooks/usePDFContext";
import { AlertCircle, CheckCircle } from "lucide-react";
import { type PDFFile } from "../types/PDFFile";
import { downloadSingle } from "../lib/downloadUtils";
import { analyzeFile, stampFile } from "../lib/pdfProcessingUtils";
import { StampPosition } from "../lib/pdfStamper";
import { Rectangle } from "tesseract.js";
import PDFRow from "../components/pdf/PDFRow";
import PDFViewerModal from "../components/modals/PDFViewerModal";
import Toolbar from "../components/common/PDFToolbar";

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

	const handleRetry = async (pdfFile: PDFFile, index: number) => {
		updatePDF(index, { status: "pending", error: undefined });

		const result = await analyzeFile(index, pdfFile.file, ocrPageNumber, ocrRegion, updatePDF);
		if (result.ok) {
			// Utiliser le résultat OCR directement pour éviter toute dépendance à un état React potentiellement périmé.
			const analyzedFile: PDFFile = {
				...pdfFile,
				status: "analyzed",
				docId: result.detectedNumber,
				ocrConfidence: result.confidence,
				detectedIds: result.ids,
				ocrProgress: 100,
			};

			await stampFile(index, analyzedFile, stampPosition, updatePDF);
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
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-onboarding-target="review">
			<Toolbar label="Traitement par lot" />
			{errorFiles.length > 0 ? (
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
			) : (
				<div className="mb-8">
					<div className="bg-green-50 border border-green-200 rounded-lg p-4">
						<div className="flex items-center gap-2">
							<CheckCircle className="w-5 h-5 text-green-600" />
							<h3 className="text-lg font-semibold text-green-800">Aucune erreur détectée</h3>
						</div>
						<p className="text-sm text-green-700 mt-2">Tous les fichiers ont été traités avec succès.</p>
					</div>
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
