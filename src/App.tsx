import { useState } from "react";
import { StampPosition } from "./lib/pdfStamper";
import { Rectangle } from "tesseract.js";
import AppHeader from "./components/AppHeader";
import NavigationSteps from "./components/NavigationSteps";
import PageManager from "./components/PageManager";

type Step = "database" | "ocr-region" | "position" | "stamping";

export default function App() {
	const [currentStep, setCurrentStep] = useState<Step>("database");
	const [samplePDF, setSamplePDF] = useState<File | null>(null);
	const [stampPosition, setStampPosition] = useState<StampPosition | null>(null);
	const [ocrRegion, setOcrRegion] = useState<Rectangle | undefined>(undefined);
	const [ocrPageNumber, setOcrPageNumber] = useState<number>(0);

	function handleSamplePDFSelected(file: File) {
		setSamplePDF(file);
		setCurrentStep("ocr-region");
	}

	function handleOCRRegionSelected(region: Rectangle | undefined) {
		setOcrRegion(region);
	}

	function handleOCRPageChanged(pageNumber: number) {
		setOcrPageNumber(pageNumber);
	}

	function continueToStampPosition() {
		setCurrentStep("position");
	}

	function handlePositionSelected(position: StampPosition) {
		setStampPosition(position);
	}

	function startStamping() {
		if (stampPosition) {
			setCurrentStep("stamping");
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
			<div className="max-w-7xl mx-auto px-4 py-8">
				<AppHeader />

				<NavigationSteps currentStep={currentStep} samplePDF={samplePDF} stampPosition={!!stampPosition} onStepChange={setCurrentStep} />

				<PageManager
					currentStep={currentStep}
					samplePDF={samplePDF}
					stampPosition={stampPosition}
					ocrRegion={ocrRegion}
					ocrPageNumber={ocrPageNumber}
					onSamplePDFSelected={handleSamplePDFSelected}
					onOCRRegionSelected={handleOCRRegionSelected}
					onOCRPageChanged={handleOCRPageChanged}
					onContinueToStampPosition={continueToStampPosition}
					onPositionSelected={handlePositionSelected}
					onStartStamping={startStamping}
				/>
			</div>
		</div>
	);
}
