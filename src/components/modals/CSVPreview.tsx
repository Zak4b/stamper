import React, { useMemo } from "react";
import { type CSVImportOptions, formatValue } from "../../lib/csvHelper";

interface CSVPreviewProps {
	rawText: string;
	detectedDelimiter: string;
	initialHasHeader?: boolean;
	onOptionsChange: (options: CSVImportOptions) => void;
}

const DELIMS: { label: string; value: string }[] = [
	{ label: "Auto", value: "auto" },
	{ label: "Virgule (,)", value: "," },
	{ label: "Point-virgule (;)", value: ";" },
	{ label: "Tabulation (\t)", value: "\t" },
	{ label: "Pipe (|)", value: "|" },
];

export const CSVPreview: React.FC<CSVPreviewProps> = ({ rawText, detectedDelimiter, initialHasHeader = true, onOptionsChange }) => {
	const [delimiter, setDelimiter] = React.useState<string>(detectedDelimiter);
	const [hasHeader, setHasHeader] = React.useState<boolean>(initialHasHeader);
	const [numeroCol, setNumeroCol] = React.useState<number>(0);
	const [valeurCol, setValeurCol] = React.useState<number>(1);
	const [format, setFormat] = React.useState<"none" | "date">("none");
	const [parsed, setParsed] = React.useState<{ header?: string[]; rows: string[][] } | null>(null);

	// Parse CSV when options change
	React.useEffect(() => {
		import("../../lib/csvHelper")
			.then((m) => {
				const p = m.parseCSV(rawText, delimiter, hasHeader, 200);
				setParsed(p);
			})
			.catch(() => {
				setParsed(null);
			});
	}, [rawText, delimiter, hasHeader]);

	// Notify parent of option changes
	React.useEffect(() => {
		onOptionsChange({ delimiter, hasHeader, idCol: numeroCol, valCol: valeurCol, format });
	}, [delimiter, hasHeader, numeroCol, valeurCol, format, onOptionsChange]);

	const maxCols = useMemo(() => {
		if (!parsed) return 0;
		let max = parsed.header ? parsed.header.length : 0;
		for (const r of parsed.rows) max = Math.max(max, r.length);
		return max;
	}, [parsed]);

	const columnOptions = useMemo(() => {
		const opts: { label: string; idx: number }[] = [];
		if (!parsed) return opts;
		if (hasHeader && parsed.header) {
			for (let i = 0; i < parsed.header.length; i++) {
				opts.push({ label: parsed.header[i], idx: i });
			}
		}
		for (let i = 0; i < maxCols; i++) {
			if (!opts.find((o) => o.idx === i)) opts.push({ label: `Col ${i}`, idx: i });
		}
		return opts;
	}, [parsed, hasHeader, maxCols]);

	if (!parsed) return <div>Chargement...</div>;

	return (
		<div className="space-y-4">
			{/* Configuration du CSV */}
			<div className="border rounded-lg p-4 bg-gray-50">
				<h4 className="font-medium mb-3">Configuration du fichier CSV</h4>

				<div className="flex gap-4 items-center mb-3">
					<label className="text-sm">Séparateur</label>
					<select
						value={delimiter === detectedDelimiter ? "auto" : delimiter}
						onChange={(e) => setDelimiter(e.target.value === "auto" ? detectedDelimiter : e.target.value)}
						className="px-3 py-2 border rounded"
					>
						{DELIMS.map((d) => (
							<option key={d.value} value={d.value}>
								{d.label}
								{d.value === "auto" && detectedDelimiter ? ` — ${detectedDelimiter}` : ""}
							</option>
						))}
					</select>

					<label className="flex items-center gap-2">
						<input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} />
						<span className="text-sm">Le fichier contient une ligne d'en-tête</span>
					</label>
				</div>

				<div className="flex gap-4 items-center">
					<label className="text-sm">Colonne numéro de dossier</label>
					<select value={numeroCol} onChange={(e) => setNumeroCol(Number(e.target.value))} className="px-3 py-2 border rounded">
						{columnOptions.map((o) => (
							<option key={o.idx} value={o.idx}>
								{o.label}
							</option>
						))}
					</select>

					<label className="text-sm">Colonne valeur du tampon</label>
					<select value={valeurCol} onChange={(e) => setValeurCol(Number(e.target.value))} className="px-3 py-2 border rounded">
						{columnOptions.map((o) => (
							<option key={o.idx} value={o.idx}>
								{o.label}
							</option>
						))}
					</select>

					<label className="text-sm">Format</label>
					<select value={format} onChange={(e) => setFormat(e.target.value as "none" | "date")} className="px-3 py-2 border rounded">
						<option value="none">Aucun</option>
						<option value="date">Date (JJ/MM/AAAA)</option>
					</select>
				</div>
			</div>

			{/* Aperçu du tableau */}
			<div>
				<h4 className="font-medium mb-2">Aperçu des données</h4>
				<div className="border rounded-lg overflow-hidden">
					<div className="overflow-x-auto max-h-64 overflow-y-auto">
						<table className="w-full text-sm">
							<thead className="bg-gray-50 sticky top-0">
								<tr>
									{Array.from({ length: maxCols }).map((_, i) => (
										<th
											key={i}
											className={`px-3 py-2 text-left border-b font-medium ${i === numeroCol ? "bg-blue-100 text-blue-800" : i === valeurCol ? "bg-green-100 text-green-800" : ""}`}
										>
											{hasHeader && parsed.header?.[i] ? parsed.header[i] : `Colonne ${i + 1}`}
											{i === numeroCol && <span className="text-xs block text-blue-600">Identifiant</span>}
											{i === valeurCol && <span className="text-xs block text-green-600">Valeur</span>}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{parsed.rows.slice(0, 20).map((row, ri) => (
									<tr key={ri} className="odd:bg-white even:bg-gray-50">
										{Array.from({ length: maxCols }).map((_, ci) => (
											<td key={ci} className={`px-3 py-2 align-top border-b ${ci === numeroCol ? "bg-blue-50" : ci === valeurCol ? "bg-green-50" : ""}`}>
												<span className={`${ci === numeroCol ? "font-medium text-blue-900" : ci === valeurCol ? "font-medium text-green-900" : "text-gray-700"}`}>
													{row[ci] ? (ci === valeurCol ? formatValue(row[ci], format) : row[ci]) : "—"}
												</span>
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* Statistiques */}
			<div className="bg-blue-50 p-3 rounded-lg">
				<div className="text-xs text-blue-700">
					• {parsed.rows.filter((row) => row[numeroCol]?.trim() && row[valeurCol]?.trim()).length} enregistrements valides
					<br />• {parsed.rows.filter((row) => !row[numeroCol]?.trim() || !row[valeurCol]?.trim()).length} lignes ignorées (valeurs manquantes)
				</div>
			</div>
		</div>
	);
};
