import { useState } from "react";
import { FileText, Database, Stamp, Search } from "lucide-react";
import DatabaseManager from "./components/DatabaseManager";
import StampPositionSelector from "./components/StampPositionSelector";
import BatchStamper from "./components/BatchStamper";
import OCRRegionSelector from "./components/OCRRegionSelector";
import { StampPosition } from "./lib/pdfStamper";
import { Rectangle } from "tesseract.js";

type Step = "database" | "ocr-region" | "position" | "stamping";

export default function App() {
	const [currentStep, setCurrentStep] = useState<Step>("database");
	const [samplePDF, setSamplePDF] = useState<File | null>(null);
	const [stampPosition, setStampPosition] = useState<StampPosition | null>(null);
	const [ocrRegion, setOcrRegion] = useState<Rectangle | undefined>(undefined);
	const [ocrPageNumber, setOcrPageNumber] = useState<number>(0);

	function handleSamplePDFSelected(file: File) {
		setSamplePDF(file);
		setCurrentStep("ocr-region");
	}

	function handleOCRRegionSelected(region: Rectangle | undefined) {
		setOcrRegion(region);
	}

	function handleOCRPageChanged(pageNumber: number) {
		setOcrPageNumber(pageNumber);
	}

	function continueToStampPosition() {
		setCurrentStep("position");
	}

	function handlePositionSelected(position: StampPosition) {
		setStampPosition(position);
	}

	function startStamping() {
		if (stampPosition) {
			setCurrentStep("stamping");
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
			<div className="max-w-7xl mx-auto px-4 py-8">
				<header className="mb-8">
					<div className="flex items-center gap-3 mb-2">
						<FileText className="w-8 h-8 text-blue-600" />
						<h1 className="text-3xl font-bold text-gray-900">Tampon PDF - Traitement par lot</h1>
					</div>
					<p className="text-gray-600">Tamponnez automatiquement vos PDFs avec des valeurs issues de votre base de données</p>
				</header>

				<div className="mb-8 flex gap-3 overflow-x-auto">
					<button
						onClick={() => setCurrentStep("database")}
						className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
							currentStep === "database" ? "bg-blue-600 text-white shadow-lg" : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
						}`}
					>
						<Database className="w-5 h-5" />
						<span>1. Base de données</span>
					</button>

					<button
						onClick={() => samplePDF && setCurrentStep("ocr-region")}
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
						onClick={() => samplePDF && setCurrentStep("position")}
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
						onClick={() => stampPosition && setCurrentStep("stamping")}
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

				<div className="space-y-6">
					{currentStep === "database" && (
						<>
							<DatabaseManager />
							<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-4">Étape suivante: Configuration OCR</h3>
								<p className="text-gray-600 mb-4">Chargez un PDF exemple pour configurer la détection automatique des numéros de dossier et la position du tampon.</p>
								<label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
									<FileText className="w-5 h-5" />
									<span className="font-medium">Charger un PDF exemple</span>
									<input type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleSamplePDFSelected(e.target.files[0])} />
								</label>
							</div>
						</>
					)}

					{currentStep === "ocr-region" && samplePDF && (
						<>
							<OCRRegionSelector pdfFile={samplePDF} onRegionSelected={handleOCRRegionSelected} onPageChanged={handleOCRPageChanged} />
							<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="text-lg font-semibold text-gray-900 mb-2">Configuration OCR</h3>
										<p className="text-gray-600">
											{ocrRegion ? `Zone définie: ${Math.round(ocrRegion.width)} x ${Math.round(ocrRegion.height)} pixels` : "Page complète sélectionnée pour la recherche OCR"}
											<br />
											<span className="text-sm text-blue-600">Page OCR: {ocrPageNumber + 1}</span>
										</p>
									</div>
									<button onClick={continueToStampPosition} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
										Continuer
									</button>
								</div>
							</div>
						</>
					)}

					{currentStep === "position" && samplePDF && (
						<>
							<StampPositionSelector pdfFile={samplePDF} onPositionSelected={handlePositionSelected} currentPosition={stampPosition || undefined} />
							{stampPosition && (
								<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
									<div className="flex items-center justify-between">
										<div>
											<h3 className="text-lg font-semibold text-gray-900 mb-2">Position définie avec succès</h3>
											<p className="text-gray-600">
												Le tampon sera appliqué à la position X={Math.round(stampPosition.x)}, Y={Math.round(stampPosition.y)} sur la page {stampPosition.page + 1}.
											</p>
										</div>
										<button onClick={startStamping} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors">
											Commencer le traitement
										</button>
									</div>
								</div>
							)}
						</>
					)}

					{currentStep === "stamping" && stampPosition && <BatchStamper stampPosition={stampPosition} ocrRegion={ocrRegion} ocrPageNumber={ocrPageNumber} />}
				</div>
			</div>
		</div>
	);
}
