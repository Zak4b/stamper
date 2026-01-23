import { useEffect, useState } from "react";
import { Github } from "lucide-react";
import { GITHUB_URL } from "../../config/appConfig";

export default function Footer() {
	const [version, setVersion] = useState<string>("");

	useEffect(() => {
		// Récupérer la version depuis Electron
		if (window.electron) {
			window.electron
				.getVersion()
				.then((v) => setVersion(v))
				.catch(() => {
					setVersion("1.0.0");
				});
		} else {
			setVersion("dev");
		}
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
		<footer className="fixed bottom-0 left-0 py-4 px-4 text-sm text-gray-500 z-10 flex items-center gap-3">
			<a
				href={GITHUB_URL}
				onClick={handleGithubClick}
				className="flex items-center gap-2 hover:text-gray-700 transition-colors"
				title="Voir sur GitHub"
			>
				<Github className="w-4 h-4" />
			</a>
			<span className="font-medium">v{version}</span>
		</footer>
	);
}
