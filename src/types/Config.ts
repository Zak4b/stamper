export interface IDPattern {
	name: string;
	pattern: RegExp;
	captureGroup?: number;
	transform?: (match: string) => string;
	enabled: boolean;
}

export interface StampStyle {
	fontFamily: string;
	fontSize: number;
	fontColor: string;
}

export interface AppConfig {
	idPatterns: IDPattern[];
	stampStyle: StampStyle;
	ocrConfig: {
		confidence: number;
	};
	general: {
		defaultTimeout: number; // en ms
	};
}
