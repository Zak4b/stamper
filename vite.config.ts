import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	optimizeDeps: {
		include: ["lucide-react"],
	},
	server: {
		headers: {
			"Cross-Origin-Embedder-Policy": "require-corp",
			"Cross-Origin-Opener-Policy": "same-origin",
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					// Séparer les gros modules en chunks distincts
					"pdf-lib": ["pdf-lib"],
					tesseract: ["tesseract.js"],
					jszip: ["jszip"],
					pdfjs: ["pdfjs-dist"],
					// Grouper les composants par fonctionnalité
					database: ["./src/lib/database.ts", "./src/components/DatabaseManager.tsx"],
					ocr: ["./src/lib/ocrHelper.ts", "./src/components/OCRRegionSelector.tsx"],
					stamping: ["./src/lib/pdfStamper.ts", "./src/components/StampPositionSelector.tsx"],
					batch: ["./src/components/BatchStamper.tsx"],
				},
			},
		},
		// Optimiser la taille des chunks
		chunkSizeWarningLimit: 1000,
	},
});
