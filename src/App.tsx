import AppHeader from "./components/ui/AppHeader";
import NavigationSteps from "./components/ui/NavigationSteps";
import { PDFProvider } from "./contexts/PDFContext";
import { usePDFContext } from "./hooks/usePDFContext";
import DatabaseStep from "./components/pages/DatabaseStep";
import OCRStep from "./components/pages/OCRStep";
import PositionStep from "./components/pages/PositionStep";
import StampingStep from "./components/pages/StampingStep";

function AppContent() {
	const { currentStep, samplePDF, options, setCurrentStep, setSamplePDF, setRegionOCR, setPageOCR, setStampPos } = usePDFContext();

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
			<div className="max-w-7xl mx-auto px-4 py-8">
				<AppHeader />

				<NavigationSteps currentStep={currentStep} samplePDF={samplePDF} stampPosition={!!options.stampPosition} onStepChange={setCurrentStep} />

				<div className="space-y-6">
					{currentStep === "database" && <DatabaseStep onSamplePDFSelected={setSamplePDF} />}

					{currentStep === "ocr-region" && samplePDF && (
						<OCRStep
							pdfFile={samplePDF}
							ocrRegion={options.ocrRegion}
							ocrPageNumber={options.ocrPageNumber}
							onRegionSelected={setRegionOCR}
							onPageChanged={setPageOCR}
							onContinue={() => setCurrentStep("position")}
						/>
					)}

					{currentStep === "position" && samplePDF && (
						<PositionStep pdfFile={samplePDF} stampPosition={options.stampPosition} onPositionSelected={setStampPos} onStartStamping={() => setCurrentStep("stamping")} />
					)}

					{currentStep === "stamping" && options.stampPosition && (
						<StampingStep stampPosition={options.stampPosition} ocrRegion={options.ocrRegion} ocrPageNumber={options.ocrPageNumber} />
					)}
				</div>
			</div>
		</div>
	);
}

export default function App() {
	return (
		<PDFProvider>
			<AppContent />
		</PDFProvider>
	);
}
