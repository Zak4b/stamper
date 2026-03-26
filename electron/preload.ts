import { contextBridge, ipcRenderer } from 'electron';

type UpdaterState = {
  stage: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error' | 'disabled';
  message: string;
  progress: number | null;
  version: string | null;
};

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

  updater: {
    getState: () => ipcRenderer.invoke('updater:getState') as Promise<UpdaterState>,
    checkForUpdates: () => ipcRenderer.invoke('updater:checkForUpdates') as Promise<UpdaterState>,
    installUpdate: () => ipcRenderer.invoke('updater:installUpdate') as Promise<boolean>,
    onStatus: (callback: (state: UpdaterState) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: UpdaterState) => callback(payload);
      ipcRenderer.on('updater:status', listener);
      return () => ipcRenderer.removeListener('updater:status', listener);
    },
  },
  
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
