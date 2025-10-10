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
	const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
	if (lines.length === 0) return { rows: [] };

	let header: string[] | undefined;
	let start = 0;

	if (hasHeader) {
		header = splitLine(lines[0], delimiter).map((h) => h.trim());
		start = 1;
	}

	const rows: string[][] = [];
	for (let i = start; i < Math.min(lines.length, start + maxPreviewRows); i++) {
		const cols = splitLine(lines[i], delimiter).map((c) => c.trim());
		rows.push(cols);
	}

	return { header, rows };
}

export type CSVImportOptions = {
	delimiter: string;
	hasHeader: boolean;
	idCol: number;
	valCol: number;
};

export type CSVImportRecord = {
	id: string;
	value: string;
};

export type CSVImportResult = {
	records: CSVImportRecord[];
	totalRows: number;
	validRows: number;
	invalidRows: number;
};

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
		const valeur = row[options.valCol]?.trim();

		if (numero && valeur) {
			records.push({ id: numero, value: valeur });
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
