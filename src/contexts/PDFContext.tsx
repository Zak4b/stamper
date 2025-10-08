import { useState, ReactNode, createContext } from "react";
import { StampPosition } from "../lib/pdfStamper";
import { Rectangle } from "tesseract.js";

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
	loadedPDFs: File[];
	addPDF: (file: File) => void;
	removePDF: (file: File) => void;
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
	const [loadedPDFs, setLoadedPDFs] = useState<File[]>([]);
	const [options, setOptions] = useState<Options>({
		ocrPageNumber: 0,
		stampPosition: null,
	});

	const updateOptions = (updates: Partial<Options>) => {
		setOptions((prev) => ({ ...prev, ...updates }));
	};

	const addPDF = (file: File) => {
		setLoadedPDFs((prev) => {
			if (prev.find((pdf) => pdf.name === file.name)) {
				return prev;
			}
			return [...prev, file];
		});
	};

	const removePDF = (file: File) => {
		setLoadedPDFs((prev) => prev.filter((pdf) => pdf !== file));
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
		addPDF,
		removePDF,
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
