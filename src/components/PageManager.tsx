import { Rectangle } from "tesseract.js";
import { StampPosition } from "../lib/pdfStamper";
import DatabaseStep from "./DatabaseStep";
import OCRStep from "./OCRStep";
import PositionStep from "./PositionStep";
import StampingStep from "./StampingStep";

type Step = "database" | "ocr-region" | "position" | "stamping";

interface PageManagerProps {
	currentStep: Step;
	samplePDF: File | null;
	stampPosition: StampPosition | null;
	ocrRegion: Rectangle | undefined;
	ocrPageNumber: number;
	onSamplePDFSelected: (file: File) => void;
	onOCRRegionSelected: (region: Rectangle | undefined) => void;
	onOCRPageChanged: (pageNumber: number) => void;
	onContinueToStampPosition: () => void;
	onPositionSelected: (position: StampPosition) => void;
	onStartStamping: () => void;
}

export default function PageManager({
	currentStep,
	samplePDF,
	stampPosition,
	ocrRegion,
	ocrPageNumber,
	onSamplePDFSelected,
	onOCRRegionSelected,
	onOCRPageChanged,
	onContinueToStampPosition,
	onPositionSelected,
	onStartStamping,
}: PageManagerProps) {
	return (
		<div className="space-y-6">
			{currentStep === "database" && <DatabaseStep onSamplePDFSelected={onSamplePDFSelected} />}

			{currentStep === "ocr-region" && samplePDF && (
				<OCRStep
					pdfFile={samplePDF}
					ocrRegion={ocrRegion}
					ocrPageNumber={ocrPageNumber}
					onRegionSelected={onOCRRegionSelected}
					onPageChanged={onOCRPageChanged}
					onContinue={onContinueToStampPosition}
				/>
			)}

			{currentStep === "position" && samplePDF && (
				<PositionStep pdfFile={samplePDF} stampPosition={stampPosition} onPositionSelected={onPositionSelected} onStartStamping={onStartStamping} />
			)}

			{currentStep === "stamping" && stampPosition && <StampingStep stampPosition={stampPosition} ocrRegion={ocrRegion} ocrPageNumber={ocrPageNumber} />}
		</div>
	);
}
