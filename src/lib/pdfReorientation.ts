import { PDFDocument, degrees } from "pdf-lib";

export interface PDFOrientation {
	isAnomalous: boolean;
	originalWidth: number;
	originalHeight: number;
	correctedRotation: number;
	needsReorientation: boolean;
}

/**
 * Détecte si un PDF a des anomalies d'orientation
 */
export async function detectPDFAnomalies(pdfBytes: Uint8Array): Promise<PDFOrientation[]> {
	const pdfDoc = await PDFDocument.load(pdfBytes);
	const pages = pdfDoc.getPages();

	const orientations: PDFOrientation[] = [];

	for (const page of pages) {
		const width = page.getWidth();
		const height = page.getHeight();
		const rotation = page.getRotation().angle;

		const isAnomalous = detectAnomalousOrientation(width, height, rotation);

		let correctedRotation = 0;
		let needsReorientation = false;

		if (isAnomalous) {
			// Calculer la rotation nécessaire pour corriger l'anomalie
			if (width > height && (rotation === 90 || rotation === 270)) {
				// Document paysage avec rotation portrait -> besoin de correction
				correctedRotation = rotation === 90 ? -90 : 90;
				needsReorientation = true;
			} else if (height > width && (rotation === 0 || rotation === 180)) {
				// Document portrait avec rotation paysage -> besoin de correction
				correctedRotation = 90;
				needsReorientation = true;
			}
		}

		orientations.push({
			isAnomalous,
			originalWidth: width,
			originalHeight: height,
			correctedRotation,
			needsReorientation,
		});
	}

	return orientations;
}

/**
 * Détecte si une page a une orientation anormale
 */
function detectAnomalousOrientation(width: number, height: number, rotation: number): boolean {
	const isA4Landscape = Math.abs(width - 841) < 5 && Math.abs(height - 595) < 5;
	const isA4Portrait = Math.abs(width - 595) < 5 && Math.abs(height - 841) < 5;

	// Cas 1: Dimensions A4 paysage avec rotation portrait
	if (isA4Landscape && (Math.abs(rotation) === 90 || Math.abs(rotation) === 270)) {
		return true;
	}

	// Cas 2: Dimensions A4 portrait avec rotation paysage
	if (isA4Portrait && (Math.abs(rotation) === 90 || Math.abs(rotation) === 270)) {
		return true;
	}

	// Autres formats (Letter, etc.)
	const isLetterLandscape = Math.abs(width - 792) < 5 && Math.abs(height - 612) < 5;
	const isLetterPortrait = Math.abs(width - 612) < 5 && Math.abs(height - 792) < 5;

	if ((isLetterLandscape || isLetterPortrait) && (Math.abs(rotation) === 90 || Math.abs(rotation) === 270)) {
		return true;
	}

	// Détection générale basée sur le ratio d'aspect
	const aspectRatio = width / height;
	const rotationSuggestsPortrait = Math.abs(rotation) === 90 || Math.abs(rotation) === 270;

	// Si document très paysage (ratio > 1.3) avec rotation portrait
	if (aspectRatio > 1.3 && rotationSuggestsPortrait) {
		return true;
	}

	// Si document très portrait (ratio < 0.7) avec rotation paysage
	if (aspectRatio < 0.7 && !rotationSuggestsPortrait && (rotation === 0 || rotation === 180)) {
		return true;
	}

	return false;
}

/**
 * Crée un nouveau PDF avec le contenu réorienté correctement
 */
export async function reorientPDF(pdfBytes: Uint8Array): Promise<Uint8Array> {
	try {
		console.log("Début de la réorientation PDF...");
		const sourcePdf = await PDFDocument.load(pdfBytes);
		console.log(`PDF source chargé avec ${sourcePdf.getPageCount()} pages`);

		const orientations = await detectPDFAnomalies(pdfBytes);
		console.log("Anomalies détectées:", orientations);

		// Si aucune page n'a besoin de réorientation, retourner le PDF original
		if (!orientations.some((o) => o.needsReorientation)) {
			console.log("Aucune réorientation nécessaire, retour du PDF original");
			return pdfBytes;
		}

		const newPdf = await PDFDocument.create();
		const sourcePages = sourcePdf.getPages();

		// Copier les pages une par une pour éviter les problèmes
		for (let i = 0; i < sourcePages.length; i++) {
			const sourcePage = sourcePages[i];
			const orientation = orientations[i];

			console.log(`Traitement de la page ${i + 1}...`);

			if (orientation.needsReorientation) {
				console.log(`Page ${i + 1}: Réorientation nécessaire (rotation ${orientation.correctedRotation}°)`);

				// Créer une nouvelle page avec les bonnes dimensions
				const originalWidth = sourcePage.getWidth();
				const originalHeight = sourcePage.getHeight();

				// Déterminer les nouvelles dimensions après réorientation
				let newWidth = originalWidth;
				let newHeight = originalHeight;

				// Si on corrige une anomalie paysage->portrait ou portrait->paysage
				if (Math.abs(orientation.correctedRotation) === 90) {
					newWidth = originalHeight;
					newHeight = originalWidth;
				}

				console.log(`Dimensions originales: ${originalWidth}×${originalHeight}, nouvelles: ${newWidth}×${newHeight}`);

				const newPage = newPdf.addPage([newWidth, newHeight]);

				// Copier et dessiner la page source
				try {
					const [embeddedPage] = await newPdf.embedPages([sourcePage]);

					// Calculer la position selon la rotation
					const rotationAngle = orientation.correctedRotation;
					let x = 0;
					let y = 0;

					switch (rotationAngle) {
						case 90:
							x = originalHeight;
							y = 0;
							break;
						case -90:
						case 270:
							x = 0;
							y = originalWidth;
							break;
						case 180:
							x = originalWidth;
							y = originalHeight;
							break;
						default:
							x = 0;
							y = 0;
							break;
					}

					newPage.drawPage(embeddedPage, {
						x: x,
						y: y,
						rotate: degrees(rotationAngle),
					});

					console.log(`Page ${i + 1}: Réorientation appliquée avec succès`);
				} catch (embedError) {
					console.error(`Erreur lors de l'embedding de la page ${i + 1}:`, embedError);
					// Fallback: copier la page sans réorientation
					newPdf.addPage([originalWidth, originalHeight]);
					console.log(`Page ${i + 1}: Fallback - copie sans réorientation`);
				}
			} else {
				console.log(`Page ${i + 1}: Copie sans modification`);

				// Copier la page telle quelle
				try {
					const [embeddedPage] = await newPdf.embedPages([sourcePage]);
					const newPage = newPdf.addPage([sourcePage.getWidth(), sourcePage.getHeight()]);

					newPage.drawPage(embeddedPage, {
						x: 0,
						y: 0,
					});

					console.log(`Page ${i + 1}: Copiée avec succès`);
				} catch (embedError) {
					console.error(`Erreur lors de la copie de la page ${i + 1}:`, embedError);
					// Créer une page vide en fallback
					newPdf.addPage([sourcePage.getWidth(), sourcePage.getHeight()]);
				}
			}
		}

		console.log("Sauvegarde du nouveau PDF...");
		const result = await newPdf.save();
		console.log(`PDF réorienté créé avec succès (${result.length} bytes)`);
		return result;
	} catch (error) {
		console.error("Erreur lors de la réorientation PDF:", error);
		// En cas d'erreur, retourner le PDF original
		console.log("Retour du PDF original en raison d'une erreur");
		return pdfBytes;
	}
}

/**
 * Vérifie si un PDF a besoin d'être réorienté
 */
export async function needsReorientation(pdfBytes: Uint8Array): Promise<boolean> {
	const orientations = await detectPDFAnomalies(pdfBytes);
	return orientations.some((orientation) => orientation.needsReorientation);
}
