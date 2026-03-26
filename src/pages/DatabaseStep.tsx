import React from "react";
import { FileText } from "lucide-react";
import DatabaseManager from "../components/managers/DatabaseManager";
import { usePDFContext } from "../hooks/usePDFContext";

const DatabaseStep: React.FC = () => {
	const { setSamplePDF } = usePDFContext();

	return (
		<div data-onboarding-target="database">
			<div className="flex-shrink-0">
						<label data-onboarding-target="pdf-model" className="cursor-pointer inline-flex items-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
					<FileText className="w-6 h-6" />
					<div className="text-left">
						<div className="font-semibold">Charger un modèle PDF</div>
						<div className="text-xs text-blue-100">Pour configurer les différents paramètres</div>
					</div>
					<input type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && setSamplePDF(e.target.files[0])} />
				</label>
			</div>
			{/* Gestionnaire de base de données */}
			<DatabaseManager />
		</div>
	);
};

export default DatabaseStep;
