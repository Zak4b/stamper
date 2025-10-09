import React from "react";
import { FileText } from "lucide-react";
import DatabaseManager from "../DatabaseManager";
import { usePDFContext } from "../../hooks/usePDFContext";

const DatabaseStep: React.FC = () => {
	const { setSamplePDF } = usePDFContext();

	return (
		<div className="space-y-6">
			{/* Header avec action principale */}
			<div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
				<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
					<div className="flex-1">
						<h2 className="text-2xl font-bold text-gray-900 mb-2">Configuration de la base de données</h2>
						<p className="text-gray-600 mb-4">
							Gérez vos correspondances numéro de dossier ↔ valeur de tampon, puis chargez un PDF exemple pour configurer le traitement automatique.
						</p>
					</div>
					<div className="flex-shrink-0">
						<label className="cursor-pointer inline-flex items-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
							<FileText className="w-6 h-6" />
							<div className="text-left">
								<div className="font-semibold">Charger un PDF exemple</div>
								<div className="text-xs text-blue-100">Pour configurer OCR et tamponnage</div>
							</div>
							<input type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && setSamplePDF(e.target.files[0])} />
						</label>
					</div>
				</div>
			</div>

			{/* Gestionnaire de base de données */}
			<DatabaseManager />
		</div>
	);
};

export default DatabaseStep;
