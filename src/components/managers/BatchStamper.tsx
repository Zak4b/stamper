import React, { useEffect, useCallback } from "react";
import { FileText } from "lucide-react";
import ProcessingStats from "../progress/ProcessingStats";
import PDFRow from "../pdf/PDFRow";
import { usePDFContext } from "../../hooks/usePDFContext";
import { type PDFFile } from "../../types/PDFFile";
import { downloadSingle } from "../../lib/downloadUtils";
import { analyzeFile, stampFile } from "../../lib/pdfProcessingUtils";
import Toolbar from "../common/PDFToolbar";

const BatchStamper: React.FC = () => {
	const { loadedPDFs, updatePDF, options } = usePDFContext();

	const handleRetry = async (file: PDFFile, fileIndex: number) => {
		updatePDF(fileIndex, { status: "pending", error: undefined });
		await analyzeFile(fileIndex, file.file, options.ocrPageNumber, options.ocrRegion, updatePDF);
	};
	function handleDownloadSingle(pdfFile: PDFFile) {
		downloadSingle(pdfFile);
	}

	const processPDF = useCallback(
		async (file: PDFFile, fileIndex: number) => {
			if (file.status !== "analyzed" || !options.stampPosition) return;
			await stampFile(fileIndex, file, options.stampPosition, updatePDF);
		},
		[options.stampPosition, updatePDF]
	);

	// Surveiller les fichiers analyzed et les tamponner automatiquement
	useEffect(() => {
		const analyzedFiles = loadedPDFs.map((file, index) => ({ file, index })).filter(({ file }) => file.status === "analyzed" && file.error === undefined);
		analyzedFiles.forEach(({ file, index }) => processPDF(file, index));
	}, [loadedPDFs, processPDF]);

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<Toolbar label="Traitement par lot" />

			{loadedPDFs.length > 0 ? (
				<>
					<ProcessingStats PDFs={loadedPDFs} />
					<div className="space-y-2 max-h-96 overflow-y-auto">
						{loadedPDFs.map((pdfFile, index) => (
							<PDFRow key={index} pdfFile={pdfFile} index={index} onUpdatePDF={updatePDF} onDownload={handleDownloadSingle} onRetry={handleRetry} />
						))}
					</div>
				</>
			) : (
				<div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
					<FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
					<p>Aucun PDF chargé. Cliquez sur "Charger des PDFs" pour commencer.</p>
				</div>
			)}
		</div>
	);
};

export default BatchStamper;
