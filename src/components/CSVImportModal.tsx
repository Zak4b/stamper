import React, { useMemo } from "react";

type Props = {
	isOpen: boolean;
	onClose: () => void;
	parsed?: { header?: string[]; rows: string[][] };
	detectedDelimiter?: string;
	rawText?: string | undefined;
	initialHasHeader?: boolean;
	onConfirm: (opts: { delimiter: string; hasHeader: boolean; numeroCol: number; valeurCol: number }) => void;
};

const DELIMS: { label: string; value: string }[] = [
	{ label: "Auto (détecté)", value: "auto" },
	{ label: "Virgule (,)", value: "," },
	{ label: "Point-virgule (;)", value: ";" },
	{ label: "Tabulation (\t)", value: "\t" },
	{ label: "Pipe (|)", value: "|" },
];

export default function CSVImportModal({ isOpen, onClose, parsed, detectedDelimiter, rawText, initialHasHeader = true, onConfirm }: Props) {
	const [delimiter, setDelimiter] = React.useState<string>(detectedDelimiter ?? ",");
	const [hasHeader, setHasHeader] = React.useState<boolean>(initialHasHeader);
	const [numeroCol, setNumeroCol] = React.useState<number>(0);
	const [valeurCol, setValeurCol] = React.useState<number>(1);

	// local parsed state that updates when delimiter/hasHeader/rawText changes
	const [localParsed, setLocalParsed] = React.useState<{ header?: string[]; rows: string[][] } | undefined>(parsed);

	React.useEffect(() => {
		setDelimiter(detectedDelimiter ?? ",");
		setHasHeader(initialHasHeader);
		setNumeroCol(0);
		setValeurCol(1);
		setLocalParsed(parsed);
	}, [detectedDelimiter, initialHasHeader, isOpen, parsed]);

	React.useEffect(() => {
		if (!rawText) {
			setLocalParsed(parsed);
			return;
		}
		// lazy import parseCSV to avoid circular import issues
		import("../lib/csvHelper")
			.then((m) => {
				const p = m.parseCSV(rawText, delimiter, hasHeader, 200);
				setLocalParsed(p);
			})
			.catch(() => {
				setLocalParsed(parsed);
			});
	}, [rawText, delimiter, hasHeader, parsed]);

	const maxCols = useMemo(() => {
		const source = localParsed ?? parsed;
		if (!source) return 0;
		let max = source.header ? source.header.length : 0;
		for (const r of source.rows) max = Math.max(max, r.length);
		return max;
	}, [localParsed, parsed]);

	const columnOptions = useMemo(() => {
		const source = localParsed ?? parsed;
		const opts: { label: string; idx: number }[] = [];
		if (!source) return opts;
		if (hasHeader && source.header) {
			for (let i = 0; i < source.header.length; i++) {
				opts.push({ label: source.header[i], idx: i });
			}
		}
		for (let i = 0; i < maxCols; i++) {
			if (!opts.find((o) => o.idx === i)) opts.push({ label: `Col ${i}`, idx: i });
		}
		return opts;
	}, [localParsed, parsed, hasHeader, maxCols]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg shadow-lg w-[min(90%,900px)] max-h-[80vh] overflow-auto">
				<div className="p-4 border-b">
					<h3 className="text-lg font-semibold">Importer CSV — options</h3>
				</div>
				<div className="p-4 space-y-4">
					<div className="flex gap-4 items-center">
						<label className="text-sm">Séparateur</label>
						<select
							value={delimiter === detectedDelimiter ? "auto" : delimiter}
							onChange={(e) => setDelimiter(e.target.value === "auto" ? detectedDelimiter ?? "," : e.target.value)}
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

					<div className="space-y-2">
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
						</div>

						<div>
							<div className="text-sm font-medium mb-2">Aperçu (premières lignes)</div>
							<div className="overflow-x-auto border rounded">
								<table className="w-full text-sm">
									<thead className="bg-gray-50">
										<tr>
											{Array.from({ length: maxCols }).map((_, i) => (
												<th key={i} className="px-3 py-2 text-left">
													{hasHeader && (localParsed ?? parsed)?.header?.[i] ? (localParsed ?? parsed)?.header?.[i] : `Col ${i}`}
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										{(localParsed ?? parsed)?.rows?.slice(0, 10).map((r, ri) => (
											<tr key={ri} className="odd:bg-white even:bg-gray-50">
												{Array.from({ length: maxCols }).map((_, ci) => (
													<td key={ci} className="px-3 py-2 align-top">
														{r[ci] ?? ""}
													</td>
												))}
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
				<div className="p-4 border-t flex justify-end gap-2">
					<button onClick={onClose} className="px-4 py-2 rounded border">
						Annuler
					</button>
					<button onClick={() => onConfirm({ delimiter, hasHeader, numeroCol, valeurCol })} className="px-4 py-2 rounded bg-blue-600 text-white">
						Importer
					</button>
				</div>
			</div>
		</div>
	);
}
