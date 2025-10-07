import { Suspense } from "react";
import StampPositionSelector from "../StampPositionSelector";
import { StampPosition } from "../../lib/pdfStamper";
import LoadingSpinner from "../ui/LoadingSpinner";

interface PositionStepProps {
	pdfFile: File;
	stampPosition: StampPosition | null;
	onPositionSelected: (position: StampPosition) => void;
	onStartStamping: () => void;
}

export default function PositionStep({ pdfFile, stampPosition, onPositionSelected, onStartStamping }: PositionStepProps) {
	return (
		<>
			<Suspense fallback={<LoadingSpinner />}>
				<StampPositionSelector pdfFile={pdfFile} onPositionSelected={onPositionSelected} currentPosition={stampPosition || undefined} />
			</Suspense>
			{stampPosition && (
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">Position définie avec succès</h3>
							<p className="text-gray-600">
								Le tampon sera appliqué à la position X={Math.round(stampPosition.x)}, Y={Math.round(stampPosition.y)} sur la page {stampPosition.page + 1}.
							</p>
						</div>
						<button onClick={onStartStamping} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors">
							Commencer le traitement
						</button>
					</div>
				</div>
			)}
		</>
	);
}
