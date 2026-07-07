type Step = "database" | "ocr-region" | "position" | "stamping" | "review";

interface BottomActionBarProps {
	currentStep: Step;
	samplePDF: File | null;
	stampPosition: boolean;
	onStepChange: (step: Step) => void;
	onStartOnboarding: () => void;
}

export default function BottomActionBar(_props: BottomActionBarProps) { return null; }
