import React from "react";

export type OnboardingAppStep = "database" | "ocr-region" | "position" | "stamping" | "review";

const label = (text: string): React.ReactNode => {
	return React.createElement(
		"span",
		{
			className: "inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-900 font-medium text-[0.85em]",
		},
		text,
	);
};

const T = (...parts: React.ReactNode[]): React.ReactNode => React.createElement(React.Fragment, null, ...parts);

export type OnboardingWizardStep = {
	appStep: OnboardingAppStep;
	highlightTarget?: string;
	title: string;
	description: React.ReactNode;
	extra?: React.ReactNode;
};

export const ONBOARDING_WIZARD_STEPS: OnboardingWizardStep[] = [
	{
		appStep: "database",
		highlightTarget: "csv-import",
		title: "Références (CSV)",
		description: T(
			"Dans l'onglet ",
			label("Références"),
			", cliquez sur ",
			label("Importer CSV"),
			". Choisissez votre fichier CSV, puis cliquez sur ",
			label("Ouvrir"),
			". Attendez la fin de l'import."
		),
		extra: T("Votre CSV doit contenir deux colonnes : ", label("numéro du dossier"), " et ", label("date"), "."),
	},
	{
		appStep: "database",
		highlightTarget: "pdf-model",
		title: "PDF modèle",
		description: T(
			"Dans l'onglet ",
			label("Références"),
			", cliquez sur ",
			label("Charger un PDF exemple"),
			". Choisissez votre PDF modèle, puis cliquez sur ",
			label("Ouvrir"),
			". Attendez que la page s'affiche."
		),
		extra: T("Ce PDF sert de base pour retrouver le ", label("numéro du dossier"), " et placer la ", label("date"), "."),
	},
	{
		appStep: "ocr-region",
		highlightTarget: "ocr-region",
		title: "Zone OCR",
		description: T(
			"Dessinez la zone de référence à analyser : cliquez, maintenez le bouton de la souris, puis glissez pour former un rectangle autour du ",
			label("numéro du dossier"),
			". Relâchez pour valider. ",
			"Préférez une zone large autour du numéro (mieux vaut trop large que trop petit). "
		),
		extra: T(
			"Si besoin, vous pouvez aussi utiliser ",
			label("Utiliser la page complète"),
			"."
		),
	},
	{
		appStep: "position",
		highlightTarget: "position",
		title: "Position tampon",
		description: T(
			"Placez le tampon : cliquez sur l'endroit exact où doit apparaître la ",
			label("date"),
			", puis maintenez si besoin. Relâchez pour enregistrer la position."
		)
	},
	{
		appStep: "stamping",
		highlightTarget: "load-pdfs",
		title: "Traitement",
		description: T(
			"Dans l'onglet ",
			label("traitement"),
			", cliquez sur ",
			label("Charger des PDFs"),
			". Choisissez vos fichiers PDF, puis cliquez sur ",
			label("Ouvrir"),
			".",
		),
		extra: T("L'OCR puis le tamponnage se lancent automatiquement. Attendez la fin avant de télécharger."),
	},
	{
		appStep: "review",
		title: "Revue",
		description: T(
			"Les fichiers en erreur apparaissent ici. Cliquez ",
			label("Visualiser"),
			", puis vérifiez/modifiez le ",
			label("numéro du dossier"),
			". Cliquez ",
			label("Enregistrer et continuer"),
			", ensuite cliquez ",
			label("Réessayer"),
			".",
		),
		extra: T("Si tout est bon, les autres fichiers passeront sans action."),
	},
];

