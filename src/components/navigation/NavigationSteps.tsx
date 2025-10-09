import React from "react";
import { Database, Stamp, Search, FileText } from "lucide-react";
import NavigationButton from "./NavigationButton";

type Step = "database" | "ocr-region" | "position" | "stamping";

interface NavigationStepsProps {
	currentStep: Step;
	samplePDF: File | null;
	stampPosition: boolean;
	onStepChange: (step: Step) => void;
}

const NavigationSteps: React.FC<NavigationStepsProps> = ({ currentStep, samplePDF, stampPosition, onStepChange }) => {
	return (
		<div className="mb-8 flex gap-3 overflow-x-auto">
			<NavigationButton onClick={() => onStepChange("database")} active={currentStep === "database"} icon={<Database className="w-5 h-5" />}>
				1. Références
			</NavigationButton>

			<NavigationButton onClick={() => samplePDF && onStepChange("ocr-region")} disabled={!samplePDF} active={currentStep === "ocr-region"} icon={<Search className="w-5 h-5" />}>
				2. Zone OCR
			</NavigationButton>

			<NavigationButton onClick={() => samplePDF && onStepChange("position")} disabled={!samplePDF} active={currentStep === "position"} icon={<Stamp className="w-5 h-5" />}>
				3. Position tampon
			</NavigationButton>

			<NavigationButton
				onClick={() => stampPosition && onStepChange("stamping")}
				disabled={!stampPosition}
				active={currentStep === "stamping"}
				icon={<FileText className="w-5 h-5" />}
			>
				4. Traitement
			</NavigationButton>
		</div>
	);
};

export default NavigationSteps;
