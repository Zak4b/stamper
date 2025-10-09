import React from "react";
import BatchStamper from "../BatchStamper";
import { usePDFContext } from "../../hooks/usePDFContext";

const StampingStep: React.FC = () => {
	const { options } = usePDFContext();

	return <BatchStamper stampPosition={options.stampPosition!} ocrRegion={options.ocrRegion} ocrPageNumber={options.ocrPageNumber} />;
};

export default StampingStep;
