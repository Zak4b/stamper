import React from "react";
import { ArrowRight } from "lucide-react";
import StampPositionSelector from "../pdf/StampPositionSelector";
import FloatingActionButton from "../common/FloatingActionButton";
import { usePDFContext } from "../../hooks/usePDFContext";

const PositionStep: React.FC = () => {
	const { samplePDF, options, setStampPos, setCurrentStep } = usePDFContext();

	if (!samplePDF) {
		return <div>Aucun PDF chargé</div>;
	}

	const handleNextStep = () => {
		setCurrentStep("stamping");
	};

	const canProceed = Boolean(options.stampPosition);

	return (
		<>
			<StampPositionSelector pdfFile={samplePDF} onPositionSelected={setStampPos} currentPosition={options.stampPosition || undefined} />

			{canProceed && <FloatingActionButton onClick={handleNextStep} icon={<ArrowRight className="w-6 h-6" />} label="Étape suivante" variant="primary" />}
		</>
	);
};

export default PositionStep;
