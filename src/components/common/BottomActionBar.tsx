import { useEffect, useState } from "react";
import { type Rectangle } from "tesseract.js";
import { Github, HelpCircle, ChevronRight } from "lucide-react";
import { GITHUB_URL } from "../../config/appConfig";
import UpdateBadge from "./UpdateBadge";

type Step = "database" | "ocr-region" | "position" | "stamping" | "review";

const NEXT_STEP: Partial<Record<Step, { step: Step; label: string }>> = {
	database: { step: "ocr-region", label: "Zone OCR" },
	"ocr-region": { step: "position", label: "Position" },
	position: { step: "stamping", label: "Traitement" },
	stamping: { step: "review", label: "Revue" },
};

interface BottomActionBarProps {
	currentStep: Step;
	samplePDF: File | null;
	ocrRegion?: Rectangle;
	stampPosition: boolean;
	onStepChange: (step: Step) => void;
	onStartOnboarding?: () => void;
}

export default function BottomActionBar({ currentStep, samplePDF, ocrRegion, stampPosition, onStepChange, onStartOnboarding }: BottomActionBarProps) {
	const [version, setVersion] = useState<string>(() => (window.electron ? "" : "dev"));

	useEffect(() => {
		if (!window.electron) return;
		window.electron
			.getVersion()
			.then((v) => setVersion(v))
			.catch(() => setVersion("1.0.0"));
	}, []);

	const handleGithubClick = (e: React.MouseEvent) => {
		e.preventDefault();
		if (window.electron) {
			window.electron.openExternal(GITHUB_URL);
		} else {
			window.open(GITHUB_URL, "_blank");
		}
	};

	const handleVersionClick = async () => {
		if (!import.meta.env.DEV) return;
		await window.electron?.updater.checkForUpdates();
	};

	const next = NEXT_STEP[currentStep];

	const isNextDisabled =
		currentStep === "database" ? !samplePDF
		: currentStep === "ocr-region" ? !samplePDF || ocrRegion === undefined
		: !stampPosition;

	return (
		<footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur-sm">
			<div className="py-2 px-4 text-sm text-gray-500 flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<a
						href={GITHUB_URL}
						onClick={handleGithubClick}
						className="flex items-center gap-2 hover:text-gray-700 transition-colors"
						title="Voir sur GitHub"
					>
						<Github className="w-4 h-4" />
					</a>
					<button
						type="button"
						onClick={handleVersionClick}
						className="font-medium hover:underline"
						title="Relancer la vérification des mises à jour (dev)"
					>
						v{version}
					</button>
					<UpdateBadge />
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => onStartOnboarding?.()}
						className="btn btn-sm btn-outline gap-2"
					>
						<HelpCircle className="w-4 h-4" />
						Besoin d'aide ?
					</button>
					{next && (
						<button
							type="button"
							onClick={() => onStepChange(next.step)}
							disabled={isNextDisabled}
							className="btn btn-primary btn-sm gap-2"
						>
							Suivant → {next.label}
							<ChevronRight className="w-4 h-4" />
						</button>
					)}
				</div>
			</div>
		</footer>
	);
}
