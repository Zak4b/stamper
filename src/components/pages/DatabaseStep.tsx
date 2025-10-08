import { FileText } from "lucide-react";
import DatabaseManager from "../DatabaseManager";
import { usePDFContext } from "../../hooks/usePDFContext";

export default function DatabaseStep() {
	const { setSamplePDF } = usePDFContext();

	return (
		<>
			<DatabaseManager />
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">Étape suivante: Configuration OCR</h3>
				<p className="text-gray-600 mb-4">Chargez un PDF exemple pour configurer la détection automatique des numéros de dossier et la position du tampon.</p>
				<label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
					<FileText className="w-5 h-5" />
					<span className="font-medium">Charger un PDF exemple</span>
					<input type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && setSamplePDF(e.target.files[0])} />
				</label>
			</div>
		</>
	);
}
