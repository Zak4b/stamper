import React from "react";
import ProgressSegment, { ProgressSegmentProps } from "./ProgressSegment";

export interface MultiProgressBarProps {
	segments: Array<Omit<ProgressSegmentProps, "total"> & { value: number }>;
	total: number;
	height?: string;
	className?: string;
}

const MultiProgressBar: React.FC<MultiProgressBarProps> = ({ segments, total, height = "h-4", className = "" }) => {
	return (
		<div className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden shadow-inner ${className}`}>
			<div className="h-full flex">
				{segments.map((segment, index) => (
					<ProgressSegment key={index} {...segment} total={total} />
				))}
			</div>
		</div>
	);
};

export default MultiProgressBar;
