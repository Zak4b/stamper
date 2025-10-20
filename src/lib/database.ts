import initSqlJs from "sql.js";
import { CSVImportRecord } from "./csvHelper";

export interface Dossier {
	id: number;
	numero_dossier: string;
	valeur_tampon: string;
}

type SQLDatabase = initSqlJs.Database;

type SQLLibShape = {
	Database: new (data?: ArrayLike<number> | Buffer | null) => SQLDatabase;
};

let SQL: SQLLibShape | null = null;
let db: SQLDatabase | null = null;

export async function initDatabase(): Promise<SQLDatabase> {
	if (db) return db;

	if (!SQL) {
		SQL = (await initSqlJs({
			locateFile: (file: string) => `/sql.js/${file}`,
		})) as unknown as SQLLibShape;
	}

	const SQLLib = SQL as SQLLibShape;

	const savedData = localStorage.getItem("pdfstamper_db");

	if (savedData) {
		const binaryData = Uint8Array.from(atob(savedData), (c) => c.charCodeAt(0));
		db = new SQLLib.Database(binaryData);
	} else {
		db = new SQLLib.Database();

		db.run(`
	  CREATE TABLE IF NOT EXISTS dossiers (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		numero_dossier TEXT UNIQUE NOT NULL,
		valeur_tampon TEXT NOT NULL
	  )
	`);

		saveDatabase();
	}

	return db as SQLDatabase;
}

export function saveDatabase() {
	if (!db) return;

	const data = db.export();
	const base64 = btoa(String.fromCharCode(...data));
	localStorage.setItem("pdfstamper_db", base64);
}

export async function getAllDossiers(): Promise<Dossier[]> {
	const database = await initDatabase();
	const results = database.exec("SELECT * FROM dossiers ORDER BY id DESC");

	if (results.length === 0) return [];

	const dossiers: Dossier[] = [];
	const columns = results[0].columns;
	const values = results[0].values;

	for (const row of values) {
		const dossier = {} as Record<string, unknown>;
		columns.forEach((col: string, i: number) => {
			dossier[col] = row[i];
		});
		dossiers.push(dossier as unknown as Dossier);
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
	const dossier = {} as Record<string, unknown>;

	columns.forEach((col: string, i: number) => {
		dossier[col] = row[i];
	});

	return dossier as unknown as Dossier;
}

export async function importDossiers(dossiers: CSVImportRecord[]): Promise<number> {
	const database = await initDatabase();
	let count = 0;

	for (const dossier of dossiers) {
		try {
			database.run("INSERT OR IGNORE INTO dossiers (numero_dossier, valeur_tampon) VALUES (?, ?)", [dossier.id, dossier.value]);
			count++;
		} catch (error) {
			console.error("Error importing dossier:", error);
		}
	}

	saveDatabase();
	return count;
}

export async function exportToCSV(): Promise<string> {
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
