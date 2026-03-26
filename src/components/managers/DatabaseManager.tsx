import React, { useState, useCallback, useEffect } from "react";
import { Dossier, getAllDossiers, addDossier as addDossierDB, deleteDossier as deleteDossierDB, importDossiers, exportToCSV } from "../../lib/database";
import { autoDetectDelimiter, processCSVForImport, csvImportOptionsSchema, type CSVImportOptions } from "../../lib/csvHelper";
import { Plus, Upload, Download, Trash2 } from "lucide-react";
import { clearAllDossiers } from "../../lib/database";
import { useToasts } from "../../hooks/useToasts";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { CSVPreview } from "../modals/CSVPreview";
import { downloadBlob } from "../../lib/downloadUtils";

const DatabaseManager: React.FC = () => {
	const { push } = useToasts();
	const { confirm, modalComponent } = useConfirmModal();
	const [dossiers, setDossiers] = useState<Dossier[]>([]);
	const [newDossier, setNewDossier] = useState({ numero: "", valeur: "" });
	const [loading, setLoading] = useState(false);

	const loadDossiers = useCallback(async () => {
		setLoading(true);
		try {
			const data = await getAllDossiers();
			setDossiers(data);
		} catch (error) {
			push({ type: "error", message: "Erreur lors du chargement de la base: " + (error instanceof Error ? error.message : "Erreur inconnue"), delai: 6000 });
		} finally {
			setLoading(false);
		}
	}, [push]);

	useEffect(() => {
		loadDossiers();
	}, [loadDossiers]);

	async function addDossier() {
		if (!newDossier.numero || !newDossier.valeur) {
			push({ type: "warn", message: "Veuillez remplir le numéro et la valeur" });
			return;
		}

		try {
			await addDossierDB(newDossier.numero, newDossier.valeur);
			setNewDossier({ numero: "", valeur: "" });
			push({ type: "success", message: "Dossier ajouté" });
			loadDossiers();
		} catch (error) {
			push({ type: "error", message: "Erreur lors de l'ajout: " + (error instanceof Error ? error.message : "Erreur inconnue"), delai: 6000 });
		}
	}

	async function deleteDossier(numero: string) {
		try {
			await deleteDossierDB(numero);
			loadDossiers();
		} catch (error) {
			push({ type: "error", message: "Erreur: " + (error instanceof Error ? error.message : "Erreur inconnue") });
		}
	}

	const handleClearDatabase = async () => {
		const confirmed = await confirm({
			title: "Vider la base de données",
			description: "Cette action supprimera tous les dossiers enregistrés. Confirmez-vous ?",
			confirmLabel: "Vider",
			cancelLabel: "Annuler",
			confirmVariant: "danger",
		});

		if (confirmed) {
			try {
				await clearAllDossiers();
				push({ type: "success", message: "Base vidée avec succès" });
				loadDossiers();
			} catch (err) {
				push({ type: "error", message: "Erreur lors de la suppression: " + (err instanceof Error ? err.message : "Erreur inconnue"), delai: 6000 });
			}
		}
	};

	function downloadCSV() {
		exportToCSV().then((csvString) => {
			const blob = new Blob([csvString], { type: "text/csv" });
			downloadBlob(blob, "dossiers.csv");
		});
	}

	async function importCSV(file: File) {
		try {
			const text = await file.text();
			const detected = autoDetectDelimiter(text);

			let csvOptions: CSVImportOptions = {
				delimiter: detected,
				hasHeader: true,
				idCol: 0,
				valCol: 1,
			};
			const confirmed = await confirm({
				title: "Confirmer l'importation CSV",
				content: (
					<CSVPreview
						rawText={text}
						detectedDelimiter={detected}
						initialHasHeader={true}
						onOptionsChange={(options) => {
							csvOptions = options;
						}}
					/>
				),
				confirmLabel: "Importer",
				cancelLabel: "Annuler",
				confirmVariant: "primary",
				size: "xl",
				scrollable: true,
			});

			if (confirmed) {
				await handleImportConfirm(text, csvOptions);
			}
		} catch (error) {
			push({ type: "error", message: "Erreur lors de la lecture du fichier: " + (error instanceof Error ? error.message : "Erreur inconnue"), delai: 6000 });
		}
	}

	async function handleImportConfirm(text: string, opts: CSVImportOptions) {
		if (!text) return;

		const validated = csvImportOptionsSchema.safeParse(opts);
		if (!validated.success) {
			push({ type: "error", message: "Options CSV invalides: " + validated.error.message, delai: 6000 });
			return;
		}

		const result = processCSVForImport(text, validated.data);

		if (result.records.length === 0) {
			push({ type: "warn", message: "Aucun enregistrement valide trouvé", delai: 5000 });
			return;
		}

		try {
			await importDossiers(result.records);
			push({
				type: "success",
				message: `${result.validRows} dossiers importés avec succès`,
			});
			loadDossiers();
		} catch (error) {
			push({ type: "error", message: "Erreur d'importation: " + (error instanceof Error ? error.message : "Erreur inconnue"), delai: 6000 });
		}
	}

	return (
		<>
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h3 className="text-xl font-semibold text-gray-900">Gestion des dossiers</h3>
						<p className="text-sm text-gray-500 mt-1">
							{dossiers.length} dossier{dossiers.length !== 1 ? "s" : ""} enregistré{dossiers.length !== 1 ? "s" : ""}
						</p>
					</div>
					<div className="flex gap-2">
						<button onClick={handleClearDatabase} className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
							<span className="text-sm font-medium">Vider la base</span>
						</button>
						<label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
							<Upload className="w-4 h-4" />
							<span className="text-sm font-medium">Importer CSV</span>
							<input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && importCSV(e.target.files[0])} />
						</label>
						<button onClick={downloadCSV} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
							<Download className="w-4 h-4" />
							<span className="text-sm font-medium">Exporter CSV</span>
						</button>
					</div>
				</div>

				<div className="mb-6 p-4 bg-gray-50 rounded-lg">
					<h3 className="text-sm font-medium text-gray-700 mb-3">Ajouter un dossier</h3>
					<div className="flex gap-3">
						<input
							type="text"
							placeholder="Numéro de dossier"
							value={newDossier.numero}
							onChange={(e) => setNewDossier({ ...newDossier, numero: e.target.value })}
							className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
						<input
							type="text"
							placeholder="Valeur du tampon"
							value={newDossier.valeur}
							onChange={(e) => setNewDossier({ ...newDossier, valeur: e.target.value })}
							className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
						<button onClick={addDossier} className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
							<Plus className="w-4 h-4" />
							Ajouter
						</button>
					</div>
				</div>

				{loading ? (
					<div className="text-center py-8 text-gray-500">Chargement...</div>
				) : dossiers.length === 0 ? (
					<div className="text-center py-8 text-gray-500">Aucun dossier. Ajoutez-en un ou importez un fichier CSV.</div>
				) : (
					<div className="overflow-x-auto">
						<div className="overflow-x-auto max-h-[calc(1.75rem*20+2rem)]">
							{/* ~20 rows limit */}
							<table className="w-full">
								<thead>
									<tr className="border-b border-gray-200">
										<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Numéro de dossier</th>
										<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Valeur du tampon</th>
										<th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
									</tr>
								</thead>
								<tbody>
									{dossiers.map((dossier) => (
										<tr key={dossier.id} className="border-b border-gray-100 hover:bg-gray-50">
											<td className="py-3 px-4 text-sm text-gray-900">{dossier.numero_dossier}</td>
											<td className="py-3 px-4 text-sm text-gray-900">{dossier.valeur_tampon}</td>
											<td className="py-3 px-4 text-right">
											<button onClick={() => deleteDossier(dossier.numero_dossier)} className="text-red-600 hover:text-red-700 transition-colors">
													<Trash2 className="w-4 h-4" />
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</div>
			{modalComponent}
		</>
	);
};

export default DatabaseManager;
