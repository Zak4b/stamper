import React, { useState, useCallback, useRef, useEffect } from "react";
import { ToastContext, ToastContextValue, Toast } from "../../lib/toastContext";

export default function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);
	const timersRef = useRef<Map<number, number>>(new Map());

	const remove = useCallback((id: number) => {
		setToasts((prev) => prev.filter((p) => p.id !== id));
		const t = timersRef.current.get(id);
		if (t) {
			clearTimeout(t);
			timersRef.current.delete(id);
		}
	}, []);

	const push = useCallback(
		(t: Omit<Toast, "id"> & { durationMs?: number }) => {
			const id = Date.now() + Math.floor(Math.random() * 1000);
			const toast: Toast = { ...t, id } as Toast;
			setToasts((prev) => [toast, ...prev]);
			const duration = t.durationMs ?? 4000;
			const timer = window.setTimeout(() => remove(id), duration);
			timersRef.current.set(id, timer);
		},
		[remove]
	);

	useEffect(() => {
		return () => {
			const copy = new Map(timersRef.current);
			for (const timer of copy.values()) clearTimeout(timer);
			// reset the ref map to a fresh map
			timersRef.current = new Map();
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
						className={`max-w-xs rounded shadow p-3 text-sm ${
							t.type === "error" ? "bg-red-600 text-white" : t.type === "success" ? "bg-green-600 text-white" : "bg-gray-800 text-white"
						}`}
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
}
