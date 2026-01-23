# PDF Stamper

Application Electron pour tamponner automatiquement des documents PDF avec reconnaissance OCR.

## 🚀 Fonctionnalités

- **Reconnaissance OCR** : Extraction automatique des numéros de dossier
- **Tamponnage automatique** : Application de tampons personnalisés sur les PDFs
- **Traitement par lot** : Gestion de multiples documents simultanément
- **Base de données** : Import CSV pour correspondances numéro ↔ valeur

## 🛠️ Installation

```bash
git clone <repository-url>
cd pdf
npm install
```

## 📖 Utilisation

1. **Base de données** : Importer un CSV avec les correspondances (numéro_dossier, valeur_tampon)
2. **Configuration OCR** : Charger un PDF de référence et sélectionner la zone à analyser
3. **Positionnement** : Définir la position du tampon sur le PDF
4. **Traitement** : Charger les PDFs à traiter et télécharger les résultats

## 🚀 Démarrage

```bash
# Mode développement
npm run dev

# Build de production
npm run build
```

## 📋 Prérequis

- Node.js (v20+)
- npm
