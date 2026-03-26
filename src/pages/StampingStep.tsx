import React from "react";
import BatchStamper from "../components/managers/BatchStamper";

const StampingStep: React.FC = () => {
	return (
		<div data-onboarding-target="stamping">
			<BatchStamper />
		</div>
	);
};

export default StampingStep;
