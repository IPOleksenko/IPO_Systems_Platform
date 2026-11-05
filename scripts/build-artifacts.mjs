#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pyScript = path.join(__dirname, 'build-artifacts.py');

let command = 'python3';
let args = [pyScript, ...process.argv.slice(2)];
if (process.platform === 'win32') {
  const root = path.dirname(__dirname);
  const rootMatch = root.match(/^([A-Za-z]):\\(.*)$/);
  if (!rootMatch) {
    console.error(`Cannot map the project path into WSL: ${root}`);
    process.exit(1);
  }
  const rootInWsl = `/mnt/${rootMatch[1].toLowerCase()}/${rootMatch[2].replaceAll('\\', '/')}`;
  const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`;
  command = 'wsl.exe';
  args = [
    'bash',
    '-lc',
    `python3 ${quote(`${rootInWsl}/scripts/build-artifacts.py`)} ${process.argv.slice(2).map(quote).join(' ')}`,
  ];
}

const res = spawnSync(command, args, { stdio: 'inherit' });

if (res.error) {
  console.error('Failed to run Python build script:', res.error);
  process.exit(1);
}

process.exit(res.status ?? 0);
