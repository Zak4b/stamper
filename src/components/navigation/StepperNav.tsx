import React from "react";
import { type Rectangle } from "tesseract.js";
import { type StampPosition } from "../../lib/pdfStamper";
import { type PDFFile } from "../../types/PDFFile";
import StepperStep, { type StepState } from "./StepperStep";

type Step = "database" | "ocr-region" | "position" | "stamping" | "review";

interface StepperNavProps {
	currentStep: Step;
	samplePDF: File | null;
	ocrRegion: Rectangle | undefined;
	stampPosition: StampPosition | null;
	loadedPDFs: PDFFile[];
	onStepChange: (step: Step) => void;
}

interface StepConfig {
	key: Step;
	label: string;
	isComplete: (props: StepperNavProps) => boolean;
	isLocked: (props: StepperNavProps) => boolean;
}

const STEPS: StepConfig[] = [
	{
		key: "database",
		label: "Références",
		isComplete: ({ samplePDF }) => samplePDF !== null,
		isLocked: () => false,
	},
	{
		key: "ocr-region",
		label: "Zone OCR",
		isComplete: ({ ocrRegion }) => ocrRegion !== undefined,
		isLocked: ({ samplePDF }) => !samplePDF,
	},
	{
		key: "position",
		label: "Position",
		isComplete: ({ stampPosition }) => stampPosition !== null,
		isLocked: ({ samplePDF }) => !samplePDF,
	},
	{
		key: "stamping",
		label: "Traitement",
		isComplete: ({ loadedPDFs }) =>
			loadedPDFs.length > 0 &&
			loadedPDFs.every((f) => f.status === "completed" || f.status === "error"),
		isLocked: ({ stampPosition }) => !stampPosition,
	},
	{
		key: "review",
		label: "Revue",
		isComplete: () => false,
		isLocked: ({ stampPosition }) => !stampPosition,
	},
];

const StepperNav: React.FC<StepperNavProps> = (props) => {
	const { currentStep, onStepChange } = props;

	return (
		<ul className="steps w-full mb-8">
			{STEPS.map((step) => {
				const complete = step.isComplete(props);
				const locked = step.isLocked(props);
				const active = currentStep === step.key;

				const state: StepState =
					complete && !active
						? "complete"
						: active
						? "active"
						: locked
						? "locked"
						: "accessible";

				return (
					<StepperStep
						key={step.key}
						state={state}
						label={step.label}
						onClick={() => onStepChange(step.key)}
					/>
				);
			})}
		</ul>
	);
};

export type { StepperNavProps };
export default StepperNav;
