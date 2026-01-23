// Polyfill pour __filename et __dirname en ES modules
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

if (typeof global.__filename === 'undefined') {
  global.__filename = fileURLToPath(import.meta.url);
}
if (typeof global.__dirname === 'undefined') {
  global.__dirname = dirname(global.__filename);
}
