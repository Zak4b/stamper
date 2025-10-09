import React from "react";

export interface ProgressSegmentProps {
	value: number;
	total: number;
	color: string;
	animate?: boolean;
	title: string;
}

const ProgressSegment: React.FC<ProgressSegmentProps> = ({ value, total, color, animate = false, title }) => {
	const width = total > 0 ? (value / total) * 100 : 0;

	if (width === 0) return null;

	return <div className={`${color} transition-all duration-500 ${animate ? "animate-pulse" : ""}`} style={{ width: `${width}%` }} title={title} />;
};

export default ProgressSegment;
