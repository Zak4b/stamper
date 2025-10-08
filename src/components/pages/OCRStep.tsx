import OCRRegionSelector from "../OCRRegionSelector";
import { usePDFContext } from "../../hooks/usePDFContext";

export default function OCRStep() {
	const { samplePDF, options, setRegionOCR, setPageOCR, setCurrentStep } = usePDFContext();

	if (!samplePDF) {
		return <div>Aucun PDF chargé</div>;
	}
	return (
		<>
			<OCRRegionSelector pdfFile={samplePDF} onRegionSelected={setRegionOCR} onPageChanged={setPageOCR} currentRegion={options.ocrRegion} initialPage={options.ocrPageNumber} />
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-lg font-semibold text-gray-900 mb-2">Configuration OCR</h3>
						<p className="text-gray-600">
							{options.ocrRegion
								? `Zone définie: ${Math.round(options.ocrRegion.width)} x ${Math.round(options.ocrRegion.height)} pixels`
								: "Page complète sélectionnée pour la recherche OCR"}
							<br />
							<span className="text-sm text-blue-600">Page OCR: {options.ocrPageNumber + 1}</span>
						</p>
					</div>
					<button onClick={() => setCurrentStep("position")} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
						Continuer
					</button>
				</div>
			</div>
		</>
	);
}
