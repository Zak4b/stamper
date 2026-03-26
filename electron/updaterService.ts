import { app, BrowserWindow, ipcMain } from "electron";
import { autoUpdater } from "electron-updater";
import { type UpdaterState } from "../src/types/updater";

let updaterState: UpdaterState = {
	stage: "idle",
	message: "Aucune verification lancee",
	progress: null,
	version: null,
};

let getMainWindow: () => BrowserWindow | null = () => null;
let mockDownloadTimer: NodeJS.Timeout | null = null;

const setUpdaterState = (next: Partial<UpdaterState>) => {
	updaterState = { ...updaterState, ...next };
	const window = getMainWindow();
	if (!window || window.isDestroyed()) return;
	window.webContents.send("updater:status", updaterState);
};

const isPortableBuild = () => Boolean(process.env.PORTABLE_EXECUTABLE_DIR);
const isUpdaterEnabled = () => app.isPackaged && process.env.DISABLE_AUTO_UPDATER !== "true" && !isPortableBuild();
const isMockUpdaterEnabled = () => !app.isPackaged && process.env.MOCK_UPDATER === "true";

const clearMockDownloadTimer = () => {
	if (!mockDownloadTimer) return;
	clearInterval(mockDownloadTimer);
	mockDownloadTimer = null;
};

const runMockCheckForUpdates = async () => {
	setUpdaterState({
		stage: "checking",
		message: "Recherche de mises a jour (mock)...",
		progress: null,
		version: null,
	});
	await new Promise((resolve) => setTimeout(resolve, 600));
	setUpdaterState({
		stage: "available",
		message: "Mise a jour 9.9.9 disponible (mock)",
		progress: null,
		version: "9.9.9-mock",
	});
};

const runMockDownload = async () => {
	if (updaterState.stage !== "available") return false;

	clearMockDownloadTimer();
	setUpdaterState({
		stage: "downloading",
		message: "Telechargement (mock): 0%",
		progress: 0,
	});

	await new Promise<void>((resolve) => {
		let progress = 0;
		mockDownloadTimer = setInterval(() => {
			progress = Math.min(progress + 20, 100);
			setUpdaterState({
				stage: progress < 100 ? "downloading" : "downloaded",
				message: progress < 100 ? `Telechargement (mock): ${progress}%` : `Mise a jour ${updaterState.version ?? "9.9.9-mock"} prete a installer (mock)`,
				progress,
				version: updaterState.version ?? "9.9.9-mock",
			});
			if (progress >= 100) {
				clearMockDownloadTimer();
				resolve();
			}
		}, 350);
	});

	return true;
};

let updaterConfigured = false;

export function configureUpdater(mainWindowGetter: () => BrowserWindow | null) {
	getMainWindow = mainWindowGetter;
	if (updaterConfigured) return;
	updaterConfigured = true;

	if (isMockUpdaterEnabled()) {
		setUpdaterState({
			stage: "idle",
			message: "Mock updater actif (dev)",
			progress: null,
			version: null,
		});
		return;
	}

	if (!isUpdaterEnabled()) {
		setUpdaterState({
			stage: "disabled",
			message: app.isPackaged ? "Auto-update desactive pour cette build" : "Auto-update desactive en mode developpement",
			progress: null,
			version: null,
		});
		return;
	}

	autoUpdater.autoDownload = false;
	autoUpdater.autoInstallOnAppQuit = true;

	autoUpdater.on("checking-for-update", () => {
		setUpdaterState({ stage: "checking", message: "Recherche de mises a jour...", progress: null, version: null });
	});

	autoUpdater.on("update-available", (info) => {
		setUpdaterState({
			stage: "available",
			message: `Mise a jour ${info.version} disponible`,
			progress: null,
			version: info.version,
		});
	});

	autoUpdater.on("update-not-available", () => {
		setUpdaterState({
			stage: "not-available",
			message: "Aucune mise a jour disponible",
			progress: null,
			version: null,
		});
	});

	autoUpdater.on("download-progress", (progress) => {
		setUpdaterState({
			stage: "downloading",
			message: `Telechargement: ${Math.round(progress.percent)}%`,
			progress: progress.percent,
			version: updaterState.version,
		});
	});

	autoUpdater.on("update-downloaded", (info) => {
		setUpdaterState({
			stage: "downloaded",
			message: `Mise a jour ${info.version} prete a installer`,
			progress: 100,
			version: info.version,
		});
	});

	autoUpdater.on("error", (error) => {
		setUpdaterState({
			stage: "error",
			message: `Erreur update: ${error.message}`,
			progress: null,
			version: null,
		});
	});
}

export function checkForUpdatesOnStartup() {
	if (isMockUpdaterEnabled()) {
		void runMockCheckForUpdates();
		return;
	}
	if (!isUpdaterEnabled()) return;
	void autoUpdater.checkForUpdates();
}

export function registerUpdaterIpcHandlers() {
	ipcMain.handle("updater:getState", () => updaterState);

	ipcMain.handle("updater:checkForUpdates", async () => {
		if (isMockUpdaterEnabled()) {
			await runMockCheckForUpdates();
			return updaterState;
		}
		if (!isUpdaterEnabled()) {
			setUpdaterState({
				stage: "disabled",
				message: "Auto-update non disponible pour cette build",
				progress: null,
				version: null,
			});
			return updaterState;
		}
		await autoUpdater.checkForUpdates();
		return updaterState;
	});

	ipcMain.handle("updater:installUpdate", () => {
		if (isMockUpdaterEnabled()) {
			if (updaterState.stage !== "downloaded") return false;
			setUpdaterState({
				stage: "idle",
				message: "Installation mock terminee. Pret pour un nouveau test.",
				progress: null,
				version: null,
			});
			return true;
		}
		if (!isUpdaterEnabled()) return false;
		if (updaterState.stage !== "downloaded") return false;
		autoUpdater.quitAndInstall();
		return true;
	});

	ipcMain.handle("updater:downloadUpdate", async () => {
		if (isMockUpdaterEnabled()) {
			return await runMockDownload();
		}
		if (!isUpdaterEnabled()) return false;
		if (updaterState.stage !== "available") return false;
		await autoUpdater.downloadUpdate();
		return true;
	});
}
