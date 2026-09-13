import { create } from "zustand";
import { StampPosition } from "../lib/pdfStamper";
import { Rectangle } from "tesseract.js";
import { type PDFFile } from "../types/PDFFile";
import { type Step } from "../types/Step";
import { evictPreparedPDF } from "../lib/pdfDocumentCache";

export interface PDFOptions {
	ocrRegion?: Rectangle;
	ocrPageNumber: number;
	stampPosition: StampPosition | null;
}

type PDFStore = {
	// Navigation
	currentStep: Step;
	setCurrentStep: (step: Step) => void;

	// PDF files
	samplePDF: File | null;
	setSamplePDF: (file: File | null) => void;
	loadedPDFs: PDFFile[];
	addPDFs: (files: PDFFile[]) => void;
	updatePDF: (index: number, updates: Partial<PDFFile>) => void;
	clearPDFs: () => void;

	// Options
	options: PDFOptions;
	updateOptions: (updates: Partial<PDFOptions>) => void;
	setRegionOCR: (region: Rectangle | undefined) => void;
	setPageOCR: (pageNumber: number) => void;
	setStampPos: (position: StampPosition) => void;
};

export const usePDFStore = create<PDFStore>((set) => ({
	currentStep: "database",
	samplePDF: null,
	loadedPDFs: [],
	options: {
		ocrPageNumber: 0,
		stampPosition: null,
	},

	setCurrentStep: (step) => set({ currentStep: step }),

	// Charger un modèle PDF enchaîne directement sur la sélection de la zone OCR
	setSamplePDF: (file) =>
		set((state) => {
			// L'ancien modèle ne sera plus affiché : libérer son document pdf.js.
			if (state.samplePDF && state.samplePDF !== file) evictPreparedPDF(state.samplePDF);
			return { samplePDF: file, currentStep: "ocr-region" };
		}),

	addPDFs: (files) => set((state) => ({ loadedPDFs: [...state.loadedPDFs, ...files] })),

	updatePDF: (index, updates) =>
		set((state) => {
			const current = state.loadedPDFs[index];
			if (!current) return state;
			const loadedPDFs = [...state.loadedPDFs];
			loadedPDFs[index] = { ...current, ...updates };
			return { loadedPDFs };
		}),

	clearPDFs: () => set({ loadedPDFs: [] }),

	updateOptions: (updates) => set((state) => ({ options: { ...state.options, ...updates } })),

	setRegionOCR: (region) => set((state) => ({ options: { ...state.options, ocrRegion: region } })),

	setPageOCR: (pageNumber) => set((state) => ({ options: { ...state.options, ocrPageNumber: pageNumber } })),

	setStampPos: (position) => set((state) => ({ options: { ...state.options, stampPosition: position } })),
}));
