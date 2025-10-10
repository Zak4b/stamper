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
		<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
			<div className={`bg-white rounded-lg shadow-lg ${getSizeClass()} ${getMaxHeight()} flex flex-col`}>
				<div className="p-4 border-b flex-shrink-0">{typeof title === "string" ? <h3 className="text-lg font-semibold">{title}</h3> : <div>{title}</div>}</div>

				{(description || content) && (
					<div className={`p-4 ${scrollable ? "overflow-y-auto flex-1" : ""}`}>
						{description && (typeof description === "string" ? <p className="text-sm text-gray-600 mb-4">{description}</p> : <div className="mb-4">{description}</div>)}
						{content && <div>{content}</div>}
					</div>
				)}

				<div className="p-4 border-t flex justify-end gap-2 flex-shrink-0">
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
