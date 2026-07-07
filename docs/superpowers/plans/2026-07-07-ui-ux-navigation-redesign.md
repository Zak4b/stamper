# UI/UX Navigation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la navigation par boutons par un stepper daisyUI horizontal et fusionner le footer avec une barre d'action "Suivant" fixe en bas.

**Architecture:** Deux nouveaux composants (`StepperNav` + `BottomActionBar`) remplacent `NavigationSteps` et `Footer`. Les flags de complétion sont calculés dans `StepperNav` à partir des props. `App.tsx` câble les données entre le contexte et les deux composants.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, daisyUI v5, Lucide React, Electron

## Global Constraints

- Tailwind CSS v4 (CSS-first config via `src/index.css`, pas de `tailwind.config.js`)
- daisyUI v5 — plugin enregistré via `@plugin "daisyui"` dans le CSS
- Aucun changement au `PDFContext`, aux pages `*Step.tsx`, ni aux autres composants
- Pas de framework de test — vérification via `npm run typecheck` + dev server visuel
- `NavigationSteps.tsx`, `NavigationButton.tsx`, `Footer.tsx` sont **supprimés** à la fin

---

## File Map

| Action | Fichier |
|--------|---------|
| Modifier | `src/index.css` |
| Créer | `src/components/navigation/StepperStep.tsx` |
| Créer | `src/components/navigation/StepperNav.tsx` |
| Créer | `src/components/common/BottomActionBar.tsx` |
| Modifier | `src/App.tsx` |
| Supprimer | `src/components/navigation/NavigationSteps.tsx` |
| Supprimer | `src/components/navigation/NavigationButton.tsx` |
| Supprimer | `src/components/common/Footer.tsx` |

---

## Task 1: Installer et configurer daisyUI

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `src/index.css`

**Interfaces:**
- Produces: classes daisyUI disponibles globalement (`steps`, `step`, `step-primary`, `step-success`, `btn`, `btn-primary`, `btn-outline`, `btn-sm`)

- [ ] **Step 1: Installer daisyUI**

```bash
npm install daisyui
```

Expected output: `added 1 package` (ou similaire), pas d'erreur.

- [ ] **Step 2: Enregistrer le plugin dans le CSS**

Ouvrir `src/index.css`. Son contenu actuel est :
```css
@import "tailwindcss";
```

Modifier pour :
```css
@import "tailwindcss";
@plugin "daisyui";
```

- [ ] **Step 3: Vérifier le typecheck**

```bash
npm run typecheck
```

Expected: aucune erreur TypeScript.

- [ ] **Step 4: Commit**

```bash
git add src/index.css package.json package-lock.json
git commit -m "chore: install daisyui"
```

---

## Task 2: StepperStep + StepperNav

**Files:**
- Create: `src/components/navigation/StepperStep.tsx`
- Create: `src/components/navigation/StepperNav.tsx`
- Modify: `src/App.tsx`
- Delete: `src/components/navigation/NavigationSteps.tsx`
- Delete: `src/components/navigation/NavigationButton.tsx`

**Interfaces:**
- Consumes: `PDFFile` de `../../types/PDFFile`, `StampPosition` de `../../lib/pdfStamper`, `Rectangle` de `tesseract.js`
- Produces:
  - `StepState = "active" | "complete" | "accessible" | "locked"` exporté depuis `StepperStep.tsx`
  - `StepperNavProps` exporté depuis `StepperNav.tsx`
  - `<StepperNav>` consommé dans `App.tsx`

- [ ] **Step 1: Créer `StepperStep.tsx`**

Créer `src/components/navigation/StepperStep.tsx` :

```tsx
type StepState = "active" | "complete" | "accessible" | "locked";

interface StepperStepProps {
	state: StepState;
	label: string;
	onClick: () => void;
}

const StepperStep: React.FC<StepperStepProps> = ({ state, label, onClick }) => {
	const cls =
		state === "active"
			? "step step-primary"
			: state === "complete"
			? "step step-success"
			: "step";

	const cursor = state === "locked" ? "cursor-not-allowed" : "cursor-pointer";

	return (
		<li
			className={`${cls} ${cursor} text-xs`}
			data-content={state === "complete" ? "✓" : undefined}
			onClick={state !== "locked" ? onClick : undefined}
		>
			{label}
		</li>
	);
};

export type { StepState };
export default StepperStep;
```

> Note: pas d'import React explicite nécessaire (React 19 + Vite), mais ajouter `import React from "react";` en tête si le typecheck le demande.

- [ ] **Step 2: Créer `StepperNav.tsx`**

Créer `src/components/navigation/StepperNav.tsx` :

```tsx
import React from "react";
import { type Rectangle } from "tesseract.js";
import { type StampPosition } from "../../lib/pdfStamper";
import { type PDFFile } from "../../types/PDFFile";
import StepperStep, { type StepState } from "./StepperStep";

type Step = "database" | "ocr-region" | "position" | "stamping" | "review";

interface StepperNavProps {
	currentStep: Step;
	samplePDF: File | null;
	ocrRegion: Rectangle | undefined;
	stampPosition: StampPosition | null;
	loadedPDFs: PDFFile[];
	onStepChange: (step: Step) => void;
}

interface StepConfig {
	key: Step;
	label: string;
	isComplete: (props: StepperNavProps) => boolean;
	isLocked: (props: StepperNavProps) => boolean;
}

const STEPS: StepConfig[] = [
	{
		key: "database",
		label: "Références",
		isComplete: ({ samplePDF }) => samplePDF !== null,
		isLocked: () => false,
	},
	{
		key: "ocr-region",
		label: "Zone OCR",
		isComplete: ({ ocrRegion }) => ocrRegion !== undefined,
		isLocked: ({ samplePDF }) => !samplePDF,
	},
	{
		key: "position",
		label: "Position",
		isComplete: ({ stampPosition }) => stampPosition !== null,
		isLocked: ({ samplePDF }) => !samplePDF,
	},
	{
		key: "stamping",
		label: "Traitement",
		isComplete: ({ loadedPDFs }) =>
			loadedPDFs.length > 0 &&
			loadedPDFs.every((f) => f.status === "completed" || f.status === "error"),
		isLocked: ({ stampPosition }) => !stampPosition,
	},
	{
		key: "review",
		label: "Revue",
		isComplete: () => false,
		isLocked: ({ stampPosition }) => !stampPosition,
	},
];

const StepperNav: React.FC<StepperNavProps> = (props) => {
	const { currentStep, onStepChange } = props;

	return (
		<ul className="steps w-full mb-8">
			{STEPS.map((step) => {
				const complete = step.isComplete(props);
				const locked = step.isLocked(props);
				const active = currentStep === step.key;

				const state: StepState =
					complete && !active
						? "complete"
						: active
						? "active"
						: locked
						? "locked"
						: "accessible";

				return (
					<StepperStep
						key={step.key}
						state={state}
						label={step.label}
						onClick={() => onStepChange(step.key)}
					/>
				);
			})}
		</ul>
	);
};

export type { StepperNavProps };
export default StepperNav;
```

- [ ] **Step 3: Mettre à jour `App.tsx`**

Remplacer le contenu de `src/App.tsx` par :

```tsx
import LoadingSpinner from "./components/common/LoadingSpinner";
import BottomActionBar from "./components/common/BottomActionBar";
import StepperNav from "./components/navigation/StepperNav";
import { PDFProvider } from "./contexts/PDFContext";
import { usePDFContext } from "./hooks/usePDFContext";
import OnboardingWizardPanel, { type OnboardingWizardPanelHandle } from "./components/onboarding/OnboardingWizardPanel";
import { useUpdaterStore } from "./stores/useUpdaterStore";
import { lazy, Suspense, useEffect, useRef } from "react";

const DatabaseStep = lazy(() => import("./pages/DatabaseStep"));
const OCRStep = lazy(() => import("./pages/OCRStep"));
const PositionStep = lazy(() => import("./pages/PositionStep"));
const StampingStep = lazy(() => import("./pages/StampingStep"));
const ReviewStep = lazy(() => import("./pages/ReviewStep"));

function AppContent() {
	const { currentStep, samplePDF, options, loadedPDFs, setCurrentStep } = usePDFContext();
	const onboardingRef = useRef<OnboardingWizardPanelHandle>(null);
	const initializeUpdater = useUpdaterStore((s) => s.initialize);

	useEffect(() => initializeUpdater(), [initializeUpdater]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-12">
			<div className="max-w-7xl mx-auto px-4 py-8">
				<StepperNav
					currentStep={currentStep}
					samplePDF={samplePDF}
					ocrRegion={options.ocrRegion}
					stampPosition={options.stampPosition}
					loadedPDFs={loadedPDFs}
					onStepChange={setCurrentStep}
				/>
				<OnboardingWizardPanel ref={onboardingRef} />
				<Suspense fallback={<LoadingSpinner />}>
					<div className="space-y-6">
						{currentStep === "database" && <DatabaseStep />}
						{currentStep === "ocr-region" && <OCRStep />}
						{currentStep === "position" && <PositionStep />}
						{currentStep === "stamping" && <StampingStep />}
						{currentStep === "review" && <ReviewStep stampPosition={options.stampPosition!} ocrRegion={options.ocrRegion} ocrPageNumber={options.ocrPageNumber} />}
					</div>
				</Suspense>
			</div>
			<BottomActionBar
				currentStep={currentStep}
				samplePDF={samplePDF}
				stampPosition={!!options.stampPosition}
				onStepChange={setCurrentStep}
				onStartOnboarding={() => onboardingRef.current?.start()}
			/>
		</div>
	);
}

export default function App() {
	return (
		<PDFProvider>
			<AppContent />
		</PDFProvider>
	);
}
```

> Note: `BottomActionBar` sera créé en Task 3. Pour que le typecheck passe maintenant, le fichier doit exister. **Créer un stub temporaire** à `src/components/common/BottomActionBar.tsx` :
> ```tsx
> export default function BottomActionBar() { return null; }
> ```

- [ ] **Step 4: Supprimer les anciens fichiers de navigation**

```bash
rm src/components/navigation/NavigationSteps.tsx
rm src/components/navigation/NavigationButton.tsx
```

- [ ] **Step 5: Vérifier le typecheck**

```bash
npm run typecheck
```

Expected: aucune erreur TypeScript.

- [ ] **Step 6: Vérifier visuellement dans le dev server**

```bash
npm run dev
```

Ouvrir l'app dans Electron (ou browser). Vérifier :
- Le stepper horizontal s'affiche avec 5 étapes reliées par des traits
- L'étape "Références" est bleue (active)
- Les étapes verrouillées ont le curseur `not-allowed`
- En chargeant un PDF, l'étape 1 passe en vert ✓ et l'étape 2 devient active

- [ ] **Step 7: Commit**

```bash
git add src/components/navigation/StepperStep.tsx src/components/navigation/StepperNav.tsx src/App.tsx
git rm src/components/navigation/NavigationSteps.tsx src/components/navigation/NavigationButton.tsx
git commit -m "feat: replace navigation buttons with daisyUI stepper"
```

---

## Task 3: BottomActionBar (remplace Footer)

**Files:**
- Create: `src/components/common/BottomActionBar.tsx` (remplace le stub de Task 2)
- Delete: `src/components/common/Footer.tsx`

**Interfaces:**
- Consumes:
  - `GITHUB_URL` de `../../config/appConfig`
  - `UpdateBadge` de `./UpdateBadge` (composant existant, non modifié)
  - `Step` = `"database" | "ocr-region" | "position" | "stamping" | "review"`
- Produces: `<BottomActionBar>` avec props `{ currentStep, samplePDF, stampPosition, onStepChange, onStartOnboarding }`

- [ ] **Step 1: Créer `BottomActionBar.tsx`**

Remplacer le stub `src/components/common/BottomActionBar.tsx` par :

```tsx
import { useEffect, useState } from "react";
import { Github, HelpCircle, ChevronRight } from "lucide-react";
import { GITHUB_URL } from "../../config/appConfig";
import UpdateBadge from "./UpdateBadge";

type Step = "database" | "ocr-region" | "position" | "stamping" | "review";

const NEXT_STEP: Partial<Record<Step, { step: Step; label: string }>> = {
	database: { step: "ocr-region", label: "Zone OCR" },
	"ocr-region": { step: "position", label: "Position" },
	position: { step: "stamping", label: "Traitement" },
	stamping: { step: "review", label: "Revue" },
};

interface BottomActionBarProps {
	currentStep: Step;
	samplePDF: File | null;
	stampPosition: boolean;
	onStepChange: (step: Step) => void;
	onStartOnboarding?: () => void;
}

export default function BottomActionBar({ currentStep, samplePDF, stampPosition, onStepChange, onStartOnboarding }: BottomActionBarProps) {
	const [version, setVersion] = useState<string>(() => (window.electron ? "" : "dev"));

	useEffect(() => {
		if (!window.electron) return;
		window.electron
			.getVersion()
			.then((v) => setVersion(v))
			.catch(() => setVersion("1.0.0"));
	}, []);

	const handleGithubClick = (e: React.MouseEvent) => {
		e.preventDefault();
		if (window.electron) {
			window.electron.openExternal(GITHUB_URL);
		} else {
			window.open(GITHUB_URL, "_blank");
		}
	};

	const handleVersionClick = async () => {
		if (!import.meta.env.DEV) return;
		await window.electron?.updater.checkForUpdates();
	};

	const next = NEXT_STEP[currentStep];

	const isNextDisabled =
		currentStep === "database" || currentStep === "ocr-region"
			? !samplePDF
			: !stampPosition;

	return (
		<footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur-sm">
			<div className="py-2 px-4 text-sm text-gray-500 flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<a
						href={GITHUB_URL}
						onClick={handleGithubClick}
						className="flex items-center gap-2 hover:text-gray-700 transition-colors"
						title="Voir sur GitHub"
					>
						<Github className="w-4 h-4" />
					</a>
					<button
						type="button"
						onClick={handleVersionClick}
						className="font-medium hover:underline"
						title="Relancer la vérification des mises à jour (dev)"
					>
						v{version}
					</button>
					<UpdateBadge />
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => onStartOnboarding?.()}
						className="btn btn-sm btn-outline gap-2"
					>
						<HelpCircle className="w-4 h-4" />
						Besoin d'aide ?
					</button>
					{next && (
						<button
							type="button"
							onClick={() => onStepChange(next.step)}
							disabled={isNextDisabled}
							className="btn btn-primary btn-sm gap-2"
						>
							Suivant → {next.label}
							<ChevronRight className="w-4 h-4" />
						</button>
					)}
				</div>
			</div>
		</footer>
	);
}
```

- [ ] **Step 2: Supprimer `Footer.tsx`**

```bash
rm src/components/common/Footer.tsx
```

- [ ] **Step 3: Vérifier le typecheck**

```bash
npm run typecheck
```

Expected: aucune erreur TypeScript.

- [ ] **Step 4: Vérifier visuellement dans le dev server**

```bash
npm run dev
```

Vérifier dans l'app :
- La barre du bas affiche GitHub / version / UpdateBadge à gauche, "Besoin d'aide ?" + "Suivant → Zone OCR" à droite
- "Suivant → Zone OCR" est **grisé/disabled** tant qu'aucun PDF n'est chargé
- Après chargement d'un PDF, le bouton devient actif et navigue vers l'étape 2
- Sur l'étape "Revue" (étape 5), le bouton "Suivant" est **absent**
- "Besoin d'aide ?" déclenche toujours le wizard d'onboarding

- [ ] **Step 5: Commit final**

```bash
git add src/components/common/BottomActionBar.tsx
git rm src/components/common/Footer.tsx
git commit -m "feat: replace footer with BottomActionBar + Suivant button"
```
