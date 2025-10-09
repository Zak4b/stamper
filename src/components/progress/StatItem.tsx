import React from "react";

export interface StatItemProps {
	count: number;
	label: string;
	color: string;
	animate?: boolean;
	show?: boolean;
	size?: "sm" | "md" | "lg";
	variant?: "card" | "inline";
}

const StatItem: React.FC<StatItemProps> = ({ count, label, color, animate = false, show = true, size = "md", variant = "card" }) => {
	if (!show || count === 0) return null;

	const sizeClasses = {
		sm: "w-2 h-2",
		md: "w-3 h-3",
		lg: "w-4 h-4",
	};

	const gapClasses = {
		sm: "gap-1",
		md: "gap-2",
		lg: "gap-3",
	};

	const containerClasses = variant === "card" ? `flex items-center ${gapClasses[size]} bg-white px-3 py-2 rounded-lg shadow-sm` : `flex items-center ${gapClasses[size]}`;

	const textClasses = variant === "card" ? "text-gray-700" : "text-xs text-gray-600";

	return (
		<div className={containerClasses}>
			<div className={`${sizeClasses[size]} ${color} rounded-full ${animate ? "animate-pulse" : ""}`} />
			<span className={textClasses}>
				<span className="font-semibold">{count}</span> {label}
			</span>
		</div>
	);
};

export default StatItem;
