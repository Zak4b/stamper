import { forwardRef, useEffect, useImperativeHandle, useMemo } from "react";
import { usePDFContext } from "../../hooks/usePDFContext";
import { useOnboardingWizard } from "../../hooks/useOnboardingWizard";
import { ONBOARDING_WIZARD_STEPS } from "../../config/onboardingWizardSteps";
import { useDossierCount } from "../../hooks/useDossierCount";
import { useOnboardingHighlightRect } from "../../hooks/useOnboardingHighlightRect";
export type OnboardingWizardPanelHandle = {
	start: () => void;
};

const OnboardingWizardPanel = forwardRef<OnboardingWizardPanelHandle>((_, ref) => {
	const { currentStep, setCurrentStep, samplePDF, loadedPDFs, options } = usePDFContext();
	const { isOpen, index, hydrated, dismiss, start, setIndex, complete } = useOnboardingWizard();

	const steps = ONBOARDING_WIZARD_STEPS;

	useEffect(() => {
		if (!isOpen || !hydrated) return;

		const currentAppStep = steps[index]?.appStep;
		if (!currentAppStep) return;

		// Keep the wizard consistent when switching between app steps manually.
		// Note: `database` is used by two wizard steps (CSV vs PDF modèle).
		// We only sync when the wizard step doesn't already match the current app step.
		if (currentAppStep === currentStep) return;

		let nextIndex = index;
		switch (currentStep) {
			case "database":
				nextIndex = samplePDF ? 1 : 0;
				break;
			case "ocr-region":
				nextIndex = 2;
				break;
			case "position":
				nextIndex = 3;
				break;
			case "stamping":
				nextIndex = 4;
				break;
			case "review":
				nextIndex = 5;
				break;
		}

		if (nextIndex !== index) setIndex(nextIndex);
	}, [currentStep, hydrated, isOpen, index, samplePDF, setIndex, steps]);

	const dossierCount = useDossierCount({ isOpen, hydrated, index });

	const canGoNext = useMemo(() => {
		switch (index) {
			case 0:
				return dossierCount > 0;
			case 1:
				return Boolean(samplePDF);
			case 2:
				return Boolean(samplePDF && options.ocrRegion);
			case 3:
				return Boolean(samplePDF && options.stampPosition);
			case 4:
				return Boolean(options.stampPosition && loadedPDFs.length > 0);
			case 5:
				return true;
			default:
				return false;
		}
	}, [index, dossierCount, loadedPDFs.length, options.ocrRegion, options.stampPosition, samplePDF]);

	const currentHighlightTarget = steps[index]?.highlightTarget;
	const highlightRect = useOnboardingHighlightRect({
		isOpen,
		hydrated,
		highlightTarget: currentHighlightTarget,
		index,
	});

	// Spotlight always stays active while the onboarding is open.
	// We keep step validation for enabling/disabling "Suivant", but not for rendering.

	const goTo = (nextIndex: number) => {
		const next = Math.max(0, Math.min(5, nextIndex));
		setIndex(next);
		setCurrentStep(steps[next].appStep);
	};

	useImperativeHandle(
		ref,
		() => ({
			start,
		}),
		[start]
	);

	return (
		<>
			{isOpen && hydrated && (
				<div className="fixed inset-0 z-50 pointer-events-none">
			{/* If highlight is not ready yet, dim the UI to avoid a jarring experience */}
			{!highlightRect && <div className="absolute inset-0 bg-black/30 pointer-events-none" />}

			{/* Spotlight around the useful area for the current step */}
			{highlightRect && (
				<div
					className="absolute border-2 border-blue-500 rounded-xl pointer-events-none"
					style={{
						left: highlightRect.left,
						top: highlightRect.top,
						width: highlightRect.width,
						height: highlightRect.height,
						background: "rgba(255,255,255,0.03)",
						// Punch a hole in the dim layer using a huge boxShadow.
						// Everything outside the rect gets dark, while the rect area remains mostly clear.
						boxShadow: "0 0 0 9999px rgba(0,0,0,0.44)",
					}}
				/>
			)}

					<div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[min(92vw,920px)] pointer-events-auto bg-white/95 backdrop-blur border-2 border-blue-600/60 rounded-xl shadow-2xl p-4 ring-2 ring-blue-300/60">
				<div className="flex items-start justify-between gap-4">
					<div>
						<div className="text-xs font-medium text-gray-500">{index + 1} / {steps.length}</div>
						<div className="text-base font-semibold text-gray-900">{steps[index].title}</div>
						<p className="text-sm text-gray-700 mt-1">{steps[index].description}</p>
						{steps[index].extra && <p className="text-sm text-gray-600 mt-1">{steps[index].extra}</p>}
					</div>
				</div>

				<div className="mt-4 flex items-center justify-between gap-3">
					<button
						type="button"
						onClick={dismiss}
						className="px-4 py-2 text-sm rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Passer
					</button>

					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => goTo(index - 1)}
							disabled={index === 0}
							className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Précédent
						</button>

						{index < steps.length - 1 ? (
							<button
								type="button"
								onClick={() => goTo(index + 1)}
								disabled={!canGoNext}
								className="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Suivant
							</button>
						) : (
							<button
								type="button"
								onClick={complete}
								className="px-5 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
							>
								Terminer
							</button>
						)}
					</div>
				</div>
					</div>
				</div>
			)}
		</>
	);
});

export default OnboardingWizardPanel;

