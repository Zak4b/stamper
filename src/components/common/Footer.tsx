import { useEffect, useState } from "react";
import { Github, HelpCircle } from "lucide-react";
import { GITHUB_URL } from "../../config/appConfig";

type FooterProps = {
	onStartOnboarding?: () => void;
};

export default function Footer({ onStartOnboarding }: FooterProps) {
	const [version, setVersion] = useState<string>(() => (window.electron ? "" : "dev"));

	useEffect(() => {
		// Récupérer la version depuis Electron
		if (!window.electron) return;
		window.electron
			.getVersion()
			.then((v) => setVersion(v))
			.catch(() => {
				setVersion("1.0.0");
			});
	}, []);

	const handleGithubClick = (e: React.MouseEvent) => {
		e.preventDefault();
		if (window.electron) {
			window.electron.openExternal(GITHUB_URL);
		} else {
			window.open(GITHUB_URL, "_blank");
		}
	};

	return (
		<footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur-sm">
			<div className="mx-auto max-w-7xl px-4 py-2 text-sm text-gray-500 flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<a
						href={GITHUB_URL}
						onClick={handleGithubClick}
						className="flex items-center gap-2 hover:text-gray-700 transition-colors"
						title="Voir sur GitHub"
					>
						<Github className="w-4 h-4" />
						<span className="font-medium">v{version}</span>
					</a>
				</div>
				<button
					type="button"
					onClick={() => onStartOnboarding?.()}
					className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-cyan-300 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors"
				>
					<HelpCircle className="w-4 h-4" />
					<span className="font-medium">Besoin d'aide ?</span>
				</button>
			</div>
		</footer>
	);
}
