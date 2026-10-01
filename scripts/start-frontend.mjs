import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const config = {
  VITE_API_URL: process.env.VITE_API_URL || '/api',
};

writeFileSync(
  resolve('dist/runtime-config.js'),
  `window.__APP_CONFIG__ = ${JSON.stringify(config)};\n`,
);
