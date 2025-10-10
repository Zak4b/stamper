import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		viteStaticCopy({
			targets: [
				// Copier les fichiers Tesseract WASM depuis node_modules
				{
					src: "node_modules/tesseract.js-core/tesseract-core.wasm.js",
					dest: "tesseract",
				},
				{
					src: "node_modules/tesseract.js-core/tesseract-core.wasm",
					dest: "tesseract",
				},
				{
					src: "node_modules/tesseract.js-core/tesseract-core-simd.wasm",
					dest: "tesseract",
				},
				// Copier le worker depuis tesseract.js
				{
					src: "node_modules/tesseract.js/dist/worker.min.js",
					dest: "tesseract",
				},
				// Copier les fichiers SQL.js WASM depuis node_modules
				{
					src: "node_modules/sql.js/dist/sql-wasm.js",
					dest: "sql.js",
				},
				{
					src: "node_modules/sql.js/dist/sql-wasm.wasm",
					dest: "sql.js",
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
