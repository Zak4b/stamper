import initSqlJs, { Database } from "sql.js";

export interface Dossier {
	id: number;
	numero_dossier: string;
	valeur_tampon: string;
	created_at: string;
	updated_at: string;
}

let SQL: any = null;
let db: Database | null = null;

export async function initDatabase(): Promise<Database> {
	if (db) return db;

	if (!SQL) {
		SQL = await initSqlJs({
			locateFile: (file: string) => `/sql.js/${file}`,
		});
	}

	const savedData = localStorage.getItem("pdfstamper_db");

	if (savedData) {
		const binaryData = Uint8Array.from(atob(savedData), (c) => c.charCodeAt(0));
		db = new SQL.Database(binaryData);
	} else {
		db = new SQL.Database();

		db.run(`
      CREATE TABLE IF NOT EXISTS dossiers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_dossier TEXT UNIQUE NOT NULL,
        valeur_tampon TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

		saveDatabase();
	}

	return db;
}

export function saveDatabase() {
	if (!db) return;

	const data = db.export();
	const base64 = btoa(String.fromCharCode(...data));
	localStorage.setItem("pdfstamper_db", base64);
}

export async function getAllDossiers(): Promise<Dossier[]> {
	const database = await initDatabase();
	const results = database.exec("SELECT * FROM dossiers ORDER BY created_at DESC");

	if (results.length === 0) return [];

	const dossiers: Dossier[] = [];
	const columns = results[0].columns;
	const values = results[0].values;

	for (const row of values) {
		const dossier: any = {};
		columns.forEach((col, i) => {
			dossier[col] = row[i];
		});
		dossiers.push(dossier as Dossier);
	}

	return dossiers;
}

export async function addDossier(numeroDossier: string, valeurTampon: string): Promise<void> {
	const database = await initDatabase();

	database.run("INSERT INTO dossiers (numero_dossier, valeur_tampon) VALUES (?, ?)", [numeroDossier, valeurTampon]);

	saveDatabase();
}

export async function deleteDossier(id: number): Promise<void> {
	const database = await initDatabase();

	database.run("DELETE FROM dossiers WHERE id = ?", [id]);

	saveDatabase();
}

export async function getDossierByNumero(numeroDossier: string): Promise<Dossier | null> {
	const database = await initDatabase();
	const results = database.exec("SELECT * FROM dossiers WHERE numero_dossier = ?", [numeroDossier]);

	if (results.length === 0 || results[0].values.length === 0) return null;

	const columns = results[0].columns;
	const row = results[0].values[0];
	const dossier: any = {};

	columns.forEach((col, i) => {
		dossier[col] = row[i];
	});

	return dossier as Dossier;
}

export async function importDossiers(dossiers: Array<{ numero_dossier: string; valeur_tampon: string }>): Promise<number> {
	const database = await initDatabase();
	let count = 0;

	for (const dossier of dossiers) {
		try {
			database.run("INSERT OR IGNORE INTO dossiers (numero_dossier, valeur_tampon) VALUES (?, ?)", [dossier.numero_dossier, dossier.valeur_tampon]);
			count++;
		} catch (error) {
			console.error("Error importing dossier:", error);
		}
	}

	saveDatabase();
	return count;
}

export async function exportDossiersToCSV(): Promise<string> {
	const dossiers = await getAllDossiers();
	const csv = ["numero_dossier,valeur_tampon"];

	dossiers.forEach((d) => {
		csv.push(`${d.numero_dossier},${d.valeur_tampon}`);
	});

	return csv.join("\n");
}

export async function clearAllDossiers(): Promise<void> {
	const database = await initDatabase();
	database.run("DELETE FROM dossiers");
	saveDatabase();
}
