export type UpdaterStage =
	| "idle"
	| "checking"
	| "available"
	| "not-available"
	| "downloading"
	| "downloaded"
	| "error"
	| "disabled";

export interface UpdaterState {
	stage: UpdaterStage;
	message: string;
	progress: number | null;
	version: string | null;
}
