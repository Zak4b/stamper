# PDF Stamping Web Application

Une application web moderne pour tamponner automatiquement des documents PDF avec reconnaissance OCR et gestion de base de données.

## 🚀 Fonctionnalités

### ✨ Traitement Automatisé

- **Reconnaissance OCR** : Extraction automatique des numéros de dossier dans les PDFs
- **Tamponnage intelligent** : Application automatique de tampons personnalisés
- **Traitement par lot** : Gestion simultanée de multiples documents PDF
- **Pipeline automatique** : OCR → Analyse → Tamponnage en continu

### 📄 Gestion des PDFs

- **Chargement multiple** : Glisser-déposer ou sélection de plusieurs fichiers
- **Aperçu en temps réel** : Visualisation des PDFs avec sélection de zones
- **Téléchargement flexible** : Fichiers individuels ou archive ZIP complète
- **Édition manuelle** : Correction des numéros détectés par OCR

### 🎯 Configuration Avancée

- **Sélection de zones OCR** : Définition précise des régions à analyser
- **Positionnement de tampons** : Interface visuelle pour placer les tampons
- **Gestion des orientations** : Détection et correction automatique des rotations
- **Base de données** : Correspondance numéros de dossier ↔ valeurs de tampon

### 📊 Suivi et Monitoring

- **Statistiques en temps réel** : Progression du traitement
- **États détaillés** : En attente, OCR, Analysé, Traitement, Terminé, Erreur
- **Gestion d'erreurs** : Affichage et traitement des problèmes

## 🏗️ Architecture

### Librairies Spécialisées

- **Tesseract.js** : Reconnaissance OCR côté client
- **PDF-lib** : Manipulation et tamponnage des PDFs
- **SQL.js** : Base de données locale SQLite
- **JSZip** : Création d'archives ZIP
- **PDF.js** : Rendu et visualisation des PDFs

## 🛠️ Installation

### Prérequis

- Node.js (v16+)
- npm

### Installation

```bash
git clone <repository-url>
cd pdf
npm install
```

### Build de production

```bash
npm run build
npm run preview
```

## 🔧 Configuration

### Structure de la base de données

```sql
CREATE TABLE dossiers (
    id INTEGER PRIMARY KEY,
    numero_dossier TEXT UNIQUE,
    valeur_tampon TEXT,
    created_at TEXT,
    updated_at TEXT
);
```

## 📖 Guide d'utilisation

### 1. Configuration de la base de données

- Importer un fichier CSV avec les correspondances

### 2. Configuration OCR

- Charger un PDF de référence
- Sélectionner la zone à analyser

### 3. Positionnement du tampon

- Cliquer pour définir la position du tampon

### 4. Traitement par lot

- Charger les PDFs à traiter
- Téléchargement des résultats

## 🔍 Fonctionnalités Avancées

### Détection d'anomalies

- **Auto-rotation** : Correction automatique des orientations
- **Validation OCR** : Vérification de la confiance des résultats

### Performance

- **Traitement asynchrone** : Non-bloquant pour l'interface
- **Lazy loading** : Chargement à la demande des composants

## 🚦 États du workflow

```
PENDING → OCR → ANALYZED → PROCESSING → COMPLETED
   ↓                          ↓
 ERROR  ←――――――――――――――――――― ERROR
```

- **PENDING** : En attente de traitement
- **OCR** : Reconnaissance en cours
- **ANALYZED** : Prêt pour tamponnage
- **PROCESSING** : Tamponnage en cours
- **COMPLETED** : Terminé avec succès
- **ERROR** : Erreur à traiter
