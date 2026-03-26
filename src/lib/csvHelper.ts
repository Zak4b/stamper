import Papa from "papaparse";
import { z } from "zod";

export type CSVParseResult = {
	header?: string[];
	rows: string[][];
};

const CANDIDATE_DELIMITERS = [",", ";", "\t", "|"];

export function splitLine(line: string, delim: string): string[] {
	if (delim === "\t") return line.split(/\t/);
	return line.split(delim);
}

export function autoDetectDelimiter(text: string, maxLines = 10): string {
	const lines = text.split(/\r?\n/).filter(Boolean).slice(0, maxLines);
	if (lines.length === 0) return ",";

	let best = CANDIDATE_DELIMITERS[0];
	let bestScore = -1;

	for (const d of CANDIDATE_DELIMITERS) {
		const counts = lines.map((l) => splitLine(l, d).length);
		// score: variance low and average > 1
		const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
		const variance = counts.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / counts.length;
		const score = avg > 1 ? avg - variance * 0.1 : 0;
		if (score > bestScore) {
			bestScore = score;
			best = d;
		}
	}

	return best;
}

export function parseCSV(text: string, delimiter = ",", hasHeader = true, maxPreviewRows = 20): CSVParseResult {
	// PapaParse gère correctement les guillemets et les champs échappés (delimiter dans les champs, etc.)
	const previewLines = maxPreviewRows + (hasHeader ? 1 : 0);

	const parsed = Papa.parse<string[]>(text, {
		delimiter,
		skipEmptyLines: true,
		dynamicTyping: false,
		preview: previewLines,
	});

	const allRows = (parsed.data || [])
		.filter((r): r is string[] => Array.isArray(r))
		.map((r: string[]) => r.map((c: unknown) => (c ?? "").toString().trim()));

	if (allRows.length === 0) return { rows: [] };

	if (hasHeader) {
		const header = allRows[0];
		const rows = allRows.slice(1, 1 + maxPreviewRows);
		return { header, rows };
	}

	return { rows: allRows.slice(0, maxPreviewRows) };
}

export type CSVImportOptions = {
	delimiter: string;
	hasHeader: boolean;
	idCol: number;
	valCol: number;
	format?: "none" | "date";
};

export const csvImportOptionsSchema = z
	.object({
		delimiter: z.string().min(1),
		hasHeader: z.boolean(),
		idCol: z.number().int().nonnegative(),
		valCol: z.number().int().nonnegative(),
		format: z.enum(["none", "date"]).optional(),
	})
	.strict();

export type CSVImportRecord = {
	numero_dossier: string;
	valeur_tampon: string;
};

export type CSVImportResult = {
	records: CSVImportRecord[];
	totalRows: number;
	validRows: number;
	invalidRows: number;
};

export function formatValue(val: string, format?: "none" | "date"): string {
	if (!format || format === "none") return val;
	if (format === "date") {
		// Tentative de parsing manuel pour DD/MM/YYYY ou DD/MM/YY
		const dmyMatch = val.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
		if (dmyMatch) {
			const day = parseInt(dmyMatch[1], 10);
			const month = parseInt(dmyMatch[2], 10) - 1;
			let year = parseInt(dmyMatch[3], 10);

			if (year < 100) {
				year += 2000;
			}

			const d = new Date(year, month, day);
			if (!isNaN(d.getTime()) && d.getDate() === day && d.getMonth() === month) {
				const fDay = String(d.getDate()).padStart(2, "0");
				const fMonth = String(d.getMonth() + 1).padStart(2, "0");
				const fYear = d.getFullYear();
				return `${fDay}/${fMonth}/${fYear}`;
			}
		}

		// Fallback sur le parsing natif si le format ne correspond pas à DD/MM/YY
		const d = new Date(val);
		if (isNaN(d.getTime())) return val;
		const day = String(d.getDate()).padStart(2, "0");
		const month = String(d.getMonth() + 1).padStart(2, "0");
		const year = d.getFullYear();
		return `${day}/${month}/${year}`;
	}
	return val;
}

/**
 * Traite un fichier CSV complet et extrait les enregistrements selon les options spécifiées
 */
export function processCSVForImport(text: string, options: CSVImportOptions): CSVImportResult {
	const finalParsed = parseCSV(text, options.delimiter, options.hasHeader, 100000);

	const records: CSVImportRecord[] = [];
	let validRows = 0;
	let invalidRows = 0;

	for (const row of finalParsed.rows) {
		const numero = row[options.idCol]?.trim();
		let valeur = row[options.valCol]?.trim();

		if (numero && valeur) {
			valeur = formatValue(valeur, options.format);
			records.push({ numero_dossier: numero, valeur_tampon: valeur });
			validRows++;
		} else {
			invalidRows++;
		}
	}

	return {
		records,
		totalRows: finalParsed.rows.length,
		validRows,
		invalidRows,
	};
}
