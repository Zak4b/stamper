import React from "react";

type Props = {
	isOpen: boolean;
	title?: string;
	description?: string;
	onCancel: () => void;
	onConfirm: () => void;
	confirmLabel?: string;
	cancelLabel?: string;
};

const ConfirmModal: React.FC<Props> = ({ isOpen, title = "Confirmer", description, onCancel, onConfirm, confirmLabel = "Confirmer", cancelLabel = "Annuler" }) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg shadow-lg w-[min(90%,480px)] p-4">
				<h3 className="text-lg font-semibold mb-2">{title}</h3>
				{description && <p className="text-sm text-gray-600 mb-4">{description}</p>}
				<div className="flex justify-end gap-2">
					<button onClick={onCancel} className="px-4 py-2 rounded border">
						{cancelLabel}
					</button>
					<button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white">
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ConfirmModal;
