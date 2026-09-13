import { pdfjsLib, type PDFDocumentProxy } from "./pdfLoader";

export interface PreparedPDF {
	pdf: PDFDocumentProxy;
	/** true si le document a dû être réorienté par rapport au fichier source */
	isReoriented: boolean;
}

/**
 * Lit le fichier, applique la réorientation si nécessaire, et ouvre le document
 * pdf.js. C'est l'étape coûteuse : lecture du blob + parse pdf-lib + parse pdf.js.
 */
export async function preparePDFDocument(file: File, useReorientation: boolean): Promise<PreparedPDF> {
	const bytes = new Uint8Array(await file.arrayBuffer());

	if (!useReorientation) {
		return { pdf: await pdfjsLib.getDocument({ data: bytes }).promise, isReoriented: false };
	}

	const { needsReorientation, reorientPDF } = await import("./pdfReorientation");

	let finalBytes = bytes;
	let isReoriented = false;
	if (await needsReorientation(bytes)) {
		finalBytes = new Uint8Array(await reorientPDF(bytes));
		isReoriented = true;
	}

	return { pdf: await pdfjsLib.getDocument({ data: finalBytes }).promise, isReoriented };
}

/**
 * Cache LRU des documents préparés, indexé par identité du `File`.
 *
 * Sans lui, chaque changement de page ou d'étape (zone OCR -> position tampon)
 * relit et reparse intégralement le même PDF modèle. Le cache est volontairement
 * petit : seules les previews l'utilisent, et il n'y en a au plus que deux
 * simultanément (l'étape courante + `PDFViewerModal`).
 */
const MAX_ENTRIES = 3;
/** Délai avant destruction d'une entrée évincée, au cas où un rendu l'utilise encore. */
const DESTROY_DELAY = 5000;

interface CacheEntry {
	file: File;
	useReorientation: boolean;
	promise: Promise<PreparedPDF>;
}

const entries: CacheEntry[] = [];

function scheduleDestroy(entry: CacheEntry): void {
	setTimeout(() => {
		void entry.promise.then(({ pdf }) => pdf.destroy()).catch(() => undefined);
	}, DESTROY_DELAY);
}

export function getPreparedPDF(file: File, useReorientation: boolean): Promise<PreparedPDF> {
	const index = entries.findIndex((e) => e.file === file && e.useReorientation === useReorientation);
	if (index >= 0) {
		// Remonter l'entrée en tête : LRU.
		const [hit] = entries.splice(index, 1);
		entries.push(hit);
		return hit.promise;
	}

	const entry: CacheEntry = { file, useReorientation, promise: preparePDFDocument(file, useReorientation) };
	// Ne pas mémoriser un échec : le prochain appel doit pouvoir réessayer.
	entry.promise.catch(() => {
		const i = entries.indexOf(entry);
		if (i >= 0) entries.splice(i, 1);
	});

	entries.push(entry);
	while (entries.length > MAX_ENTRIES) {
		scheduleDestroy(entries.shift()!);
	}

	return entry.promise;
}

/** Évince un fichier du cache (ex. un modèle PDF remplacé par un autre). */
export function evictPreparedPDF(file: File): void {
	for (let i = entries.length - 1; i >= 0; i--) {
		if (entries[i].file === file) scheduleDestroy(entries.splice(i, 1)[0]);
	}
}
