import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import * as dbModule from './databaseService';
import './polyfill';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Éviter que l'app démarre plusieurs fois
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      sandbox: false, // Nécessaire pour pdf-lib et autres opérations
    },
    title: 'PDF Stamper',
    backgroundColor: '#ffffff',
    show: false,
    autoHideMenuBar: true, // Masquer la barre de menus (File, Edit, View, etc.)
  });

  // Afficher la fenêtre quand elle est prête
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Configurer les headers pour WASM et SharedArrayBuffer
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Cross-Origin-Embedder-Policy': ['require-corp'],
        'Cross-Origin-Opener-Policy': ['same-origin'],
      },
    });
  });

  // Charger l'app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// Initialiser l'app
app.whenReady().then(() => {
  // Initialiser la base de données
  try {
    dbModule.initDatabase();
  } catch (error) {
    console.error('✗ Erreur lors de l\'initialisation de la DB:', error);
  }
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quitter l'app quand toutes les fenêtres sont fermées (sauf sur macOS)
app.on('window-all-closed', () => {
  dbModule.closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Gestionnaires IPC pour la base de données
ipcMain.handle('db:getAll', async () => {
  try {
    return dbModule.getAllDossiers();
  } catch (error) {
    console.error('Erreur db:getAll:', error);
    throw error;
  }
});

ipcMain.handle('db:getByNumero', async (_, numero: string) => {
  try {
    return dbModule.getDossierByNumero(numero);
  } catch (error) {
    console.error('Erreur db:getByNumero:', error);
    throw error;
  }
});

ipcMain.handle('db:insert', async (_, numero: string, valeur: string) => {
  try {
    return dbModule.insertDossier(numero, valeur);
  } catch (error) {
    console.error('Erreur db:insert:', error);
    throw error;
  }
});

ipcMain.handle('db:update', async (_, numero: string, valeur: string) => {
  try {
    return dbModule.updateDossier(numero, valeur);
  } catch (error) {
    console.error('Erreur db:update:', error);
    throw error;
  }
});

ipcMain.handle('db:delete', async (_, numero: string) => {
  try {
    return dbModule.deleteDossier(numero);
  } catch (error) {
    console.error('Erreur db:delete:', error);
    throw error;
  }
});

ipcMain.handle('db:deleteAll', async () => {
  try {
    return dbModule.deleteAllDossiers();
  } catch (error) {
    console.error('Erreur db:deleteAll:', error);
    throw error;
  }
});

ipcMain.handle('db:search', async (_, query: string) => {
  try {
    return dbModule.searchDossiers(query);
  } catch (error) {
    console.error('Erreur db:search:', error);
    throw error;
  }
});

ipcMain.handle('db:import', async (_, dossiers: Array<{ numero_dossier: string; valeur_tampon: string }>) => {
  try {
    return dbModule.importDossiers(dossiers);
  } catch (error) {
    console.error('Erreur db:import:', error);
    throw error;
  }
});

ipcMain.handle('db:getStats', async () => {
  try {
    return dbModule.getDatabaseStats();
  } catch (error) {
    console.error('Erreur db:getStats:', error);
    throw error;
  }
});

// Gestionnaires IPC (si nécessaire pour des opérations natives)
ipcMain.handle('app:getVersion', () => {
  // Lire la version depuis package.json
  const packagePath = path.join(__dirname, '../package.json');
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    return packageJson.version || '1.0.0';
  } catch (error) {
    console.error('Erreur lors de la lecture de package.json:', error);
    return '1.0.0';
  }
});

ipcMain.handle('app:getPath', (_, name: string) => {
  return app.getPath(name as any);
});

ipcMain.handle('app:openExternal', (_, url: string) => {
  shell.openExternal(url);
});

// Lire un fichier et retourner un ArrayBuffer
ipcMain.handle('app:readFile', async (_, filePath: string) => {
  // Résoudre le chemin relatif depuis le dossier de l'app
  const appPath = app.getAppPath();
  const fullPath = path.join(appPath, filePath);
  
  console.log('Reading file:', fullPath);
  const buffer = await fs.promises.readFile(fullPath);
  return buffer.buffer;
});
