import { create } from "zustand";
import { type UpdaterState } from "../types/updater";

type UpdaterStore = {
	updaterState: UpdaterState | null;
	isDownloading: boolean;
	isInstalling: boolean;
	initialize: () => (() => void) | undefined;
	downloadUpdate: () => Promise<void>;
	installUpdate: () => Promise<void>;
};

export const useUpdaterStore = create<UpdaterStore>((set, get) => ({
	updaterState: null,
	isDownloading: false,
	isInstalling: false,

	initialize: () => {
		const updaterApi = window.electron?.updater;
		if (!updaterApi) return undefined;

		void updaterApi.getState().then((state) => set({ updaterState: state })).catch(() => undefined);
		return updaterApi.onStatus((state) => set({ updaterState: state }));
	},

	downloadUpdate: async () => {
		const updaterApi = window.electron?.updater;
		const { updaterState, isDownloading } = get();
		if (!updaterApi || isDownloading || updaterState?.stage !== "available") return;

		set({ isDownloading: true });
		try {
			await updaterApi.downloadUpdate();
		} finally {
			set({ isDownloading: false });
		}
	},

	installUpdate: async () => {
		const updaterApi = window.electron?.updater;
		const { updaterState, isInstalling } = get();
		if (!updaterApi || isInstalling || updaterState?.stage !== "downloaded") return;

		set({ isInstalling: true });
		try {
			await updaterApi.installUpdate();
		} finally {
			set({ isInstalling: false });
		}
	},
}));
