import React, { useState, useCallback } from "react";
import { PortalConfirmModal } from "../components/modals/PortalConfirmModal";

interface ConfirmModalOptions {
	title?: string;
	description?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	confirmVariant?: "danger" | "primary" | "success";
}

interface ConfirmModalState extends ConfirmModalOptions {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export interface UseConfirmModalReturn {
	confirm: (options?: ConfirmModalOptions) => Promise<boolean>;
	close: () => void;
	isOpen: boolean;
	modalComponent: React.ReactNode;
}

export function useConfirmModal(): UseConfirmModalReturn {
	const [modalState, setModalState] = useState<ConfirmModalState>({
		isOpen: false,
		title: "",
		description: "",
		confirmLabel: "",
		cancelLabel: "",
		confirmVariant: "danger",
		onConfirm: () => {},
		onCancel: () => {},
	});

	const close = useCallback(() => {
		setModalState((prev) => ({ ...prev, isOpen: false }));
	}, []);

	const confirm = useCallback(
		(options: ConfirmModalOptions = {}): Promise<boolean> => {
			return new Promise((resolve) => {
				const handleConfirm = () => {
					close();
					resolve(true);
				};

				const handleCancel = () => {
					close();
					resolve(false);
				};

				setModalState({
					isOpen: true,
					title: options.title || "Confirmer",
					description: options.description,
					confirmLabel: options.confirmLabel || "Confirmer",
					cancelLabel: options.cancelLabel || "Annuler",
					confirmVariant: options.confirmVariant || "danger",
					onConfirm: handleConfirm,
					onCancel: handleCancel,
				});
			});
		},
		[close]
	);

	const modalComponent = (
		<PortalConfirmModal
			isOpen={modalState.isOpen}
			title={modalState.title || "Confirmer"}
			description={modalState.description}
			confirmLabel={modalState.confirmLabel || "Confirmer"}
			cancelLabel={modalState.cancelLabel || "Annuler"}
			confirmVariant={modalState.confirmVariant || "danger"}
			onConfirm={modalState.onConfirm}
			onCancel={modalState.onCancel}
		/>
	);

	return {
		confirm,
		close,
		isOpen: modalState.isOpen,
		modalComponent,
	};
}
