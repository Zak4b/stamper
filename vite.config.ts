import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import electron from "vite-plugin-electron/simple";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		electron({
			main: {
				entry: "electron/main.ts",
				vite: {
					build: {
						outDir: "dist-electron",
						rollupOptions: {
							external: ["electron", "better-sqlite3"],
						},
					},
				},
			},
			preload: {
				input: "electron/preload.ts",
				vite: {
					build: {
						outDir: "dist-electron",
						rollupOptions: {
							output: {
								format: "cjs",
								entryFileNames: "[name].cjs",
							},
						},
					},
				},
			},
		}),
		viteStaticCopy({
			targets: [
				// Variant `relaxedsimd-lstm` : LSTM seul, cohérent avec l'OEM 1 utilisé par
				// `ocrWorkerManager` (le legacy coûterait ~600 Ko de code mort).
				// Build SINGLE_FILE : le wasm est inliné en base64, le `.wasm` frère n'a
				// pas à être copié.
				{
					src: "node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js",
					dest: "tesseract",
				},
				// Modèle repris de @tesseract.js-data plutôt que figé dans `public/`.
				// Variante `4.0.0_best_int` : ~13 Mo de composants legacy en moins, que
				// l'OEM 1 n'appelle jamais ; le réseau LSTM est identique.
				{
					src: "node_modules/@tesseract.js-data/fra/4.0.0_best_int/fra.traineddata.gz",
					dest: "tesseract",
				},
				// Copier le worker depuis tesseract.js
				{
					src: "node_modules/tesseract.js/dist/worker.min.js",
					dest: "tesseract",
				},
			],
		}),
	],
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
					"pdf-lib": ["pdf-lib"],
					tesseract: ["tesseract.js"],
					jszip: ["jszip"],
					pdfjs: ["pdfjs-dist"],
				},
			},
		},
		// Optimiser la taille des chunks
		chunkSizeWarningLimit: 1000,
	},
});
