import React from "react";
import OCRRegionSelector from "../pdf/OCRRegionSelector";
import { usePDFContext } from "../../hooks/usePDFContext";
import FloatingActionButton from "../common/FloatingActionButton";
import { ArrowRight } from "lucide-react";

const OCRStep: React.FC = () => {
	const { samplePDF, options, setRegionOCR, setPageOCR, setCurrentStep } = usePDFContext();

	if (!samplePDF) {
		return <div>Aucun PDF chargé</div>;
	}

	const handleNextStep = () => {
		setCurrentStep("position");
	};

	const canProceed = Boolean(samplePDF);

	return (
		<>
			<OCRRegionSelector pdfFile={samplePDF} onRegionSelected={setRegionOCR} onPageChanged={setPageOCR} currentRegion={options.ocrRegion} initialPage={options.ocrPageNumber} />

			{canProceed && <FloatingActionButton onClick={handleNextStep} icon={<ArrowRight className="w-6 h-6" />} label="Étape suivante" variant="primary" />}
		</>
	);
};

export default OCRStep;
