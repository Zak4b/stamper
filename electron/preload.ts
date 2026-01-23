import { contextBridge, ipcRenderer } from 'electron';

// Exposer les APIs Electron au renderer process de manière sécurisée
contextBridge.exposeInMainWorld('electron', {
  // API pour obtenir la version de l'app
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  // API pour obtenir les chemins système
  getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
  
  // API pour lire un fichier
  readFile: (filePath: string) => ipcRenderer.invoke('app:readFile', filePath),
  
  // API pour ouvrir une URL externe
  openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url),
  
  // APIs de base de données
  db: {
    getAll: () => ipcRenderer.invoke('db:getAll'),
    getByNumero: (numero: string) => ipcRenderer.invoke('db:getByNumero', numero),
    insert: (numero: string, valeur: string) => ipcRenderer.invoke('db:insert', numero, valeur),
    update: (numero: string, valeur: string) => ipcRenderer.invoke('db:update', numero, valeur),
    delete: (numero: string) => ipcRenderer.invoke('db:delete', numero),
    deleteAll: () => ipcRenderer.invoke('db:deleteAll'),
    search: (query: string) => ipcRenderer.invoke('db:search', query),
    import: (dossiers: Array<{ numero_dossier: string; valeur_tampon: string }>) => 
      ipcRenderer.invoke('db:import', dossiers),
    getStats: () => ipcRenderer.invoke('db:getStats'),
  },
  
  // Vous pouvez ajouter d'autres APIs ici selon vos besoins
  platform: process.platform,
});

// Type pour TypeScript (à ajouter dans vite-env.d.ts)
export interface ElectronAPI {
  getVersion: () => Promise<string>;
  getPath: (name: string) => Promise<string>;
  readFile: (filePath: string) => Promise<ArrayBuffer>;
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
    electron: ElectronAPI;
  }
}
