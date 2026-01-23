import { createContext } from "react";

export type Toast = { id: number; type?: "info" | "success" | "error" | "warn"; message: string; delai?: number };

export type ToastContextValue = {
	toasts: Toast[];
	push: (t: Omit<Toast, "id">) => void;
	remove: (id: number) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
