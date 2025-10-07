import { useState, useRef, useEffect, useCallback } from "react";
import { Dossier, getAllDossiers } from "../lib/database";
import { stampPDFWithAnomalyDetection, StampPosition } from "../lib/pdfStamper";
import { FileText, Download, CheckCircle, AlertCircle, CreditCard as Edit2, Loader } from "lucide-react";
import { useToasts } from "../hooks/useToasts";
import { Rectangle } from "tesseract.js";
import ProcessingStats from "./ui/ProcessingStats";

interface Props {
	stampPosition: StampPosition;
	ocrRegion?: Rectangle;
	ocrPageNumber: number;
}

interface PDFFile {
	file: File;
	numeroDossier: string;
	status: "pending" | "ocr" | "analyzed" | "processing" | "completed" | "error";
	error?: string;
	stampedData?: Uint8Array;
	ocrConfidence?: number;
	detectedNumbers?: string[];
	ocrProgress?: number;
}

export default function BatchStamper({ stampPosition, ocrRegion, ocrPageNumber }: Props) {
	const { push } = useToasts();
	const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
	const [processing, setProcessing] = useState(false);
	const [autoStamping, setAutoStamping] = useState(true); // File d'attente automatique activée par défaut
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [editValue, setEditValue] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Fonction utilitaire pour mettre à jour un fichier spécifique
	const updatePdfFile = useCallback((index: number, updates: Partial<PDFFile>) => {
		setPdfFiles((prev) => {
			const updated = [...prev];
			if (updated[index]) {
				updated[index] = { ...updated[index], ...updates };
			}
			return updated;
		});
	}, []);

	async function handleFilesSelected(files: FileList) {
		const newFiles: PDFFile[] = Array.from(files)
			.filter((f) => f.type === "application/pdf")
			.map((file) => ({
				file,
				numeroDossier: "",
				status: "pending" as const,
				ocrProgress: 0,
			}));

		setPdfFiles((prev) => [...prev, ...newFiles]);

		for (let i = pdfFiles.length; i < pdfFiles.length + newFiles.length; i++) {
			const fileIndex = i;
			const file = newFiles[i - pdfFiles.length].file;

			updatePdfFile(fileIndex, { status: "ocr" });

			try {
				const { performOCRWithProgress } = await import("../lib/ocrHelper");
				const result = await performOCRWithProgress(file, ocrPageNumber, ocrRegion, (progress: number) => {
					updatePdfFile(fileIndex, { ocrProgress: progress });
				});

				const detectedNumber = result.detectedNumbers[0] || "NON DÉTECTÉ";

				updatePdfFile(fileIndex, {
					numeroDossier: detectedNumber,
					status: "analyzed",
					ocrConfidence: result.confidence,
					detectedNumbers: result.detectedNumbers,
					ocrProgress: 100,
				});
			} catch (error) {
				updatePdfFile(fileIndex, {
					numeroDossier: "ERREUR OCR",
					status: "error",
					error: error instanceof Error ? error.message : "Erreur OCR",
				});
			}
		}
	}

	function startEditingNumber(index: number, currentValue: string) {
		setEditingIndex(index);
		setEditValue(currentValue);
	}

	function saveEditedNumber(index: number) {
		updatePdfFile(index, {
			numeroDossier: editValue,
			status: "analyzed",
			error: undefined,
		});
		setEditingIndex(null);
		setEditValue("");
	}

	// Fonction pour traiter automatiquement un seul fichier
	const processFileAutomatically = useCallback(
		async (fileIndex: number) => {
			if (!autoStamping) return;

			const pdfFile = pdfFiles[fileIndex];
			if (!pdfFile || pdfFile.status !== "analyzed") return;

			try {
				const dossiers = await getAllDossiers();
				const dossier = dossiers.find((d) => d.numero_dossier === pdfFile.numeroDossier);

				// Marquer comme en cours de tamponnage
				updatePdfFile(fileIndex, { status: "processing" });
				if (!dossier) {
					updatePdfFile(fileIndex, { status: "error", error: "Numéro de dossier non trouvé dans la base de données" });
					return;
				}

				const stampedBytes = await stampPDFWithAnomalyDetection(pdfFile.file, {
					position: stampPosition,
					text: dossier.valeur_tampon,
					fontSize: 14,
					color: { r: 0, g: 0, b: 0 },
				});

				updatePdfFile(fileIndex, { status: "completed", stampedData: stampedBytes });
			} catch (error) {
				updatePdfFile(fileIndex, { status: "error", error: error instanceof Error ? error.message : "Erreur de tamponnage" });
			}
		},
		[autoStamping, pdfFiles, stampPosition, updatePdfFile]
	);

	// Surveiller les fichiers analyzed et les traiter automatiquement
	useEffect(() => {
		if (!autoStamping) return;

		const analyzedFiles = pdfFiles.map((file, index) => ({ file, index })).filter(({ file }) => file.status === "analyzed");

		// Traiter automatiquement les fichiers analyzed un par un
		analyzedFiles.forEach(({ index }) => {
			processFileAutomatically(index);
		});
	}, [pdfFiles, autoStamping, processFileAutomatically]);

	async function processAllPDFs() {
		setProcessing(true);

		try {
			const dossiers = await getAllDossiers();
			const dossierMap = new Map<string, Dossier>();
			dossiers.forEach((d) => dossierMap.set(d.numero_dossier, d));

			for (let i = 0; i < pdfFiles.length; i++) {
				const pdfFile = pdfFiles[i];

				// Traiter seulement les fichiers analyzed ou ceux avec des erreurs OCR récupérables
				if (pdfFile.status !== "analyzed" && pdfFile.status !== "pending") {
					continue;
				}
				const dossier = dossierMap.get(pdfFile.numeroDossier);

				if (!dossier) {
					updatePdfFile(i, {
						status: "error",
						error: "Numéro de dossier non trouvé dans la base de données",
					});
					continue;
				}

				try {
					const stampedBytes = await stampPDFWithAnomalyDetection(pdfFile.file, {
						position: stampPosition,
						text: dossier.valeur_tampon,
						fontSize: 14,
						color: { r: 0, g: 0, b: 0 },
					});

					updatePdfFile(i, {
						status: "completed",
						stampedData: stampedBytes,
					});
				} catch (error) {
					updatePdfFile(i, {
						status: "error",
						error: error instanceof Error ? error.message : "Erreur inconnue",
					});
				}
			}
		} catch (error) {
			push({ type: "error", message: "Erreur de chargement de la base de données: " + (error instanceof Error ? error.message : "Erreur inconnue") });
		}

		setProcessing(false);
	}

	async function downloadAll() {
		const JSZip = (await import("jszip")).default;
		const zip = new JSZip();

		pdfFiles.forEach((pdfFile) => {
			if (pdfFile.status === "completed" && pdfFile.stampedData) {
				zip.file(`${pdfFile.numeroDossier}_tamponné.pdf`, new Uint8Array(pdfFile.stampedData));
			}
		});

		const content = await zip.generateAsync({ type: "blob" });
		const url = URL.createObjectURL(content);
		const a = document.createElement("a");
		a.href = url;
		a.download = "pdfs_tamponnés.zip";
		a.click();
	}

	async function downloadSingle(pdfFile: PDFFile) {
		if (!pdfFile.stampedData) return;

		const blob = new Blob([new Uint8Array(pdfFile.stampedData)], { type: "application/pdf" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${pdfFile.numeroDossier}_tamponné.pdf`;
		a.click();
	}

	const completedCount = pdfFiles.filter((f) => f.status === "completed").length;
	const errorCount = pdfFiles.filter((f) => f.status === "error").length;
	const ocrCount = pdfFiles.filter((f) => f.status === "ocr").length;
	const analyzedCount = pdfFiles.filter((f) => f.status === "analyzed").length;
	const processingCount = pdfFiles.filter((f) => f.status === "processing").length;
	const pendingCount = pdfFiles.filter((f) => f.status === "pending").length;
	const totalCount = pdfFiles.length;

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h2 className="text-xl font-semibold text-gray-900">Traitement par lot</h2>
					{pdfFiles.length > 0 && (
						<div className="flex items-center gap-2 mt-2">
							<label className="flex items-center gap-2 text-sm text-gray-600">
								<input
									type="checkbox"
									checked={autoStamping}
									onChange={(e) => setAutoStamping(e.target.checked)}
									className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
								/>
								Tamponnage automatique après analyse OCR
							</label>
						</div>
					)}
				</div>
				<div className="flex gap-3">
					<label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
						<FileText className="w-4 h-4" />
						<span className="text-sm font-medium">Charger des PDFs</span>
						<input ref={fileInputRef} type="file" multiple accept=".pdf" className="hidden" onChange={(e) => e.target.files && handleFilesSelected(e.target.files)} />
					</label>
					{pdfFiles.length > 0 && (
						<>
							{!autoStamping && (
								<button
									onClick={processAllPDFs}
									disabled={processing}
									className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									{processing ? "Traitement..." : "Tamponner tout"}
								</button>
							)}
							{completedCount > 0 && (
								<button onClick={downloadAll} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors">
									<Download className="w-4 h-4" />
									Télécharger tout (ZIP)
								</button>
							)}
						</>
					)}
				</div>
			</div>

			{/* Statistiques de progression - affichées seulement s'il y a des fichiers */}
			{totalCount > 0 && (
				<ProcessingStats
					total={totalCount}
					pending={pendingCount}
					ocr={ocrCount}
					analyzed={analyzedCount}
					processing={processingCount}
					completed={completedCount}
					errors={errorCount}
					isProcessing={processing}
				/>
			)}

			{pdfFiles.length === 0 ? (
				<div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
					<FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
					<p>Aucun PDF chargé. Cliquez sur "Charger des PDFs" pour commencer.</p>
					<p className="text-sm mt-2">Le numéro de dossier sera extrait automatiquement par OCR.</p>
				</div>
			) : (
				<>
					{(completedCount > 0 || errorCount > 0) && (
						<div className="mb-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
							<div className="flex gap-6">
								<div className="flex items-center gap-2">
									<CheckCircle className="w-5 h-5 text-green-600" />
									<span className="text-sm font-medium text-gray-700">
										{completedCount} terminé{completedCount > 1 ? "s" : ""}
									</span>
								</div>
								{errorCount > 0 && (
									<div className="flex items-center gap-2">
										<AlertCircle className="w-5 h-5 text-red-600" />
										<span className="text-sm font-medium text-gray-700">
											{errorCount} erreur{errorCount > 1 ? "s" : ""}
										</span>
									</div>
								)}
							</div>
						</div>
					)}

					<div className="space-y-2 max-h-96 overflow-y-auto">
						{pdfFiles.map((pdfFile, index) => (
							<div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
								<div className="flex items-center gap-3 flex-1">
									<FileText className="w-5 h-5 text-gray-400" />
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-gray-900 truncate">{pdfFile.file.name}</p>
										{editingIndex === index ? (
											<div className="flex items-center gap-2 mt-1">
												<input
													type="text"
													value={editValue}
													onChange={(e) => setEditValue(e.target.value)}
													className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
													placeholder="Numéro de dossier"
												/>
												<button onClick={() => saveEditedNumber(index)} className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
													OK
												</button>
												<button onClick={() => setEditingIndex(null)} className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
													Annuler
												</button>
											</div>
										) : (
											<div className="flex items-center gap-2">
												<p className="text-xs text-gray-500">
													Dossier: {pdfFile.numeroDossier || "En attente..."}
													{pdfFile.ocrConfidence && <span className="ml-2 text-gray-400">({Math.round(pdfFile.ocrConfidence)}% confiance)</span>}
												</p>
												{pdfFile.status !== "ocr" && pdfFile.numeroDossier && (
													<button onClick={() => startEditingNumber(index, pdfFile.numeroDossier)} className="text-gray-400 hover:text-blue-600" title="Modifier le numéro">
														<Edit2 className="w-3 h-3" />
													</button>
												)}
											</div>
										)}
										{pdfFile.detectedNumbers && pdfFile.detectedNumbers.length > 1 && (
											<p className="text-xs text-gray-400 mt-1">Autres détectés: {pdfFile.detectedNumbers.slice(1, 3).join(", ")}</p>
										)}
										{pdfFile.error && <p className="text-xs text-red-600 mt-1">{pdfFile.error}</p>}
									</div>
								</div>

								<div className="flex items-center gap-3">
									{pdfFile.status === "ocr" && (
										<div className="flex items-center gap-2">
											<Loader className="w-4 h-4 text-blue-600 animate-spin" />
											<span className="text-xs text-blue-600 font-medium">OCR {Math.round(pdfFile.ocrProgress || 0)}%</span>
										</div>
									)}
									{pdfFile.status === "pending" && <span className="text-xs text-gray-500">En attente</span>}
									{pdfFile.status === "analyzed" && <span className="text-xs text-green-600 font-medium">Analysé ✓</span>}
									{pdfFile.status === "processing" && (
										<div className="flex items-center gap-2">
											<Loader className="w-4 h-4 text-indigo-600 animate-spin" />
											<span className="text-xs text-indigo-600 font-medium">Tamponnage...</span>
										</div>
									)}
									{pdfFile.status === "completed" && (
										<>
											<CheckCircle className="w-5 h-5 text-green-600" />
											<button onClick={() => downloadSingle(pdfFile)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
												Télécharger
											</button>
										</>
									)}
									{pdfFile.status === "error" && <AlertCircle className="w-5 h-5 text-red-600" />}
								</div>
							</div>
						))}
					</div>
				</>
			)}
		</div>
	);
}
