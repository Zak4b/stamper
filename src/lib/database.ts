import { CSVImportRecord } from "./csvHelper";

export interface Dossier {
	id: number;
	numero_dossier: string;
	valeur_tampon: string;
	created_at?: string;
	updated_at?: string;
}

// Détection de l'environnement
const isElectron = typeof window !== 'undefined' && window.electron !== undefined;

// Wrapper pour gérer Electron et le navigateur
const dbAPI = {
	async getAll(): Promise<Dossier[]> {
		if (isElectron) {
			return window.electron!.db.getAll();
		}
		// Fallback localStorage pour le navigateur
		const data = localStorage.getItem('pdfstamper_dossiers');
		return data ? JSON.parse(data) : [];
	},

	async getByNumero(numero: string): Promise<Dossier | undefined> {
		if (isElectron) {
			return window.electron!.db.getByNumero(numero);
		}
		const all = await this.getAll();
		return all.find(d => d.numero_dossier === numero);
	},

	async insert(numero: string, valeur: string): Promise<any> {
		if (isElectron) {
			return window.electron!.db.insert(numero, valeur);
		}
		const all = await this.getAll();
		const newDossier: Dossier = {
			id: Date.now(),
			numero_dossier: numero,
			valeur_tampon: valeur,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};
		all.push(newDossier);
		localStorage.setItem('pdfstamper_dossiers', JSON.stringify(all));
		return { changes: 1 };
	},

	async update(numero: string, valeur: string): Promise<any> {
		if (isElectron) {
			return window.electron!.db.update(numero, valeur);
		}
		const all = await this.getAll();
		const index = all.findIndex(d => d.numero_dossier === numero);
		if (index >= 0) {
			all[index].valeur_tampon = valeur;
			all[index].updated_at = new Date().toISOString();
			localStorage.setItem('pdfstamper_dossiers', JSON.stringify(all));
			return { changes: 1 };
		}
		return { changes: 0 };
	},

	async delete(numero: string): Promise<any> {
		if (isElectron) {
			return window.electron!.db.delete(numero);
		}
		const all = await this.getAll();
		const filtered = all.filter(d => d.numero_dossier !== numero);
		localStorage.setItem('pdfstamper_dossiers', JSON.stringify(filtered));
		return { changes: all.length - filtered.length };
	},

	async deleteAll(): Promise<any> {
		if (isElectron) {
			return window.electron!.db.deleteAll();
		}
		localStorage.removeItem('pdfstamper_dossiers');
		return { changes: 1 };
	},

	async search(query: string): Promise<Dossier[]> {
		if (isElectron) {
			return window.electron!.db.search(query);
		}
		const all = await this.getAll();
		const lowerQuery = query.toLowerCase();
		return all.filter(d => 
			d.numero_dossier.toLowerCase().includes(lowerQuery) ||
			d.valeur_tampon.toLowerCase().includes(lowerQuery)
		);
	},

	async import(dossiers: Array<{ numero_dossier: string; valeur_tampon: string }>): Promise<any> {
		if (isElectron) {
			return window.electron!.db.import(dossiers);
		}
		const all = await this.getAll();
		for (const dossier of dossiers) {
			const existing = all.find(d => d.numero_dossier === dossier.numero_dossier);
			if (existing) {
				existing.valeur_tampon = dossier.valeur_tampon;
				existing.updated_at = new Date().toISOString();
			} else {
				all.push({
					id: Date.now() + Math.random(),
					...dossier,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				});
			}
		}
		localStorage.setItem('pdfstamper_dossiers', JSON.stringify(all));
		return { changes: dossiers.length };
	},

	async getStats() {
		if (isElectron) {
			return window.electron!.db.getStats();
		}
		const all = await this.getAll();
		return {
			totalDossiers: all.length,
			dbPath: 'localStorage',
		};
	},
};

// Fonction d'initialisation (maintenant juste un no-op)
export async function initDatabase(): Promise<void> {
	console.log('Base de données prête (better-sqlite3 via IPC)');
}

// Fonctions publiques qui utilisent dbAPI
export async function getAllDossiers(): Promise<Dossier[]> {
	return dbAPI.getAll();
}

export async function getDossierByNumero(numero: string): Promise<Dossier | undefined> {
	return dbAPI.getByNumero(numero);
}

export async function addOrUpdateDossier(numero: string, valeur: string): Promise<void> {
	const existing = await dbAPI.getByNumero(numero);
	if (existing) {
		await dbAPI.update(numero, valeur);
	} else {
		await dbAPI.insert(numero, valeur);
	}
}

// Alias pour compatibilité
export async function addDossier(numero: string, valeur: string): Promise<void> {
	return addOrUpdateDossier(numero, valeur);
}

// Alias pour compatibilité
export async function importDossiers(records: CSVImportRecord[]): Promise<number> {
	await importFromCSV(records);
	return records.length;
}

export async function deleteDossier(numero: string): Promise<void> {
	await dbAPI.delete(numero);
}

export async function deleteAllDossiers(): Promise<void> {
	await dbAPI.deleteAll();
}

export async function searchDossiers(query: string): Promise<Dossier[]> {
	return dbAPI.search(query);
}

export async function importFromCSV(records: CSVImportRecord[]): Promise<void> {
	await dbAPI.import(records);
}

export async function getDatabaseStats() {
	return dbAPI.getStats();
}

// Fonction de sauvegarde (plus nécessaire avec better-sqlite3, auto-sauvegardé)
export function saveDatabase() {
	// No-op pour better-sqlite3, la DB est sauvegardée automatiquement
	console.log('Sauvegarde automatique (better-sqlite3)');
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
	await deleteAllDossiers();
}
