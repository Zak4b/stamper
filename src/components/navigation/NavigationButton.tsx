import React, { ReactNode } from "react";

export interface NavigationButtonProps {
	onClick: () => void;
	disabled?: boolean;
	active?: boolean;
	icon: ReactNode;
	children: ReactNode;
	className?: string;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({ onClick, disabled = false, active = false, icon, children, className = "" }) => {
	const baseClasses = "flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all whitespace-nowrap";

	const stateClasses = active
		? "bg-blue-600 text-white shadow-lg"
		: disabled
		? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
		: "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200";

	return (
		<button onClick={onClick} disabled={disabled} className={`${baseClasses} ${stateClasses} ${className}`}>
			{icon}
			<span>{children}</span>
		</button>
	);
};

export default NavigationButton;
