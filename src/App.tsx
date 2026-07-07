import LoadingSpinner from "./components/common/LoadingSpinner";
import BottomActionBar from "./components/common/BottomActionBar";
import StepperNav from "./components/navigation/StepperNav";
import { PDFProvider } from "./contexts/PDFContext";
import { usePDFContext } from "./hooks/usePDFContext";
import OnboardingWizardPanel, { type OnboardingWizardPanelHandle } from "./components/onboarding/OnboardingWizardPanel";
import { useUpdaterStore } from "./stores/useUpdaterStore";
import { lazy, Suspense, useEffect, useRef } from "react";

const DatabaseStep = lazy(() => import("./pages/DatabaseStep"));
const OCRStep = lazy(() => import("./pages/OCRStep"));
const PositionStep = lazy(() => import("./pages/PositionStep"));
const StampingStep = lazy(() => import("./pages/StampingStep"));
const ReviewStep = lazy(() => import("./pages/ReviewStep"));

function AppContent() {
	const { currentStep, samplePDF, options, loadedPDFs, setCurrentStep } = usePDFContext();
	const onboardingRef = useRef<OnboardingWizardPanelHandle>(null);
	const initializeUpdater = useUpdaterStore((s) => s.initialize);

	useEffect(() => initializeUpdater(), [initializeUpdater]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-12">
			<div className="max-w-7xl mx-auto px-4 py-8">
				<StepperNav
					currentStep={currentStep}
					samplePDF={samplePDF}
					ocrRegion={options.ocrRegion}
					stampPosition={options.stampPosition}
					loadedPDFs={loadedPDFs}
					onStepChange={setCurrentStep}
				/>
				<OnboardingWizardPanel ref={onboardingRef} />
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
			<BottomActionBar
				currentStep={currentStep}
				samplePDF={samplePDF}
				stampPosition={!!options.stampPosition}
				onStepChange={setCurrentStep}
				onStartOnboarding={() => onboardingRef.current?.start()}
			/>
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
