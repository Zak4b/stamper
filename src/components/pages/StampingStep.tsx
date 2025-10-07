import { Suspense } from "react";
import { Rectangle } from "tesseract.js";
import BatchStamper from "../BatchStamper";
import { StampPosition } from "../../lib/pdfStamper";
import LoadingSpinner from "../ui/LoadingSpinner";

interface StampingStepProps {
	stampPosition: StampPosition;
	ocrRegion: Rectangle | undefined;
	ocrPageNumber: number;
}

export default function StampingStep({ stampPosition, ocrRegion, ocrPageNumber }: StampingStepProps) {
	return (
		<Suspense fallback={<LoadingSpinner />}>
			<BatchStamper stampPosition={stampPosition} ocrRegion={ocrRegion} ocrPageNumber={ocrPageNumber} />
		</Suspense>
	);
}
