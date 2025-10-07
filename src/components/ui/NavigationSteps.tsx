import { Database, Stamp, Search, FileText } from "lucide-react";

type Step = "database" | "ocr-region" | "position" | "stamping";

interface NavigationStepsProps {
	currentStep: Step;
	samplePDF: File | null;
	stampPosition: boolean;
	onStepChange: (step: Step) => void;
}

export default function NavigationSteps({ currentStep, samplePDF, stampPosition, onStepChange }: NavigationStepsProps) {
	return (
		<div className="mb-8 flex gap-3 overflow-x-auto">
			<button
				onClick={() => onStepChange("database")}
				className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
					currentStep === "database" ? "bg-blue-600 text-white shadow-lg" : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
				}`}
			>
				<Database className="w-5 h-5" />
				<span>1. Base de données</span>
			</button>

			<button
				onClick={() => samplePDF && onStepChange("ocr-region")}
				disabled={!samplePDF}
				className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
					currentStep === "ocr-region"
						? "bg-blue-600 text-white shadow-lg"
						: samplePDF
						? "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
						: "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
				}`}
			>
				<Search className="w-5 h-5" />
				<span>2. Zone OCR</span>
			</button>

			<button
				onClick={() => samplePDF && onStepChange("position")}
				disabled={!samplePDF}
				className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
					currentStep === "position"
						? "bg-blue-600 text-white shadow-lg"
						: samplePDF
						? "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
						: "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
				}`}
			>
				<Stamp className="w-5 h-5" />
				<span>3. Position tampon</span>
			</button>

			<button
				onClick={() => stampPosition && onStepChange("stamping")}
				disabled={!stampPosition}
				className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
					currentStep === "stamping"
						? "bg-blue-600 text-white shadow-lg"
						: stampPosition
						? "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
						: "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
				}`}
			>
				<FileText className="w-5 h-5" />
				<span>4. Traitement</span>
			</button>
		</div>
	);
}
