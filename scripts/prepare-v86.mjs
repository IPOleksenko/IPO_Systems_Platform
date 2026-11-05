import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, copyFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const output = path.join(root, 'public', 'emulator');
const downloads = path.join(root, 'public', 'downloads');
const v86PatchPath = path.join(root, 'patches', 'v86-mtrr.patch');
const v86Package = JSON.parse(
  await readFile(path.join(root, 'node_modules', 'v86', 'package.json'), 'utf8')
);
const v86Revision = '315b2b0b758703ef0e6cc7b4088d6068f83f3c20';
const v86Source = `https://raw.githubusercontent.com/copy/v86/${v86Revision}`;
const patch = (await readFile(v86PatchPath, 'utf8')).replace(/\r\n/g, '\n');
const patchSha256 = createHash('sha256').update(patch).digest('hex');
const v86CacheName = process.platform === 'win32' ? 'v86-source-wsl' : 'v86-source';
const v86SourceDir = path.join(
  root,
  '.cache',
  `${v86CacheName}-${v86Revision.slice(0, 12)}-${patchSha256.slice(0, 12)}`
);

await mkdir(output, { recursive: true });
const applicationManifest = path.join(root, '.cache', 'applications.json');
runProjectPythonScript('prepare-applications.py', ['--manifest', applicationManifest]);
runProjectPythonScript('prepare-installed-disk.py', [
  '--output',
  output,
  '--os-image',
  path.join(downloads, 'IPO_OS.img'),
  '--application-manifest',
  applicationManifest,
]);
await rm(path.join(output, 'applications.json'), { force: true });
await rm(path.join(output, 'application-assets'), { recursive: true, force: true });
await rm(path.join(output, 'IPO_OS.img'), { force: true });

const cachedPatchPath = path.join(root, '.cache', 'v86-mtrr.patch');
await mkdir(path.dirname(cachedPatchPath), { recursive: true });
await writeFile(cachedPatchPath, patch);

function run(command, args, options = {}) {
  execFileSync(command, args, { stdio: 'inherit', ...options });
}

function runProjectPythonScript(name, args) {
  const script = path.join(root, 'scripts', name);
  if (process.platform !== 'win32') {
    run(process.env.PYTHON ?? 'python3', [script, ...args]);
    return;
  }

  const rootMatch = root.match(/^([A-Za-z]):\\(.*)$/);
  if (!rootMatch) throw new Error(`Cannot map the project path into WSL: ${root}`);
  const rootInWsl = `/mnt/${rootMatch[1].toLowerCase()}/${rootMatch[2].replaceAll('\\', '/')}`;
  const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`;
  const toWslPath = (value) => {
    const match = value.match(/^([A-Za-z]):\\(.*)$/);
    if (!match) return value;
    return `/mnt/${match[1].toLowerCase()}/${match[2].replaceAll('\\', '/')}`;
  };
  run('wsl.exe', [
    'bash',
    '-lc',
    `python3 ${quote(`${rootInWsl}/scripts/${name}`)} ${args.map((arg) => quote(toWslPath(arg))).join(' ')}`,
  ]);
}

function shellQuote(value) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

async function hasPatchAdditions(sourceDir, patchText) {
  const additions = [];
  let filename;
  let lines = [];
  let inHunk = false;
  const saveAddition = () => {
    if (filename && lines.length) additions.push({ filename, text: lines.join('\n') });
    lines = [];
  };

  for (const line of patchText.split('\n')) {
    if (line.startsWith('diff --git ')) {
      saveAddition();
      filename = line.split(' ')[3]?.slice(2);
      inHunk = false;
    } else if (line.startsWith('@@')) {
      saveAddition();
      inHunk = true;
    } else if (inHunk && line.startsWith('+') && !line.startsWith('+++')) {
      lines.push(line.slice(1));
    } else if (inHunk) {
      saveAddition();
    }
  }
  saveAddition();
  if (additions.length === 0) return false;

  const sourceFiles = new Map();
  for (const addition of additions) {
    if (!sourceFiles.has(addition.filename)) {
      sourceFiles.set(
        addition.filename,
        (await readFile(path.join(sourceDir, addition.filename), 'utf8')).replace(/\r\n/g, '\n'),
      );
    }
    if (!sourceFiles.get(addition.filename).includes(addition.text)) return false;
  }
  return true;
}

async function buildPatchedV86() {
  if (process.platform === 'win32') {
    const rootMatch = root.match(/^([A-Za-z]):\\(.*)$/);
    if (!rootMatch) throw new Error(`Cannot map the project path into WSL: ${root}`);
    const rootInWsl = `/mnt/${rootMatch[1].toLowerCase()}/${rootMatch[2].replaceAll('\\', '/')}`;
    const sourceInWsl = `${rootInWsl}/.cache/${path.basename(v86SourceDir)}`;
    const patchInWsl = `${rootInWsl}/.cache/v86-mtrr.patch`;
    const javaShimDirPath = path.join(root, '.cache', `v86-java-bin-${process.pid}`);
    const javaShimDirInWsl = `${rootInWsl}/.cache/v86-java-bin-${process.pid}`;
    const javaShimPath = path.join(javaShimDirPath, 'java');
    const buildScriptPath = path.join(root, '.cache', `v86-build-${process.pid}.sh`);
    const buildScriptInWsl = `${rootInWsl}/.cache/v86-build-${process.pid}.sh`;
    const javaShim = shellQuote(`${javaShimDirInWsl}/java`);
    const source = shellQuote(sourceInWsl);
    const patchFile = shellQuote(patchInWsl);
    if (!existsSync(path.join(v86SourceDir, '.git'))) {
      run('wsl.exe', [
        'bash',
        '-lc',
        `git clone --filter=blob:none --no-checkout https://github.com/copy/v86.git ${source}`,
      ]);
      run('wsl.exe', ['bash', '-lc', `git -C ${source} checkout --detach ${v86Revision}`]);
    }
    const patchAlreadyApplied = await hasPatchAdditions(v86SourceDir, patch);
    const commands = [
      'set -e',
      `test "$(git -C ${source} rev-parse HEAD)" = ${v86Revision}`,
      patchAlreadyApplied
        ? `echo ${shellQuote('[v86] Compatibility patch already present in cached source.')}`
        : `if git -C ${source} apply --reverse --recount --check ${patchFile} 2>/dev/null; then :; else git -C ${source} apply --recount --check ${patchFile} && git -C ${source} apply --recount ${patchFile}; fi`,
      `chmod +x ${javaShim}`,
      `PATH=${shellQuote(javaShimDirInWsl)}:$PATH make -C ${source} build/libv86.mjs build/v86.wasm build/v86-fallback.wasm`,
    ].join('\n');
    await mkdir(javaShimDirPath, { recursive: true });
    await writeFile(javaShimPath, '#!/bin/sh\nexec java.exe "$@"\n');
    await writeFile(buildScriptPath, `${commands}\n`);
    try {
      run('wsl.exe', ['bash', '-lc', `source ${shellQuote(buildScriptInWsl)}`]);
    } finally {
      await rm(javaShimDirPath, { recursive: true, force: true });
      await rm(buildScriptPath, { force: true });
    }
  } else {
    if (!existsSync(path.join(v86SourceDir, '.git'))) {
      run('git', ['clone', '--filter=blob:none', '--no-checkout', 'https://github.com/copy/v86.git', v86SourceDir]);
      run('git', ['checkout', '--detach', v86Revision], { cwd: v86SourceDir });
    }

    const revision = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: v86SourceDir,
      encoding: 'utf8',
    }).trim();
    if (revision !== v86Revision) {
      throw new Error(`Unexpected v86 source revision ${revision}; expected ${v86Revision}.`);
    }

    if (!(await hasPatchAdditions(v86SourceDir, patch))) {
      try {
        execFileSync('git', ['apply', '--reverse', '--recount', '--check', cachedPatchPath], {
          cwd: v86SourceDir,
          stdio: 'ignore',
        });
      } catch {
        run('git', ['apply', '--recount', '--check', cachedPatchPath], { cwd: v86SourceDir });
        run('git', ['apply', '--recount', cachedPatchPath], { cwd: v86SourceDir });
      }
    }
    run('make', ['build/libv86.mjs', 'build/v86.wasm', 'build/v86-fallback.wasm'], { cwd: v86SourceDir });
  }
}

await buildPatchedV86();
for (const name of ['libv86.mjs', 'v86.wasm', 'v86-fallback.wasm']) {
  const sourcePath = path.join(v86SourceDir, 'build', name);
  const data = await readFile(sourcePath);
  if (data.length === 0) throw new Error(`Patched v86 build produced an empty ${name}.`);
  await copyFile(sourcePath, path.join(output, name));
}
await copyFile(
  path.join(root, 'node_modules', 'v86', 'LICENSE'),
  path.join(output, 'COPYING.v86')
);

const files = {};
for (const [filename, expectedSize] of [
  ['ipo-boot-rom-1m.bin', 1024 * 1024],
  ['ipo-firmware.bin', 256 * 1024],
]) {
  const imagePath = path.join(output, filename);
  const data = await readFile(imagePath);
  if (data.length !== expectedSize) {
    throw new Error(`${imagePath} has ${data.length} bytes; expected the complete ${expectedSize}-byte ROM image.`);
  }
  if (filename === 'ipo-boot-rom-1m.bin') {
    if (!data.subarray(0xF0000, 0xF8000).every((byte) => byte === 0xFF)) {
      throw new Error(`${imagePath} contains a firmware payload; Boot ROM and firmware must remain separate.`);
    }
    if (!data.subarray(0xFFFF0, 0xFFFF5).equals(Buffer.from([0xEA, 0x00, 0x80, 0x00, 0xF0]))) {
      throw new Error(`${imagePath} has an unexpected IPO_Boot_ROM reset vector.`);
    }
  } else if (!data.subarray(0x30000, 0x30003).equals(Buffer.from('IPO'))) {
    throw new Error(`${imagePath} is not a complete standalone IPO_Firmware ROM image.`);
  }
  files[filename] = {
    size: data.length,
    sha256: createHash('sha256').update(data).digest('hex'),
  };
}

const osPath = path.join(downloads, 'IPO_OS.img');
const osDisk = await readFile(osPath);
if (osDisk[510] !== 0x55 || osDisk[511] !== 0xAA) {
  throw new Error(`${osPath} is not a bootable IPO_OS image.`);
}
const installedDiskPath = path.join(output, 'disk-installed.img');
const installedDisk = await readFile(installedDiskPath);
const diskCapacity = osDisk.readUInt32LE(0x1BE + 8) + osDisk.readUInt32LE(0x1BE + 12);
if (installedDisk.length !== diskCapacity * 512) {
  throw new Error(`${installedDiskPath} does not match the disk capacity declared by IPO_OS.`);
}
files['disk-installed.img'] = {
  size: installedDisk.length,
  sha256: createHash('sha256').update(installedDisk).digest('hex'),
};

for (const [source, destination] of [
  ['bios/vgabios.bin', 'vgabios.bin'],
  ['bios/COPYING.LESSER', 'COPYING.LESSER'],
]) {
  const response = await fetch(`${v86Source}/${source}`);
  if (!response.ok) {
    throw new Error(`Failed to download ${source} from v86: HTTP ${response.status}`);
  }
  const data = Buffer.from(await response.arrayBuffer());
  if (data.length === 0) {
    throw new Error(`Downloaded empty v86 asset: ${source}`);
  }
  const digest = createHash('sha256').update(data).digest('hex');
  await writeFile(path.join(output, destination), data);
  console.log(`[v86] ${destination}: ${data.length} bytes (SHA-256 ${digest})`);
  if (destination === 'vgabios.bin') {
    files[destination] = { size: data.length, sha256: digest };
  }
}

for (const name of ['ipo-boot-rom-v86.bin', 'disk-installed.img.gz', 'seabios.bin']) {
  await rm(path.join(output, name), { force: true });
}

for (const name of ['v86.wasm', 'v86-fallback.wasm']) {
  const data = await readFile(path.join(output, name));
  files[name] = {
    size: data.length,
    sha256: createHash('sha256').update(data).digest('hex'),
  };
}

const manifest = {
  emulator: 'v86',
  v86_version: v86Package.version,
  v86_source_commit: v86Revision,
  mtrr_patch_sha256: patchSha256,
  boot_chain: ['Separate IPO_Boot_ROM', 'Separate IPO_Firmware BIOS', 'IPO_OS'],
  files,
  assets: {
    boot_rom: { url: 'emulator/ipo-boot-rom-1m.bin', ...files['ipo-boot-rom-1m.bin'] },
    firmware: { url: 'emulator/ipo-firmware.bin', ...files['ipo-firmware.bin'] },
    disk_installed: { url: 'emulator/disk-installed.img', ...files['disk-installed.img'] },
  },
};
await writeFile(path.join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`[v86] Runtime ${v86Package.version} prepared in public/emulator/.`);
