import { useCallback, useEffect, useMemo, useState } from "react";

type StoredOnboardingState = {
	completed: boolean;
	index: number;
};

const STORAGE_KEY = "pdfStamper_onboarding_state_v1";

function readStoredState(): StoredOnboardingState {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { completed: false, index: 0 };
		const parsed = JSON.parse(raw) as Partial<StoredOnboardingState>;
		return {
			completed: Boolean(parsed.completed),
			index: typeof parsed.index === "number" ? parsed.index : 0,
		};
	} catch {
		return { completed: false, index: 0 };
	}
}

function persistState(next: StoredOnboardingState) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	} catch {
		// Ignore persistence errors (private mode, etc.)
	}
}

export function useOnboardingWizard() {
	const [isOpen, setIsOpen] = useState(false);
	const [index, setIndexState] = useState(0);
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		const stored = readStoredState();
		setIndexState(stored.index);
		setIsOpen(!stored.completed);
		setHydrated(true);
	}, []);

	const dismiss = useCallback(() => {
		setIsOpen(false);
	}, []);

	const start = useCallback(() => {
		// Start the onboarding from step 1 without forcing the "completed" state to false.
		setIndexState(0);
		setIsOpen(true);
	}, []);

	const setIndex = useCallback((nextIndex: number) => {
		const bounded = Math.max(0, Math.min(5, nextIndex));
		setIndexState(bounded);
		// Persist only position while not completed
		const stored = readStoredState();
		persistState({ ...stored, index: bounded, completed: stored.completed });
	}, []);

	const complete = useCallback(() => {
		persistState({ completed: true, index });
		setIsOpen(false);
	}, [index]);

	const actions = useMemo(
		() => ({
			isOpen,
			index,
			hydrated,
			dismiss,
			start,
			setIndex,
			complete,
		}),
		[complete, dismiss, index, isOpen, hydrated, setIndex, start],
	);

	return actions;
}

