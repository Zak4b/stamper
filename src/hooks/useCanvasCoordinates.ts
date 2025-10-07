import { useCallback } from "react";

export interface MouseCoordinates {
	x: number;
	y: number;
}

export function useCanvasCoordinates() {
	const getCanvasCoordinates = useCallback((event: React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement): MouseCoordinates => {
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;

		return {
			x: Math.round((event.clientX - rect.left) * scaleX),
			y: Math.round((event.clientY - rect.top) * scaleY),
		};
	}, []);

	const getVisualPosition = useCallback((coordinates: MouseCoordinates, canvas: HTMLCanvasElement): { left: string; top: string } => {
		return {
			left: `${canvas.offsetLeft + (coordinates.x / canvas.width) * canvas.offsetWidth}px`,
			top: `${canvas.offsetTop + (coordinates.y / canvas.height) * canvas.offsetHeight}px`,
		};
	}, []);

	return {
		getCanvasCoordinates,
		getVisualPosition,
	};
}
