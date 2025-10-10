import React, { useState, useCallback } from "react";
import { PortalConfirmModal } from "../components/modals/PortalConfirmModal";

interface ConfirmModalOptions {
	title?: React.ReactNode;
	description?: React.ReactNode;
	content?: React.ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	confirmVariant?: "danger" | "primary" | "success";
	size?: "small" | "medium" | "large" | "xl";
	scrollable?: boolean;
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
		content: undefined,
		confirmLabel: "",
		cancelLabel: "",
		confirmVariant: "danger",
		size: undefined,
		scrollable: undefined,
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
					content: options.content,
					confirmLabel: options.confirmLabel || "Confirmer",
					cancelLabel: options.cancelLabel || "Annuler",
					confirmVariant: options.confirmVariant || "danger",
					size: options.size,
					scrollable: options.scrollable,
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
			content={modalState.content}
			confirmLabel={modalState.confirmLabel || "Confirmer"}
			cancelLabel={modalState.cancelLabel || "Annuler"}
			confirmVariant={modalState.confirmVariant || "danger"}
			size={modalState.size}
			scrollable={modalState.scrollable}
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
