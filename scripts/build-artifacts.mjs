#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pyScript = path.join(__dirname, 'build-artifacts.py');

const res = spawnSync('python3', [pyScript, ...process.argv.slice(2)], {
  stdio: 'inherit'
});

if (res.error) {
  console.error('Failed to run Python build script:', res.error);
  process.exit(1);
}

process.exit(res.status ?? 0);
