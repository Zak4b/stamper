import { createWorker, Worker, ImageLike } from "tesseract.js";

export interface OCRTask {
	id: string;
	imageData: ImageLike;
	onProgress?: (progress: number) => void;
	resolve: (result: { text: string; confidence: number }) => void;
	reject: (error: Error) => void;
}

export interface WorkerManagerEvents {
	workerCreated: () => void;
	workerDestroyed: () => void;
	taskStarted: (taskId: string) => void;
	taskCompleted: (taskId: string) => void;
	taskFailed: (taskId: string, error: Error) => void;
}

export class OCRWorkerManager {
	private worker: Worker | null = null;
	private taskQueue: OCRTask[] = [];
	private isProcessing = false;
	private destroyTimeout: NodeJS.Timeout | null = null;
	private readonly DESTROY_DELAY = 5000; // 5 secondes

	// Singleton instance
	private static instance: OCRWorkerManager | null = null;

	public static getInstance(): OCRWorkerManager {
		if (!OCRWorkerManager.instance) {
			OCRWorkerManager.instance = new OCRWorkerManager();
		}
		return OCRWorkerManager.instance;
	}

	// Ajouter une tâche OCR à la file
	public addTask(imageData: ImageLike, onProgress?: (progress: number) => void): Promise<{ text: string; confidence: number }> {
		return new Promise((resolve, reject) => {
			const task: OCRTask = {
				id: `ocr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				imageData,
				onProgress,
				resolve,
				reject,
			};

			// Annuler le timeout de destruction si une nouvelle tâche arrive
			if (this.destroyTimeout) {
				clearTimeout(this.destroyTimeout);
				this.destroyTimeout = null;
			}

			this.taskQueue.push(task);
			this.processQueue();
		});
	}

	// Traitement de la file d'attente
	private async processQueue(): Promise<void> {
		if (this.isProcessing || this.taskQueue.length === 0) {
			return;
		}

		this.isProcessing = true;

		// Créer le worker si nécessaire
		if (!this.worker) {
			await this.createWorker();
		}

		// Traiter toutes les tâches dans la file
		while (this.taskQueue.length > 0) {
			const task = this.taskQueue.shift()!;
			await this.processTask(task);
		}

		// Programmer la destruction du worker après un délai d'inactivité
		this.scheduleWorkerDestruction();
		this.isProcessing = false;
	}

	// Programmer la destruction du worker après un délai d'inactivité
	private scheduleWorkerDestruction(): void {
		// Annuler le timeout précédent s'il existe
		if (this.destroyTimeout) {
			clearTimeout(this.destroyTimeout);
		}

		// Programmer la destruction du worker après 5 secondes
		this.destroyTimeout = setTimeout(async () => {
			if (this.taskQueue.length === 0 && !this.isProcessing && this.worker) {
				await this.destroyWorker();
			}
			this.destroyTimeout = null;
		}, this.DESTROY_DELAY);
	}

	// Créer le worker Tesseract
	private async createWorker(): Promise<void> {
		try {
			console.debug("Création du worker Tesseract...");
			this.worker = await createWorker("fra", 1, {
				workerPath: "/tesseract/worker.min.js",
				langPath: "/tesseract",
				corePath: "/tesseract/tesseract-core.wasm.js",
			});
		} catch (error) {
			console.error("Erreur lors de la création du worker:", error);
			throw error;
		}
	}

	// Détruire le worker
	private async destroyWorker(): Promise<void> {
		if (this.worker) {
			await this.worker.terminate();
			this.worker = null;

			if (this.destroyTimeout) {
				clearTimeout(this.destroyTimeout);
				this.destroyTimeout = null;
			}
		}
	}

	// Traiter une tâche individuelle
	private async processTask(task: OCRTask): Promise<void> {
		if (!this.worker) {
			task.reject(new Error("Worker non disponible"));
			return;
		}

		try {
			if (task.onProgress) {
				this.worker.setParameters({
					logger: (m: { status: string; progress: number }) => {
						if (m.status === "recognizing text" && task.onProgress) {
							task.onProgress(m.progress * 100);
						}
					},
				});
			}

			const { data } = await this.worker.recognize(task.imageData);

			task.resolve({
				text: data.text,
				confidence: data.confidence,
			});
		} catch (error) {
			console.error(`Erreur lors du traitement de la tâche ${task.id}:`, error);
			task.reject(error as Error);
		}
	}

	// Obtenir le statut du gestionnaire
	public getStatus(): {
		isProcessing: boolean;
		queueLength: number;
		hasWorker: boolean;
	} {
		return {
			isProcessing: this.isProcessing,
			queueLength: this.taskQueue.length,
			hasWorker: this.worker !== null,
		};
	}

	// Nettoyer toutes les tâches en attente
	public clearQueue(): void {
		this.taskQueue.forEach((task) => {
			task.reject(new Error("Tâche annulée"));
		});
		this.taskQueue = [];
	}

	// Méthode pour cleanup complet (utile pour les tests)
	public async cleanup(): Promise<void> {
		// Annuler le timeout de destruction
		if (this.destroyTimeout) {
			clearTimeout(this.destroyTimeout);
			this.destroyTimeout = null;
		}

		this.clearQueue();
		await this.destroyWorker();
		this.isProcessing = false;
	}
}

// Export de l'instance singleton
export const ocrWorkerManager = OCRWorkerManager.getInstance();
