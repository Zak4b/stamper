import React from "react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
	isOpen: boolean;
	title: React.ReactNode;
	description?: React.ReactNode;
	content?: React.ReactNode;
	onCancel: () => void;
	onConfirm: () => void;
	confirmLabel: string;
	cancelLabel: string;
	confirmVariant: "danger" | "primary" | "success";
	size?: "small" | "medium" | "large" | "xl";
	scrollable?: boolean;
}

export const PortalConfirmModal: React.FC<ConfirmModalProps> = ({
	isOpen,
	title,
	description,
	content,
	onCancel,
	onConfirm,
	confirmLabel,
	cancelLabel,
	confirmVariant,
	size = "medium",
	scrollable = false,
}) => {
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

	const getSizeClass = () => {
		switch (size) {
			case "small":
				return "w-[min(90%,400px)]";
			case "medium":
				return "w-[min(90%,500px)]";
			case "large":
				return "w-[min(90%,700px)]";
			case "xl":
				return "w-[min(90%,900px)]";
			default:
				return "w-[min(90%,500px)]";
		}
	};

	const getMaxHeight = () => {
		return scrollable ? "max-h-[80vh]" : "";
	};

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
			<div className={`flex flex-col rounded-lg border border-gray-200 bg-white shadow-lg ${getSizeClass()} ${getMaxHeight()}`}>
				<div className="flex-shrink-0 border-b border-gray-200 bg-white p-4">
					{typeof title === "string" ? <h3 className="text-lg font-semibold text-gray-900">{title}</h3> : <div>{title}</div>}
				</div>

				{(description || content) && (
					<div className={`bg-white p-4 ${scrollable ? "flex-1 overflow-y-auto" : ""}`}>
						{description && (typeof description === "string" ? <p className="text-sm text-gray-600 mb-4">{description}</p> : <div className="mb-4">{description}</div>)}
						{content && <div>{content}</div>}
					</div>
				)}

				<div className="flex flex-shrink-0 justify-end gap-2 border-t border-gray-200 bg-white p-4">
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
