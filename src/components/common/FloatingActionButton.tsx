import React, { ReactNode } from "react";

export interface FloatingActionButtonProps {
	onClick: () => void;
	icon: ReactNode;
	label?: string;
	disabled?: boolean;
	variant?: "primary" | "secondary" | "success";
	position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
	className?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick, icon, label, disabled = false, variant = "primary", position = "bottom-right", className = "" }) => {
	const variantClasses = {
		primary: "bg-blue-600 hover:bg-blue-700 text-white",
		secondary: "bg-gray-600 hover:bg-gray-700 text-white",
		success: "bg-green-600 hover:bg-green-700 text-white",
	};

	const positionClasses = {
		"bottom-right": "bottom-6 right-6",
		"bottom-left": "bottom-6 left-6",
		"top-right": "top-6 right-6",
		"top-left": "top-6 left-6",
	};

	const baseClasses = "fixed p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 flex items-center gap-2";
	const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

	return (
		<button
			onClick={disabled ? undefined : onClick}
			disabled={disabled}
			className={`${baseClasses} ${variantClasses[variant]} ${positionClasses[position]} ${disabledClasses} ${className}`}
		>
			{icon}
			{label && <span className="hidden sm:inline">{label}</span>}
		</button>
	);
};

export default FloatingActionButton;
