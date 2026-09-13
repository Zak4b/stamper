import React from "react";
import BatchStamper from "../components/managers/BatchStamper";

const StampingStep: React.FC = () => {
	return (
		<div className="flex-1 min-h-0 flex flex-col" data-onboarding-target="stamping">
			<BatchStamper />
		</div>
	);
};

export default StampingStep;
