import LoadingSpinner from "./components/common/LoadingSpinner";
import Footer from "./components/common/Footer";
import NavigationSteps from "./components/navigation/NavigationSteps";
import { PDFProvider } from "./contexts/PDFContext";
import { usePDFContext } from "./hooks/usePDFContext";
import OnboardingWizardPanel from "./components/onboarding/OnboardingWizardPanel";
import { lazy, Suspense, useEffect, useState } from "react";

const DatabaseStep = lazy(() => import("./pages/DatabaseStep"));
const OCRStep = lazy(() => import("./pages/OCRStep"));
const PositionStep = lazy(() => import("./pages/PositionStep"));
const StampingStep = lazy(() => import("./pages/StampingStep"));
const ReviewStep = lazy(() => import("./pages/ReviewStep"));

type UpdaterState = {
	stage: "idle" | "checking" | "available" | "not-available" | "downloading" | "downloaded" | "error" | "disabled";
	message: string;
	progress: number | null;
	version: string | null;
};

function AppContent() {
	const { currentStep, samplePDF, options, setCurrentStep } = usePDFContext();
	const [updaterState, setUpdaterState] = useState<UpdaterState | null>(null);
	const [isInstalling, setIsInstalling] = useState(false);

	useEffect(() => {
		const updaterApi = window.electron?.updater;
		if (!updaterApi) return;

		void updaterApi.getState().then(setUpdaterState).catch(() => undefined);
		const unsubscribe = updaterApi.onStatus((state) => setUpdaterState(state));
		return unsubscribe;
	}, []);

	const canInstallNow = updaterState?.stage === "downloaded" && !isInstalling;

	const handleInstallNow = async () => {
		const updaterApi = window.electron?.updater;
		if (!updaterApi || !canInstallNow) return;
		setIsInstalling(true);
		try {
			await updaterApi.installUpdate();
		} finally {
			setIsInstalling(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
			<div className="max-w-7xl mx-auto px-4 py-8">
				{updaterState?.stage === "downloaded" && (
					<div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900">
						<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
							<p>{updaterState.message}</p>
							<button
								type="button"
								onClick={handleInstallNow}
								disabled={!canInstallNow}
								className="inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-2 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isInstalling ? "Installation..." : "Installer maintenant"}
							</button>
						</div>
					</div>
				)}
				<NavigationSteps currentStep={currentStep} samplePDF={samplePDF} stampPosition={!!options.stampPosition} onStepChange={setCurrentStep} />
				<OnboardingWizardPanel />
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
