# UI/UX Navigation Redesign

**Date:** 2026-07-07  
**App:** pdf-stamper-electron v1.3.0  
**Scope:** Navigation principale + parcours step-by-step

## Problèmes résolus

- Les onglets de navigation ressemblent à des boutons d'action (même style `rounded-lg px-5 py-3`)
- Aucun indicateur de progression ou de complétion par étape
- Pas de CTA "Suivant" — l'utilisateur doit revenir manuellement aux onglets
- L'état "complété" d'une étape n'est pas communiqué visuellement

## Approche retenue

**Stepper horizontal + Bottom Action Bar unifiée — avec daisyUI.**

Remplacer `NavigationSteps` par un stepper (cercles numérotés reliés par une ligne, checkmarks verts sur étapes complètes). Fusionner le `Footer` avec une barre d'action fixe en bas qui contient à gauche les éléments de footer existants, et à droite un bouton "Suivant" contextuel.

**daisyUI** sera installé (`daisyui@latest`) et utilisé là où ses composants apportent de la valeur : `steps` pour le stepper, `btn` pour les boutons, `badge` pour l'`UpdateBadge`.

**Installation :**
```bash
npm install daisyui
```
Puis dans `src/index.css` (Tailwind v4) :
```css
@plugin "daisyui";
```

## Section 1 — StepperNav

Composant `StepperNav` remplaçant `NavigationSteps`. Utilise le composant daisyUI **`steps`** (`ul.steps`) — ligne horizontale avec 5 `li.step`, reliés par des traits gérés nativement.

**États daisyUI par étape :**
- **Active** : `step step-primary` (bleu)
- **Complète** : `step step-success` + `data-content="✓"` (vert avec checkmark)
- **Future accessible** : `step` seul (gris), cliquable
- **Verrouillée** : `step` seul (gris), `cursor-not-allowed`, `onClick` bloqué

Le trait de connexion entre étapes est géré automatiquement par daisyUI : vert (`step-success`) si l'étape source est complète, gris sinon.

**Logique de complétion par étape :**

| Étape | Label | Complète quand |
|-------|-------|----------------|
| 1 | Références | `samplePDF !== null` |
| 2 | Zone OCR | `options.ocrRegion !== undefined` |
| 3 | Position | `options.stampPosition !== null` |
| 4 | Traitement | `loadedPDFs.length > 0 && loadedPDFs.every(f => f.status === 'completed' \|\| f.status === 'error')` |
| 5 | Revue | — (dernière étape) |

**Navigabilité (identique à l'existant) :**
- ocr-region, position : requiert `samplePDF !== null`
- stamping, review : requiert `options.stampPosition !== null`
- Toutes les étapes accessibles sont cliquables librement

## Section 2 — BottomActionBar

Composant `BottomActionBar` remplaçant `Footer`. Barre fixe `fixed bottom-0`, même style que le footer actuel (bordure top, fond blanc semi-transparent, backdrop-blur).

**Layout :**
```
[ GitHub  v1.3.0  [UpdateBadge]   Besoin d'aide? ]    [ Suivant → <label> ]
  ←————————————— gauche ————————————————————————————    ——————— droite ————→
```

**Zone gauche :** reprise exacte du footer actuel (icône GitHub, version, `UpdateBadge`, bouton "Besoin d'aide ?").

**Zone droite — bouton "Suivant" :**
- Style daisyUI : `btn btn-primary`, icône `ChevronRight`
- Libellé dynamique : `"Suivant → Zone OCR"`, `"Suivant → Position"`, `"Suivant → Traitement"`, `"Suivant → Revue"`
- `disabled` + grisé automatiquement par daisyUI si l'étape suivante est verrouillée
- Absent sur l'étape **Revue** (dernière étape)

**Bouton "Besoin d'aide ?" :** migré vers `btn btn-sm btn-outline` daisyUI (remplace les classes Tailwind manuelles actuelles).

**Logique disabled par étape courante :**

| Étape courante | Étape suivante | Disabled si |
|----------------|----------------|-------------|
| database | ocr-region | `!samplePDF` |
| ocr-region | position | `!samplePDF` |
| position | stamping | `!options.stampPosition` |
| stamping | review | `!options.stampPosition` |
| review | — | bouton absent |

## Section 3 — Architecture

**Fichiers modifiés :**
- `src/App.tsx` — imports mis à jour (`StepperNav`, `BottomActionBar`)
- `src/components/navigation/NavigationSteps.tsx` → **supprimé**
- `src/components/navigation/NavigationButton.tsx` → **supprimé**
- `src/components/common/Footer.tsx` → **supprimé**

**Nouveaux fichiers :**
- `src/components/navigation/StepperNav.tsx` — stepper principal
- `src/components/navigation/StepperStep.tsx` — composant pur (cercle + label + trait)
- `src/components/common/BottomActionBar.tsx` — fusion footer + bouton Suivant

**Props de `StepperNav` :**
```ts
interface StepperNavProps {
  currentStep: Step
  samplePDF: File | null
  options: Options
  loadedPDFs: PDFFile[]
  onStepChange: (step: Step) => void
}
```
Les flags de complétion sont calculés dans `StepperNav`, pas dans `App.tsx`.

**Aucun changement :** `PDFContext`, pages `*Step.tsx`, autres composants.

## Hors scope

- Refonte du contenu des pages
- Changement du système d'onboarding
- Ajout de nouvelles étapes ou fonctionnalités
