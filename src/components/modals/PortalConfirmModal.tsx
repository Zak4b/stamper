import React from "react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
	isOpen: boolean;
	title: string;
	description?: string;
	onCancel: () => void;
	onConfirm: () => void;
	confirmLabel: string;
	cancelLabel: string;
	confirmVariant: "danger" | "primary" | "success";
}

export const PortalConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, description, onCancel, onConfirm, confirmLabel, cancelLabel, confirmVariant }) => {
	if (!isOpen) return null;

	const getConfirmButtonClass = () => {
		const baseClass = "px-4 py-2 rounded text-white font-medium transition-colors";
		switch (confirmVariant) {
			case "danger":
				return `${baseClass} bg-red-600 hover:bg-red-700`;
			case "primary":
				return `${baseClass} bg-blue-600 hover:bg-blue-700`;
			case "success":
				return `${baseClass} bg-green-600 hover:bg-green-700`;
			default:
				return `${baseClass} bg-red-600 hover:bg-red-700`;
		}
	};

	return createPortal(
		<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg shadow-lg w-[min(90%,480px)] p-4">
				<h3 className="text-lg font-semibold mb-2">{title}</h3>
				{description && <p className="text-sm text-gray-600 mb-4">{description}</p>}
				<div className="flex justify-end gap-2">
					<button onClick={onCancel} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50 transition-colors">
						{cancelLabel}
					</button>
					<button onClick={onConfirm} className={getConfirmButtonClass()}>
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>,
		document.body
	);
};
