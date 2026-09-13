import React, { useRef } from "react";
import { FileText, Trash2, Download } from "lucide-react";
import { usePDFStore } from "../../stores/usePDFStore";
import { downloadAll } from "../../lib/downloadUtils";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { type PDFFile } from "../../types/PDFFile";
import { analyzeFile } from "../../lib/pdfProcessingUtils";

interface ToolbarProps {
	label: string;
}

const Toolbar: React.FC<ToolbarProps> = ({ label }) => {
	const { confirm, modalComponent } = useConfirmModal();
	const loadedPDFs = usePDFStore((s) => s.loadedPDFs);
	const clearPDFs = usePDFStore((s) => s.clearPDFs);
	const addPDFs = usePDFStore((s) => s.addPDFs);
	const updatePDF = usePDFStore((s) => s.updatePDF);
	const ocrRegion = usePDFStore((s) => s.options.ocrRegion);
	const ocrPageNumber = usePDFStore((s) => s.options.ocrPageNumber);
	const fileInputRef = useRef<HTMLInputElement>(null);

	async function handleFilesSelected(files: FileList) {
		const newFiles: PDFFile[] = Array.from(files)
			.filter((f) => f.type === "application/pdf")
			.map((file) => ({
				file,
				status: "pending" as const,
				ocrProgress: 0,
			}));

		// Index de base lu au moment de l'ajout : évite un décalage si deux
		// sélections de fichiers s'enchaînent avant un re-render.
		const baseIndex = usePDFStore.getState().loadedPDFs.length;
		addPDFs(newFiles);

		// Analyser chaque nouveau fichier avec OCR
		for (let i = 0; i < newFiles.length; i++) {
			await analyzeFile(baseIndex + i, newFiles[i].file, ocrPageNumber, ocrRegion, updatePDF);
		}
	}

	const handleClearPDFs = async () => {
		await confirm({
			title: "Effacer tous les PDFs",
			description: `Êtes-vous sûr de vouloir supprimer tous les ${loadedPDFs.length} PDF(s) de la liste ? Cette action est irréversible.`,
			confirmLabel: "Effacer tout",
			cancelLabel: "Annuler",
			confirmVariant: "danger",
		}).then((confirmed) => confirmed && clearPDFs());
	};

	const handleDownloadAll = async () => {
		if (loadedPDFs.some((pdf) => pdf.status !== "completed")) {
			const confirmed = await confirm({
				title: "Avertissement",
				description: `Certains PDFs ne sont pas encore traités. Voulez-vous tout de même continuer ?`,
				confirmLabel: "Oui",
				cancelLabel: "Annuler",
				confirmVariant: "danger",
			});
			if (!confirmed) return;
		}
		downloadAll(loadedPDFs);
	};

	return (
		<div className="shrink-0 flex items-center justify-between gap-3 mb-3">
			<div>
				<h2 className="text-base font-semibold text-gray-900">{label}</h2>
			</div>
			<div className="flex gap-2">
				<label data-onboarding-target="load-pdfs" className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
					<FileText className="w-4 h-4" />
					<span className="text-sm font-medium">Charger des PDFs</span>
					<input ref={fileInputRef} type="file" multiple accept=".pdf" className="hidden" onChange={(e) => e.target.files && handleFilesSelected(e.target.files)} />
				</label>
				{loadedPDFs.length > 0 && (
					<>
						<button onClick={handleClearPDFs} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
							<Trash2 className="w-4 h-4" />
							Effacer tout
						</button>
						{loadedPDFs.length > 0 && (
							<button onClick={handleDownloadAll} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors">
								<Download className="w-4 h-4" />
								Télécharger tout (ZIP)
							</button>
						)}
					</>
				)}
			</div>
			{modalComponent}
		</div>
	);
};

export default Toolbar;
