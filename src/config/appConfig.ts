import type { AppConfig, IDPattern } from "../types/Config";

export const GITHUB_URL = "https://github.com/Zak4b";

export const appConfig: AppConfig = {
	idPatterns: [
		{
			name: "PREFD66",
			pattern: /(PREFD66-\d{2}-\d{4})/gi,
			captureGroup: 1,
			enabled: true,
		},
		{
			name: "PREFD66_alt",
			pattern: /-(\d{2}-\d{4})/gi,
			captureGroup: 1,
			transform: (match) => `PREFD66-${match}`,
			enabled: false,
		},
	],

	stampStyle: {
		fontFamily: "Arial, sans-serif",
		fontSize: 14,
		fontColor: "#000000",
	},

	ocrConfig: {
		confidence: 60,
	},

	general: {
		defaultTimeout: 30000,
	},
};

export function getEnabledPatterns(): IDPattern[] {
	return appConfig.idPatterns.filter((pattern) => pattern.enabled);
}
