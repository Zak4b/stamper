# Analyse de refactorisation — stamper

> Généré le 2026-07-08

## Vue d'ensemble

L'application est une app Electron/React (Vite + Tailwind + daisyUI) organisée en 5 steps séquentiels : **Références → Zone OCR → Position → Traitement → Revue**. La base de code est globalement propre mais présente plusieurs duplications et une fragmentation de la logique de navigation qui augmentent le coût de maintenance.

---

## Problèmes identifiés

### P1 — Type `Step` dupliqué *(priorité haute)*

Le même union type est redéfini dans 3 fichiers :

| Fichier | Ligne |
|---|---|
| `src/contexts/PDFContext.tsx` | 6 |
| `src/components/navigation/StepperNav.tsx` | 7 |
| `src/components/common/BottomActionBar.tsx` | 7 |

**Fix** : extraire dans `src/types/Step.ts` et importer depuis les 3 consommateurs.

---

### P2 — Logique de navigation fragmentée *(priorité haute)*

La définition du flux de steps est éparpillée sur 4 endroits :

| Fichier | Responsabilité |
|---|---|
| `StepperNav.tsx` — `STEPS[]` | Ordre, labels, `isLocked`, `isComplete` |
| `BottomActionBar.tsx` — `NEXT_STEP` | Quel est le step suivant |
| `PDFContext.tsx` — `canProceedToPosition`, `canStartStamping` | Conditions de déblocage |
| `BottomActionBar.tsx` — `isNextDisabled` | Réimplémente les conditions de lock |

Modifier une condition de navigation oblige à toucher 3 fichiers distincts et à synchroniser manuellement des logiques redondantes.

**Fix** : un objet `STEP_CONFIG` centralisé (ex. dans `src/config/steps.ts`) définissant pour chaque step : `key`, `label`, `nextStep`, `isLocked(state)`, `isComplete(state)`. `StepperNav`, `BottomActionBar` et `PDFContext` le consomment.

---

### P3 — `handleRetry` dupliqué *(priorité moyenne)*

La logique de retry est réimplémentée séparément dans :

- `BatchStamper.tsx:14-17` — version simplifiée (s'appuie sur le `useEffect` pour enchaîner le stamp)
- `ReviewStep.tsx:27-44` — version complète (enchaîne manuellement `analyzeFile` → `stampFile`)

Les deux font `updatePDF(index, { status: "pending" })` puis `analyzeFile(...)`, mais avec un comportement légèrement différent, source de bugs potentiels.

**Fix** : hook `useRetryPDF` partagé, ou action `retryPDF(index)` exposée par `PDFContext`.

---

### P4 — Double bouton "Suivant" dans l'UI *(priorité moyenne)*

`OCRStep.tsx:24` et `PositionStep.tsx:24` affichent un `FloatingActionButton` "Étape suivante" **en plus** du bouton "Suivant → ..." déjà présent dans `BottomActionBar`. L'utilisateur dispose de deux éléments d'action identiques pour la même navigation.

Ces FABs datent d'avant l'ajout de la `BottomActionBar`. Ils sont désormais redondants.

**Fix** : supprimer les `FloatingActionButton` de navigation dans `OCRStep` et `PositionStep`.

---

### P5 — Extraction d'erreur répétée 5× *(priorité basse)*

```ts
error instanceof Error ? error.message : "Erreur inconnue"
```

Apparaît aux lignes 24, 47, 55, 74, 120, 149 de `DatabaseManager.tsx`.

**Fix** : utilitaire `getErrorMessage(error: unknown): string` dans `src/lib/utils.ts`.

---

### P6 — Fonction `stampAllAnalyzedFiles` non utilisée *(priorité basse)*

`pdfProcessingUtils.ts:119` exporte `stampAllAnalyzedFiles` mais aucun fichier ne l'importe. Le stamping automatique est géré par le `useEffect` de `BatchStamper`.

**Fix** : supprimer la fonction.

---

### P7 — Magic number dans `useOnboardingWizard` *(priorité basse)*

```ts
const bounded = Math.max(0, Math.min(5, nextIndex)); // useOnboardingWizard.ts:55
```

Le nombre de steps de l'onboarding est hardcodé à `5`.

**Fix** : dériver depuis `ONBOARDING_STEPS.length - 1`.

---

## Tableau de synthèse

| # | Problème | Impact | Effort estimé |
|---|---|---|---|
| P1 | Type `Step` en 3 endroits | Désync silencieuse à la modif | Faible |
| P2 | Logique navigation fragmentée | Maintenabilité, bugs potentiels | Moyen |
| P3 | `handleRetry` dupliqué | Comportement incohérent | Moyen |
| P4 | Bouton Suivant × 2 dans l'UI | UX confuse | Faible |
| P5 | `getErrorMessage` helper | Lisibilité | Trivial |
| P6 | `stampAllAnalyzedFiles` mort | Code mort | Trivial |
| P7 | Magic number onboarding | Fragilité | Trivial |

## Ordre d'attaque recommandé

1. **P1 + P2** ensemble — le type partagé est un prérequis au config centralisé
2. **P4** — suppression des FABs redondants (impact UX direct, zéro risque)
3. **P3** — hook `useRetryPDF`
4. **P5 + P6 + P7** — nettoyages opportunistes
