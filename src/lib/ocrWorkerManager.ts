import Tesseract, { createWorker, Worker, ImageLike } from "tesseract.js";

export interface OCRTask {
	imageData: ImageLike;
	onProgress?: (progress: number) => void;
	resolve: (result: Tesseract.Page) => void;
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
	private currentTask: OCRTask | null = null; // Référence à la tâche en cours

	// Singleton instance
	private static instance: OCRWorkerManager | null = null;

	public static getInstance(): OCRWorkerManager {
		if (!OCRWorkerManager.instance) {
			OCRWorkerManager.instance = new OCRWorkerManager();
		}
		return OCRWorkerManager.instance;
	}

	// Ajouter une tâche OCR à la file
	public addTask(imageData: ImageLike, onProgress?: (progress: number) => void): Promise<Tesseract.Page> {
		// Annuler le timeout de destruction si une nouvelle tâche arrive
		if (this.destroyTimeout) {
			clearTimeout(this.destroyTimeout);
			this.destroyTimeout = null;
		}
		return new Promise((resolve, reject) => {
			const task: OCRTask = {
				imageData,
				onProgress,
				resolve,
				reject,
			};

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
			console.debug("New worker OCR...");
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
			
			// Détection de l'environnement
			const isElectron = typeof window !== 'undefined' && window.electron !== undefined;
			
			// Configuration des chemins selon l'environnement
			const config = isElectron ? {
				// Dans Electron, utiliser des chemins relatifs
				workerPath: "./tesseract/worker.min.js",
				langPath: "./tesseract",
				corePath: "./tesseract/tesseract-core.wasm.js",
			} : {
				// Dans le navigateur, utiliser des chemins absolus
				workerPath: "/tesseract/worker.min.js",
				langPath: "/tesseract",
				corePath: "/tesseract/tesseract-core.wasm.js",
			};
			
			this.worker = await createWorker("fra", 1, {
				logger: (m: { status: string; progress: number }) => {
					// Utiliser la tâche courante pour le callback de progression
					if (m.status === "recognizing text" && this.currentTask?.onProgress) {
						this.currentTask.onProgress(m.progress * 100);
					}
				},
				...config,
			});
			
			console.debug("Worker Tesseract créé avec succès");
		} catch (error) {
			console.error("Erreur lors de la création du worker:", error);
			throw error;
		}
	}

	// Détruire le worker
	private async destroyWorker(): Promise<void> {
		if (this.worker) {
			console.debug("Destructing OCR worker...");
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
			// Définir la tâche courante pour le callback de progression
			this.currentTask = task;

			// Lancer la reconnaissance OCR
			const { data } = await this.worker.recognize(task.imageData);
			task.resolve(data);
		} catch (error) {
			console.error(`Erreur lors du traitement:`, error);
			task.reject(error as Error);
		} finally {
			// Nettoyer la référence de la tâche courante
			this.currentTask = null;
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
}

// Export de l'instance singleton
export const ocrWorkerManager = OCRWorkerManager.getInstance();
