import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

// Initialiser la base de données
export function initDatabase(): Database.Database {
  if (db) return db;

  try {
    // Utiliser le dossier userData pour stocker la base de données
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'pdfstamper.db');

    console.log('Initialisation de la base de données:', dbPath);

    // S'assurer que le dossier existe
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    db = new Database(dbPath);

    // Créer la table si elle n'existe pas
    db.exec(`
      CREATE TABLE IF NOT EXISTS dossiers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_dossier TEXT NOT NULL UNIQUE,
        valeur_tampon TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Index pour les recherches
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_numero_dossier ON dossiers(numero_dossier);
    `);

    console.log('Base de données initialisée avec succès');
    return db;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  }
}

// Obtenir la base de données
export function getDatabase(): Database.Database {
  if (!db) {
    return initDatabase();
  }
  return db;
}

// Fermer la base de données
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// Opérations CRUD

export function getAllDossiers() {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM dossiers ORDER BY created_at DESC');
  return stmt.all();
}

export function getDossierByNumero(numero: string) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM dossiers WHERE numero_dossier = ?');
  return stmt.get(numero);
}

export function insertDossier(numero: string, valeur: string) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO dossiers (numero_dossier, valeur_tampon)
    VALUES (?, ?)
  `);
  return stmt.run(numero, valeur);
}

export function updateDossier(numero: string, valeur: string) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE dossiers 
    SET valeur_tampon = ?, updated_at = CURRENT_TIMESTAMP
    WHERE numero_dossier = ?
  `);
  return stmt.run(valeur, numero);
}

export function deleteDossier(numero: string) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM dossiers WHERE numero_dossier = ?');
  return stmt.run(numero);
}

export function deleteAllDossiers() {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM dossiers');
  return stmt.run();
}

export function searchDossiers(query: string) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM dossiers 
    WHERE numero_dossier LIKE ? OR valeur_tampon LIKE ?
    ORDER BY created_at DESC
  `);
  const searchPattern = `%${query}%`;
  return stmt.all(searchPattern, searchPattern);
}

export function importDossiers(dossiers: Array<{ numero_dossier: string; valeur_tampon: string }>) {
  const db = getDatabase();
  
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO dossiers (numero_dossier, valeur_tampon)
    VALUES (?, ?)
  `);

  const transaction = db.transaction((records: typeof dossiers) => {
    for (const record of records) {
      insertStmt.run(record.numero_dossier, record.valeur_tampon);
    }
  });

  return transaction(dossiers);
}

export function getDatabaseStats() {
  const db = getDatabase();
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM dossiers');
  const result = countStmt.get() as { count: number };
  
  return {
    totalDossiers: result.count,
    dbPath: db.name,
  };
}
