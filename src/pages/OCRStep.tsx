import React from "react";
import { ArrowRight } from "lucide-react";
import OCRRegionSelector from "../components/pdf/OCRRegionSelector";
import { usePDFStore } from "../stores/usePDFStore";

const OCRStep: React.FC = () => {
	const samplePDF = usePDFStore((s) => s.samplePDF);
	const ocrRegion = usePDFStore((s) => s.options.ocrRegion);
	const ocrPageNumber = usePDFStore((s) => s.options.ocrPageNumber);
	const setRegionOCR = usePDFStore((s) => s.setRegionOCR);
	const setPageOCR = usePDFStore((s) => s.setPageOCR);
	const setCurrentStep = usePDFStore((s) => s.setCurrentStep);

	if (!samplePDF) {
		return <div className="text-gray-500">Aucun PDF chargé</div>;
	}

	return (
		<div className="flex-1 min-h-0 flex flex-col" data-onboarding-target="ocr-region">
			<OCRRegionSelector
				pdfFile={samplePDF}
				onRegionSelected={setRegionOCR}
				onPageChanged={setPageOCR}
				currentRegion={ocrRegion}
				initialPage={ocrPageNumber}
				actions={
					<button
						onClick={() => setCurrentStep("position")}
						className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium whitespace-nowrap"
					>
						Étape suivante
						<ArrowRight className="w-4 h-4" />
					</button>
				}
			/>
		</div>
	);
};

export default OCRStep;
