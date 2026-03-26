/// <reference types="vite/client" />

// Types pour l'API Electron
interface ElectronAPI {
  updater: {
    getState: () => Promise<{
      stage: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error' | 'disabled';
      message: string;
      progress: number | null;
      version: string | null;
    }>;
    checkForUpdates: () => Promise<{
      stage: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error' | 'disabled';
      message: string;
      progress: number | null;
      version: string | null;
    }>;
    installUpdate: () => Promise<boolean>;
    onStatus: (callback: (state: {
      stage: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error' | 'disabled';
      message: string;
      progress: number | null;
      version: string | null;
    }) => void) => () => void;
  };
  getVersion: () => Promise<string>;
  getPath: (name: string) => Promise<string>;
  readFile: (filePath: string) => Promise<ArrayBuffer>;
  openExternal: (url: string) => Promise<void>;
  db: {
    getAll: () => Promise<any[]>;
    getByNumero: (numero: string) => Promise<any>;
    insert: (numero: string, valeur: string) => Promise<any>;
    update: (numero: string, valeur: string) => Promise<any>;
    delete: (numero: string) => Promise<any>;
    deleteAll: () => Promise<any>;
    search: (query: string) => Promise<any[]>;
    import: (dossiers: Array<{ numero_dossier: string; valeur_tampon: string }>) => Promise<any>;
    getStats: () => Promise<{ totalDossiers: number; dbPath: string }>;
  };
  platform: NodeJS.Platform;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};
