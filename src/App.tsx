import LoadingSpinner from "./components/common/LoadingSpinner";
import Sidebar from "./components/navigation/Sidebar";
import { usePDFStore } from "./stores/usePDFStore";
import OnboardingWizardPanel, { type OnboardingWizardPanelHandle } from "./components/onboarding/OnboardingWizardPanel";
import { useUpdaterStore } from "./stores/useUpdaterStore";
import { lazy, Suspense, useEffect, useRef } from "react";

const DatabaseStep = lazy(() => import("./pages/DatabaseStep"));
const OCRStep = lazy(() => import("./pages/OCRStep"));
const PositionStep = lazy(() => import("./pages/PositionStep"));
const StampingStep = lazy(() => import("./pages/StampingStep"));
const ReviewStep = lazy(() => import("./pages/ReviewStep"));

export default function App() {
	const currentStep = usePDFStore((s) => s.currentStep);
	const samplePDF = usePDFStore((s) => s.samplePDF);
	const stampPosition = usePDFStore((s) => s.options.stampPosition);
	const ocrRegion = usePDFStore((s) => s.options.ocrRegion);
	const ocrPageNumber = usePDFStore((s) => s.options.ocrPageNumber);
	const setCurrentStep = usePDFStore((s) => s.setCurrentStep);
	const onboardingRef = useRef<OnboardingWizardPanelHandle>(null);
	const initializeUpdater = useUpdaterStore((s) => s.initialize);

	useEffect(() => initializeUpdater(), [initializeUpdater]);

	return (
		<div className="h-screen flex overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
			<Sidebar
				currentStep={currentStep}
				samplePDF={samplePDF}
				stampPosition={!!stampPosition}
				onStepChange={setCurrentStep}
				onStartOnboarding={() => onboardingRef.current?.start()}
			/>
			<main className="flex-1 min-w-0 min-h-0 flex flex-col p-3">
				<OnboardingWizardPanel ref={onboardingRef} />
				<Suspense fallback={<LoadingSpinner />}>
					<div className="flex-1 min-h-0 flex flex-col">
						{currentStep === "database" && <DatabaseStep />}

						{currentStep === "ocr-region" && <OCRStep />}

						{currentStep === "position" && <PositionStep />}

						{currentStep === "stamping" && <StampingStep />}

						{currentStep === "review" && <ReviewStep stampPosition={stampPosition!} ocrRegion={ocrRegion} ocrPageNumber={ocrPageNumber} />}
					</div>
				</Suspense>
			</main>
		</div>
	);
}
