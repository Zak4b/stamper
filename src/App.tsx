import LoadingSpinner from "./components/common/LoadingSpinner";
import Footer from "./components/common/Footer";
import NavigationSteps from "./components/navigation/NavigationSteps";
import { PDFProvider } from "./contexts/PDFContext";
import { usePDFContext } from "./hooks/usePDFContext";
import { lazy, Suspense } from "react";

const DatabaseStep = lazy(() => import("./pages/DatabaseStep"));
const OCRStep = lazy(() => import("./pages/OCRStep"));
const PositionStep = lazy(() => import("./pages/PositionStep"));
const StampingStep = lazy(() => import("./pages/StampingStep"));
const ReviewStep = lazy(() => import("./pages/ReviewStep"));

function AppContent() {
	const { currentStep, samplePDF, options, setCurrentStep } = usePDFContext();

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
			<div className="max-w-7xl mx-auto px-4 py-8">
				<NavigationSteps currentStep={currentStep} samplePDF={samplePDF} stampPosition={!!options.stampPosition} onStepChange={setCurrentStep} />
				<Suspense fallback={<LoadingSpinner />}>
					<div className="space-y-6">
						{currentStep === "database" && <DatabaseStep />}

						{currentStep === "ocr-region" && <OCRStep />}

						{currentStep === "position" && <PositionStep />}

						{currentStep === "stamping" && <StampingStep />}

						{currentStep === "review" && <ReviewStep stampPosition={options.stampPosition!} ocrRegion={options.ocrRegion} ocrPageNumber={options.ocrPageNumber} />}
					</div>
				</Suspense>
			</div>
			<Footer />
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
