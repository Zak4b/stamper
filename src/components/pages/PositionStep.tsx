import React from "react";
import StampPositionSelector from "../StampPositionSelector";
import { usePDFContext } from "../../hooks/usePDFContext";

const PositionStep: React.FC = () => {
	const { samplePDF, options, setStampPos, setCurrentStep } = usePDFContext();

	if (!samplePDF) {
		return <div>Aucun PDF chargé</div>;
	}
	return (
		<>
			<StampPositionSelector pdfFile={samplePDF} onPositionSelected={setStampPos} currentPosition={options.stampPosition || undefined} />
			{options.stampPosition && (
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">Position définie avec succès</h3>
							<p className="text-gray-600">
								Le tampon sera appliqué à la position X={Math.round(options.stampPosition.x)}, Y={Math.round(options.stampPosition.y)} sur la page {options.stampPosition.page + 1}.
							</p>
						</div>
						<button onClick={() => setCurrentStep("stamping")} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors">
							Commencer le traitement
						</button>
					</div>
				</div>
			)}
		</>
	);
};

export default PositionStep;
