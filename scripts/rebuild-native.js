#!/usr/bin/env node

/**
 * Script pour recompiler better-sqlite3 pour Electron
 * Évite les problèmes avec electron-rebuild et les dépendances dépréciées
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Lire la version d'Electron depuis package.json
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
const electronVersion = packageJson.devDependencies.electron.replace('^', '');

try {
  // Définir les variables d'environnement pour node-gyp
  const env = {
    ...process.env,
    npm_config_target: electronVersion,
    npm_config_arch: process.arch,
    npm_config_target_arch: process.arch,
    npm_config_disturl: 'https://electronjs.org/headers',
    npm_config_runtime: 'electron',
    npm_config_build_from_source: 'true',
    npm_config_cache: join(rootDir, '.npm'),
    npm_config_cache_min: '86400',
  };

  // Rebuild better-sqlite3
  execSync('npm rebuild better-sqlite3 --build-from-source', {
    cwd: rootDir,
    env,
    stdio: 'inherit',
  });

} catch (error) {
  console.error('❌ Erreur lors de la recompilation:', error.message);
  // Ne pas faire échouer le postinstall si la recompilation échoue
  // (peut être que le module est déjà compilé correctement)
  process.exit(0);
}
