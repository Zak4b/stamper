import BatchStamper from "../BatchStamper";
import { usePDFContext } from "../../hooks/usePDFContext";

export default function StampingStep() {
	const { options } = usePDFContext();

	return <BatchStamper stampPosition={options.stampPosition!} ocrRegion={options.ocrRegion} ocrPageNumber={options.ocrPageNumber} />;
}
