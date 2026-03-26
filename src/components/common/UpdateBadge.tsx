import { Download, RefreshCcw } from "lucide-react";
import { type UpdaterStage, type UpdaterState } from "../../types/updater";
import { useUpdaterStore } from "../../stores/useUpdaterStore";

export default function UpdateBadge() {
	const updaterState = useUpdaterStore((s) => s.updaterState);
	const isDownloading = useUpdaterStore((s) => s.isDownloading);
	const isInstalling = useUpdaterStore((s) => s.isInstalling);
	const onDownloadUpdate = useUpdaterStore((s) => s.downloadUpdate);
	const onInstallUpdate = useUpdaterStore((s) => s.installUpdate);

	const showUpdateAction = updaterState?.stage === "available" || updaterState?.stage === "downloading" || updaterState?.stage === "downloaded";
	if (!showUpdateAction || !updaterState) return null;

	const updateTooltipByStage: Record<UpdaterStage, ((state: UpdaterState) => string) | null> = {
		idle: null,
		checking: null,
		error: null,
		disabled: null,
		available: (state) => `${state.message} - Cliquer pour telecharger`,
		"not-available": null,
		downloading: (state) => state.message,
		downloaded: (state) => `${state.message} - Cliquer pour installer`,
	};

	const updateBadgeTextByStage: Record<UpdaterStage, ((state: UpdaterState) => string) | null> = {
		idle: null,
		checking: null,
		error: null,
		disabled: null,
		available: (state) => `v${state.version ?? "?.?.?"} disponible`,
		"not-available": null,
		downloading: (state) => `${Math.round(state.progress ?? 0)}%`,
		downloaded: () => "Mettre a jour",
	};

	const updateTooltip = updateTooltipByStage[updaterState.stage]?.(updaterState) ?? "";
	const updateBadgeText = updateBadgeTextByStage[updaterState.stage]?.(updaterState) ?? "Maj";

	const handleUpdateClick = () => {
		if (updaterState.stage === "available") onDownloadUpdate?.();
		if (updaterState.stage === "downloaded") onInstallUpdate?.();
	};

	const isDownloaded = updaterState.stage === "downloaded";
	const updateButtonClassName = isDownloaded
		? "inline-flex items-center gap-1 rounded-md border border-green-300 bg-green-50 px-2 py-1 text-green-700 hover:bg-green-100 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
		: "inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-amber-700 hover:bg-amber-100 transition-colors disabled:cursor-not-allowed disabled:opacity-60";

	return (
		<button
			type="button"
			onClick={handleUpdateClick}
			disabled={updaterState.stage === "downloading" || isDownloading || isInstalling}
			className={updateButtonClassName}
			title={updateTooltip}
			aria-label="Mise a jour disponible"
		>
			{updaterState.stage === "downloaded" ? <RefreshCcw className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
			<span className="text-xs font-medium">{updateBadgeText}</span>
		</button>
	);
}
