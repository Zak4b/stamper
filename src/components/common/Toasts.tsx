import React, { useState, useCallback, useRef, useEffect } from "react";
import { ToastContext, ToastContextValue, Toast } from "../../contexts/ToastContext";

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [toasts, setToasts] = useState<Toast[]>([]);
	const timersRef = useRef<Map<number, number>>(new Map());
	const pausedTimersRef = useRef<Map<number, { remainingTime: number; startTime: number }>>(new Map());

	const remove = useCallback((id: number) => {
		setToasts((prev) => prev.filter((p) => p.id !== id));
		const t = timersRef.current.get(id);
		if (t) {
			clearTimeout(t);
			timersRef.current.delete(id);
		}
		pausedTimersRef.current.delete(id);
	}, []);

	const pauseTimer = useCallback((id: number) => {
		const timer = timersRef.current.get(id);
		if (timer) {
			clearTimeout(timer);
			timersRef.current.delete(id);

			// Calculer le temps restant
			const pausedInfo = pausedTimersRef.current.get(id);
			if (pausedInfo) {
				const elapsed = Date.now() - pausedInfo.startTime;
				const remainingTime = Math.max(0, pausedInfo.remainingTime - elapsed);
				pausedTimersRef.current.set(id, { remainingTime, startTime: Date.now() });
			}
		}
	}, []);

	const resumeTimer = useCallback(
		(id: number) => {
			const pausedInfo = pausedTimersRef.current.get(id);
			if (pausedInfo && pausedInfo.remainingTime > 0) {
				const timer = window.setTimeout(() => remove(id), pausedInfo.remainingTime);
				timersRef.current.set(id, timer);
				pausedTimersRef.current.set(id, { remainingTime: pausedInfo.remainingTime, startTime: Date.now() });
			}
		},
		[remove]
	);

	const push = useCallback(
		(t: Omit<Toast, "id">) => {
			const id = Date.now() + Math.floor(Math.random() * 1000);
			const toast: Toast = { ...t, id };
			setToasts((prev) => [toast, ...prev]);
			const duration = t.delai ?? 4000;
			const timer = window.setTimeout(() => remove(id), duration);
			timersRef.current.set(id, timer);
			pausedTimersRef.current.set(id, { remainingTime: duration, startTime: Date.now() });
		},
		[remove]
	);

	useEffect(() => {
		return () => {
			const copy = new Map(timersRef.current);
			for (const timer of copy.values()) clearTimeout(timer);
			// reset the ref maps to fresh maps
			timersRef.current = new Map();
			pausedTimersRef.current = new Map();
		};
	}, []);

	const value: ToastContextValue = { toasts, push, remove };

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div className="fixed right-4 top-4 flex flex-col gap-2 z-50">
				{toasts.map((t) => (
					<div
						key={t.id}
						className={`max-w-xs rounded shadow p-3 text-sm transition-all ${
							t.type === "error"
								? "bg-red-600 text-white"
								: t.type === "success"
								? "bg-green-600 text-white"
								: t.type === "warn"
								? "bg-amber-600 text-white"
								: "bg-gray-800 text-white"
						}`}
						onMouseEnter={() => pauseTimer(t.id)}
						onMouseLeave={() => resumeTimer(t.id)}
					>
						<div className="flex justify-between items-start gap-2">
							<div className="whitespace-pre-wrap">{t.message}</div>
							<button onClick={() => remove(t.id)} className="ml-2 opacity-80 hover:opacity-100">
								✕
							</button>
						</div>
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
};

export default ToastProvider;
