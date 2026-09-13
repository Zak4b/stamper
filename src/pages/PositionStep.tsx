import React from "react";
import { ArrowRight } from "lucide-react";
import StampPositionSelector from "../components/pdf/StampPositionSelector";
import { usePDFContext } from "../hooks/usePDFContext";

const PositionStep: React.FC = () => {
	const { samplePDF, options, setStampPos, setCurrentStep } = usePDFContext();

	if (!samplePDF) {
		return <div className="text-gray-500">Aucun PDF chargé</div>;
	}

	const canProceed = Boolean(options.stampPosition);

	return (
		<div className="flex-1 min-h-0 flex flex-col" data-onboarding-target="position">
			<StampPositionSelector
				pdfFile={samplePDF}
				onPositionSelected={setStampPos}
				currentPosition={options.stampPosition || undefined}
				actions={
					canProceed && (
						<button
							onClick={() => setCurrentStep("stamping")}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium whitespace-nowrap"
						>
							Étape suivante
							<ArrowRight className="w-4 h-4" />
						</button>
					)
				}
			/>
		</div>
	);
};

export default PositionStep;
