import { Suspense } from "react";
import { Rectangle } from "tesseract.js";
import OCRRegionSelector from "./OCRRegionSelector";
import LoadingSpinner from "./LoadingSpinner";

interface OCRStepProps {
	pdfFile: File;
	ocrRegion: Rectangle | undefined;
	ocrPageNumber: number;
	onRegionSelected: (region: Rectangle | undefined) => void;
	onPageChanged: (pageNumber: number) => void;
	onContinue: () => void;
}

export default function OCRStep({ pdfFile, ocrRegion, ocrPageNumber, onRegionSelected, onPageChanged, onContinue }: OCRStepProps) {
	return (
		<>
			<Suspense fallback={<LoadingSpinner />}>
				<OCRRegionSelector pdfFile={pdfFile} onRegionSelected={onRegionSelected} onPageChanged={onPageChanged} />
			</Suspense>
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
					<button onClick={onContinue} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
						Continuer
					</button>
				</div>
			</div>
		</>
	);
}
