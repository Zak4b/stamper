import React from "react";
import { FileText } from "lucide-react";

const AppHeader: React.FC = () => {
	return (
		<header className="mb-8">
			<div className="flex items-center gap-3 mb-2">
				<FileText className="w-8 h-8 text-blue-600" />
				<h1 className="text-3xl font-bold text-gray-900">Tampon PDF - Traitement par lot</h1>
			</div>
			<p className="text-gray-600">Tamponnez automatiquement vos PDFs avec des valeurs issues de votre base de données</p>
		</header>
	);
};

export default AppHeader;
