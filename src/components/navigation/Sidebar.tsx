import React, { useEffect, useState } from "react";
import {
	Database,
	Stamp,
	Search,
	FileText,
	ClipboardCheck,
	ChevronLeft,
	ChevronRight,
	Github,
	HelpCircle,
	Lock,
} from "lucide-react";
import { GITHUB_URL } from "../../config/appConfig";
import UpdateBadge from "../common/UpdateBadge";
import { STEPS, type Step } from "../../types/Step";

const STEP_ICONS: Record<Step, React.ReactNode> = {
	database: <Database className="w-5 h-5" />,
	"ocr-region": <Search className="w-5 h-5" />,
	position: <Stamp className="w-5 h-5" />,
	stamping: <FileText className="w-5 h-5" />,
	review: <ClipboardCheck className="w-5 h-5" />,
};

interface SidebarProps {
	currentStep: Step;
	samplePDF: File | null;
	stampPosition: boolean;
	onStepChange: (step: Step) => void;
	onStartOnboarding?: () => void;
}

const COLLAPSED_KEY = "sidebar:collapsed";

const Sidebar: React.FC<SidebarProps> = ({
	currentStep,
	samplePDF,
	stampPosition,
	onStepChange,
	onStartOnboarding,
}) => {
	const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem(COLLAPSED_KEY) === "1");
	const [version, setVersion] = useState<string>(() => (window.electron ? "" : "dev"));

	useEffect(() => {
		localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
	}, [collapsed]);

	useEffect(() => {
		if (!window.electron) return;
		window.electron
			.getVersion()
			.then(setVersion)
			.catch(() => setVersion("1.0.0"));
	}, []);

	const isLocked = (step: Step) => {
		if (step === "ocr-region" || step === "position") return !samplePDF;
		if (step === "stamping" || step === "review") return !stampPosition;
		return false;
	};

	const handleGithubClick = (e: React.MouseEvent) => {
		e.preventDefault();
		if (window.electron) window.electron.openExternal(GITHUB_URL);
		else window.open(GITHUB_URL, "_blank");
	};

	const handleVersionClick = async () => {
		if (!import.meta.env.DEV) return;
		await window.electron?.updater.checkForUpdates();
	};

	return (
		<aside
			className={`${collapsed ? "w-16" : "w-60"} shrink-0 h-full flex flex-col border-r border-gray-200 bg-white transition-[width] duration-200`}
		>
			<div
				className={`flex items-center gap-2 h-12 px-3 border-b border-gray-100 ${collapsed ? "justify-center" : "justify-between"}`}
			>
				{!collapsed && (
					<div className="flex items-center gap-2 min-w-0">
						<span className="font-semibold text-gray-900 truncate">Stamper</span>
					</div>
				)}
				<button
					type="button"
					onClick={() => setCollapsed((c) => !c)}
					className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
					title={collapsed ? "Déplier le menu" : "Replier le menu"}
					aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
				>
					{collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
				</button>
			</div>

			<nav className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
				{STEPS.map((step, index) => {
					const locked = isLocked(step.key);
					const active = currentStep === step.key;
					return (
						<button
							key={step.key}
							onClick={() => !locked && onStepChange(step.key)}
							disabled={locked}
							title={collapsed ? `${index + 1}. ${step.label}` : step.hint}
							className={`w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
								collapsed ? "justify-center" : ""
							} ${
								active
									? "bg-blue-600 text-white shadow-sm"
									: locked
										? "text-gray-400 cursor-not-allowed"
										: "text-gray-700 hover:bg-gray-100"
							}`}
						>
							<span className="relative shrink-0">
								{STEP_ICONS[step.key]}
								{locked && <Lock className="w-3 h-3 absolute -bottom-1 -right-1 text-gray-400" />}
							</span>
							{!collapsed && (
								<span className="min-w-0 flex-1">
									<span className="block text-sm font-medium truncate">
										{index + 1}. {step.label}
									</span>
									<span className={`block text-[11px] truncate ${active ? "text-blue-100" : "text-gray-400"}`}>
										{step.hint}
									</span>
								</span>
							)}
						</button>
					);
				})}
			</nav>

			<div className="border-t border-gray-100 p-2 space-y-2">
				<div className={collapsed ? "flex justify-center" : ""}>
					<UpdateBadge />
				</div>
				<button
					type="button"
					onClick={() => onStartOnboarding?.()}
					title="Besoin d'aide ?"
					className={`w-full inline-flex items-center gap-2 rounded-md border border-cyan-300 bg-cyan-50 px-2.5 py-1.5 text-cyan-700 hover:bg-cyan-100 transition-colors ${
						collapsed ? "justify-center" : ""
					}`}
				>
					<HelpCircle className="w-4 h-4 shrink-0" />
					{!collapsed && <span className="text-sm font-medium">Besoin d'aide ?</span>}
				</button>
				<div className={`flex items-center gap-2 text-xs text-gray-500 ${collapsed ? "flex-col" : ""}`}>
					<a
						href={GITHUB_URL}
						onClick={handleGithubClick}
						className="hover:text-gray-700 transition-colors"
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
				</div>
			</div>
		</aside>
	);
};

export default Sidebar;
