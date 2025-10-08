import { useState, ReactNode, createContext } from "react";
import { StampPosition } from "../lib/pdfStamper";
import { Rectangle } from "tesseract.js";
import { type PDFFile } from "../types/PDFFile";

type Step = "database" | "ocr-region" | "position" | "stamping";

interface Options {
	ocrRegion?: Rectangle;
	ocrPageNumber: number;
	stampPosition: StampPosition | null;
}

interface PDFContextType {
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
	options: Options;
	updateOptions: (updates: Partial<Options>) => void;

	// Actions
	setRegionOCR: (region: Rectangle | undefined) => void;
	setPageOCR: (pageNumber: number) => void;
	setStampPos: (position: StampPosition) => void;

	// Computed properties
	canProceedToPosition: boolean;
	canStartStamping: boolean;
}

interface PDFProviderProps {
	children: ReactNode;
}

const PDFContext = createContext<PDFContextType | undefined>(undefined);

export function PDFProvider({ children }: PDFProviderProps) {
	const [currentStep, setCurrentStep] = useState<Step>("database");
	const [samplePDF, setSamplePDF] = useState<File | null>(null);
	const [loadedPDFs, setLoadedPDFs] = useState<PDFFile[]>([]);
	const [options, setOptions] = useState<Options>({
		ocrPageNumber: 0,
		stampPosition: null,
	});

	const updateOptions = (updates: Partial<Options>) => {
		setOptions((prev) => ({ ...prev, ...updates }));
	};

	// Batch PDFs functions
	const addPDFs = (files: PDFFile[]) => {
		setLoadedPDFs((prev) => [...prev, ...files]);
	};

	const updatePDF = (index: number, updates: Partial<PDFFile>) => {
		setLoadedPDFs((prev) => {
			const updated = [...prev];
			if (updated[index]) {
				updated[index] = { ...updated[index], ...updates };
			}
			return updated;
		});
	};

	const clearPDFs = () => setLoadedPDFs([]);

	// Actions
	const handleSamplePDFSelected = (file: File | null) => {
		setSamplePDF(file);
		setCurrentStep("ocr-region");
	};

	const setRegionOCR = (region: Rectangle | undefined) => {
		updateOptions({ ocrRegion: region });
	};

	const setPageOCR = (pageNumber: number) => {
		updateOptions({ ocrPageNumber: pageNumber });
	};

	const setStampPos = (position: StampPosition) => {
		updateOptions({ stampPosition: position });
	};

	// Computed properties
	const canProceedToPosition = Boolean(samplePDF && options.ocrRegion);
	const canStartStamping = Boolean(options.stampPosition);

	const value: PDFContextType = {
		// Navigation state
		currentStep,
		setCurrentStep,

		// PDF files
		samplePDF,
		setSamplePDF: handleSamplePDFSelected,
		loadedPDFs,
		addPDFs,
		updatePDF,
		clearPDFs,

		// Options
		options,
		updateOptions,

		// Actions
		setRegionOCR,
		setPageOCR,
		setStampPos,

		// Computed properties
		canProceedToPosition,
		canStartStamping,
	};

	return <PDFContext.Provider value={value}>{children}</PDFContext.Provider>;
}

// Export the context for the hook
export { PDFContext };
