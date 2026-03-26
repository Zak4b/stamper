import { useEffect, useState } from "react";

type HighlightRect = {
	left: number;
	top: number;
	width: number;
	height: number;
};

export function useOnboardingHighlightRect({
	isOpen,
	hydrated,
	highlightTarget,
	index,
}: {
	isOpen: boolean;
	hydrated: boolean;
	highlightTarget?: string;
	index: number;
}) {
	const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);

	useEffect(() => {
		if (!isOpen || !hydrated || !highlightTarget) {
			setHighlightRect(null);
			return;
		}

		const selector = `[data-onboarding-target="${highlightTarget}"]`;
		let cancelled = false;
		let rafId: number | null = null;
		let resizeObserver: ResizeObserver | null = null;
		let mutationObserver: MutationObserver | null = null;

		const computeAndSet = (el: HTMLElement) => {
			const r = el.getBoundingClientRect();
			// Pad a bit so border doesn't hug the content
			const pad = 10;
			setHighlightRect({
				left: r.left - pad,
				top: r.top - pad,
				width: r.width + pad * 2,
				height: r.height + pad * 2,
			});
		};

		const tryGetTarget = () => document.querySelector(selector) as HTMLElement | null;

		// The step components are lazy-loaded; retry briefly until the target exists.
		const maxRetries = 10;
		const retryDelayMs = 120;
		let retries = 0;

		const tryCompute = () => {
			if (cancelled) return;
			const el = tryGetTarget();
			if (!el) {
				if (retries < maxRetries) {
					retries += 1;
					setTimeout(tryCompute, retryDelayMs);
				} else {
					setHighlightRect(null);
				}
				return;
			}

			computeAndSet(el);

			// Keep in sync when the target resizes after async rendering (PDF/canvas load).
			resizeObserver = new ResizeObserver(() => {
				const nextEl = tryGetTarget();
				if (nextEl) computeAndSet(nextEl);
			});
			resizeObserver.observe(el);

			// Also watch subtree/attribute changes that can affect layout.
			mutationObserver = new MutationObserver(() => {
				const nextEl = tryGetTarget();
				if (nextEl) computeAndSet(nextEl);
			});
			mutationObserver.observe(el, {
				childList: true,
				subtree: true,
				attributes: true,
			});
		};

		tryCompute();

		const onRelayout = () => {
			const el = tryGetTarget();
			if (el) computeAndSet(el);
		};

		window.addEventListener("resize", onRelayout);
		window.addEventListener("scroll", onRelayout, true);

		// Fallback for late layout stabilization right after step switch.
		const rafEndAt = performance.now() + 1800;
		const rafTick = () => {
			if (cancelled) return;
			onRelayout();
			if (performance.now() < rafEndAt) {
				rafId = requestAnimationFrame(rafTick);
			}
		};
		rafId = requestAnimationFrame(rafTick);

		return () => {
			window.removeEventListener("resize", onRelayout);
			window.removeEventListener("scroll", onRelayout, true);
			if (rafId !== null) cancelAnimationFrame(rafId);
			resizeObserver?.disconnect();
			mutationObserver?.disconnect();
			cancelled = true;
		};
	}, [highlightTarget, hydrated, index, isOpen]);

	return highlightRect;
}

