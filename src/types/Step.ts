export type Step = "database" | "ocr-region" | "position" | "stamping" | "review";

export interface StepDefinition {
	key: Step;
	label: string;
	hint: string;
}

export const STEPS: StepDefinition[] = [
	{ key: "database", label: "Références", hint: "CSV & PDF modèle" },
	{ key: "ocr-region", label: "Zone OCR", hint: "Numéro de dossier" },
	{ key: "position", label: "Position tampon", hint: "Emplacement de la date" },
	{ key: "stamping", label: "Traitement", hint: "Tamponnage par lot" },
	{ key: "review", label: "Revue", hint: "Fichiers en erreur" },
];
