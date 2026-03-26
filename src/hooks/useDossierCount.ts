import { useEffect, useState } from "react";
import { getDatabaseStats } from "../lib/database";

export function useDossierCount({ isOpen, hydrated, index }: { isOpen: boolean; hydrated: boolean; index: number }) {
	const [dossierCount, setDossierCount] = useState<number>(0);

	useEffect(() => {
		// Step 1 is valid when at least one CSV record is imported into the database.
		if (!isOpen || !hydrated || index !== 0) return;

		let cancelled = false;
		let timer: number | undefined;

		const refresh = async () => {
			try {
				const stats = await getDatabaseStats();
				if (cancelled) return;
				setDossierCount(Number(stats.totalDossiers || 0));
			} catch {
				// Keep previous value on error
			}
		};

		void refresh();
		timer = window.setInterval(() => void refresh(), 1500);

		return () => {
			cancelled = true;
			if (timer) window.clearInterval(timer);
		};
	}, [hydrated, index, isOpen]);

	return dossierCount;
}

