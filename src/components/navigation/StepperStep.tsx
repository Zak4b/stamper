import React from "react";

type StepState = "active" | "complete" | "accessible" | "locked";

interface StepperStepProps {
	state: StepState;
	label: string;
	onClick: () => void;
}

const StepperStep: React.FC<StepperStepProps> = ({ state, label, onClick }) => {
	const cls =
		state === "active"
			? "step step-primary"
			: state === "complete"
			? "step step-success"
			: "step";

	const cursor = state === "locked" ? "cursor-not-allowed" : "cursor-pointer";

	return (
		<li
			className={`${cls} ${cursor} text-xs`}
			data-content={state === "complete" ? "✓" : undefined}
			onClick={state !== "locked" ? onClick : undefined}
		>
			{label}
		</li>
	);
};

export type { StepState };
export default StepperStep;
