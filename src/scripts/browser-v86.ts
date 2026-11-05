import type { V86 as V86Instance } from 'v86';

type Asset = {
  url: string;
  size: number;
  sha256: string;
};
type Manifest = {
  assets: {
    boot_rom: Asset;
    firmware: Asset;
    disk_installed: Asset;
  };
};
type DiskMetadata = {
  baseSha256: string;
  byteLength: number;
  chunkSize: number;
};
type PreparedMachineAssets = {
  bootRom: Uint8Array;
  firmware: Uint8Array;
  installedDisk: Uint8Array;
  diskSha256: string;
};

const root = document.querySelector<HTMLElement>('[data-v86-emulator]');
if (root) {
  const diskDatabaseName = 'ipo-os-emulator';
  const diskMetadataStoreName = 'disk-metadata';
  const diskChunkStoreName = 'disk-chunks';
  const diskSectorSize = 512;
  const diskChunkSize = 64 * 1024;
  const expectedFilesystemLba = 2048;
  const base = root.dataset.base ?? '/';
  const labels = JSON.parse(root.dataset.labels ?? '{}') as Record<string, string>;
  const status = root.querySelector<HTMLElement>('[data-status]');
  const startButton = root.querySelector<HTMLButtonElement>('[data-start]');
  const restartButton = root.querySelector<HTMLButtonElement>('[data-restart]');
  const consoleOutput = root.querySelector<HTMLElement>('[data-log-output]');
  const logCount = root.querySelector<HTMLElement>('[data-log-count]');
  const lineCountFormat = logCount?.dataset.lineCountFormat ?? 'Log lines: {count}';
  const progressWrap = root.querySelector<HTMLElement>('[data-progress-wrap]');
  const screen = root.querySelector<HTMLElement>('[data-v86-screen-container]');
  const screenViewport = root.querySelector<HTMLElement>('[data-v86-screen-viewport]');
  const fullscreenButtons = root.querySelectorAll<HTMLButtonElement>('[data-fullscreen]');
  const progressBar = root.querySelector<HTMLElement>('[data-progress]');
  const progressLabel = root.querySelector<HTMLElement>('[data-progress-label]');
  let windowedCanvasStyle: { width: string; height: string; transform: string } | undefined;
  let emulator: V86Instance | undefined;
  let preparedMachineAssets: PreparedMachineAssets | undefined;
  let restartInProgress = false;
  let serialLine = '';
  let osBooted = false;
  let activeDisk: Uint8Array | undefined;
  let activeDiskBaseSha256: string | undefined;
  let dirtyDiskChunks = new Set<number>();
  let diskDatabase: IDBDatabase | undefined;
  let diskDatabasePromise: Promise<IDBDatabase> | undefined;
  let diskSavePromise: Promise<void> | undefined;
  let diskSaveTimer: number | undefined;
  let diskSaveErrorReported = false;
  const osReadyMarker = 'Type "help" on the keyboard to view commands, shortcuts, and OS features.';

  const setStatus = (message: string) => {
    if (status) status.textContent = message;
  };

  const log = (message: string) => {
    if (!consoleOutput) return;
    consoleOutput.querySelector('.browser-v86__log-empty')?.remove();
    const line = document.createElement('div');
    line.className = 'log-line';
    line.textContent = message;
    consoleOutput.append(line);
    if (logCount) logCount.textContent = lineCountFormat.replace('{count}', String(consoleOutput.children.length));
    if (root.querySelector<HTMLInputElement>('[data-log-autoscroll]')?.checked) {
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
  };

  const openDiskDatabase = (): Promise<IDBDatabase> => {
    if (!('indexedDB' in window)) {
      return Promise.reject(new Error('This browser does not support persistent emulator disks.'));
    }
    if (!diskDatabasePromise) {
      diskDatabasePromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(diskDatabaseName, 2);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(diskMetadataStoreName)) {
            db.createObjectStore(diskMetadataStoreName);
          }
          if (!db.objectStoreNames.contains(diskChunkStoreName)) {
            db.createObjectStore(diskChunkStoreName);
          }
        };
        request.onsuccess = () => {
          diskDatabase = request.result;
          diskDatabase.onversionchange = () => diskDatabase?.close();
          resolve(request.result);
        };
        request.onerror = () => reject(request.error ?? new Error('Could not open persistent disk storage.'));
        request.onblocked = () => reject(new Error('Persistent disk storage is blocked by another browser tab.'));
      });
    }
    return diskDatabasePromise;
  };

  const readStoredDiskMetadata = (db: IDBDatabase): Promise<DiskMetadata | undefined> =>
    new Promise((resolve, reject) => {
      const request = db.transaction(diskMetadataStoreName, 'readonly')
        .objectStore(diskMetadataStoreName)
        .get('ipo-os-hda');
      request.onsuccess = () => resolve(request.result as DiskMetadata | undefined);
      request.onerror = () => reject(request.error ?? new Error('Could not read saved disk metadata.'));
    });

  const readDiskChunks = (db: IDBDatabase, metadata: DiskMetadata): Promise<Map<number, Uint8Array>> =>
    new Promise((resolve, reject) => {
      const chunks = new Map<number, Uint8Array>();
      const transaction = db.transaction(diskChunkStoreName, 'readonly');
      const maxChunkIndex = Math.ceil(metadata.byteLength / metadata.chunkSize) - 1;
      const range = IDBKeyRange.bound([metadata.baseSha256, 0], [metadata.baseSha256, maxChunkIndex]);
      const request = transaction.objectStore(diskChunkStoreName).openCursor(range);
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve(chunks);
          return;
        }
        const key = cursor.key as IDBValidKey[];
        const index = Number(key[1]);
        const bytes = cursor.value;
        if (Number.isInteger(index) && bytes instanceof Uint8Array) chunks.set(index, bytes);
        cursor.continue();
      };
      request.onerror = () => reject(request.error ?? new Error('Could not read saved disk blocks.'));
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not read saved disk blocks.'));
    });

  const readUint32 = (bytes: Uint8Array, offset: number): number =>
    (bytes[offset] | bytes[offset + 1] << 8 | bytes[offset + 2] << 16 | bytes[offset + 3] << 24) >>> 0;

  const getDiskLayout = (image: Uint8Array): { byteLength: number; filesystemLba: number } => {
    if (image.byteLength < diskSectorSize || image[510] !== 0x55 || image[511] !== 0xAA) {
      throw new Error('disk-installed.img has no valid MBR.');
    }

    for (let index = 0; index < 4; index++) {
      const entry = 0x1BE + index * 16;
      if (image[entry] !== 0x80 || image[entry + 4] !== 0x83) continue;
      const startLba = readUint32(image, entry + 8);
      const sectorCount = readUint32(image, entry + 12);
      if (startLba !== expectedFilesystemLba || sectorCount === 0) {
        throw new Error(`disk-installed.img has an unsupported partition layout (start LBA ${startLba}).`);
      }
      const byteLength = (startLba + sectorCount) * diskSectorSize;
      if (!Number.isSafeInteger(byteLength) || byteLength !== image.byteLength) {
        throw new Error('disk-installed.img size does not match the disk capacity declared by its MBR.');
      }
      return { byteLength, filesystemLba: startLba };
    }
    throw new Error('disk-installed.img MBR does not declare the expected bootable IPO_FS partition.');
  };

  const hasFilesystemSuperblockAt = (disk: Uint8Array, offset: number): boolean =>
    disk.byteLength >= offset + diskSectorSize
    && disk[offset] === 0x49
    && disk[offset + 1] === 0x50
    && disk[offset + 2] === 0x4F
    && disk[offset + 3] === 0x5F
    && disk[offset + 4] === 0x46
    && disk[offset + 5] === 0x53
    && disk[offset + 16] === 0
    && disk[offset + 17] === 2
    && disk[offset + 18] === 0
    && disk[offset + 19] === 0;

  const sameBytes = (left: Uint8Array, right: Uint8Array): boolean => {
    if (left.byteLength !== right.byteLength) return false;
    for (let index = 0; index < left.byteLength; index++) {
      if (left[index] !== right[index]) return false;
    }
    return true;
  };

  const addDirtyDiskRange = (start: number, length: number) => {
    if (!activeDisk || length <= 0 || start < 0 || start + length > activeDisk.byteLength) {
      console.error('[v86] Invalid HDA write range:', { start, length });
      return;
    }
    const firstChunk = Math.floor(start / diskChunkSize);
    const lastChunk = Math.floor((start + length - 1) / diskChunkSize);
    for (let index = firstChunk; index <= lastChunk; index++) dirtyDiskChunks.add(index);
  };

  const loadSavedDisk = async (installedDisk: Uint8Array, installedSha256: string): Promise<Uint8Array> => {
    const layout = getDiskLayout(installedDisk);
    if (!hasFilesystemSuperblockAt(installedDisk, layout.filesystemLba * diskSectorSize)) {
      throw new Error('disk-installed.img does not contain IPO_FS at the MBR partition.');
    }
    const db = await openDiskDatabase();
    dirtyDiskChunks = new Set();

    const metadata = await readStoredDiskMetadata(db);
    const savedDiskMatches = metadata?.baseSha256 === installedSha256
      && metadata.byteLength === layout.byteLength
      && metadata.chunkSize === diskChunkSize;
    activeDisk = installedDisk;
    activeDiskBaseSha256 = installedSha256;

    if (savedDiskMatches) {
      const chunks = await readDiskChunks(db, metadata);
      for (const [index, bytes] of chunks) {
        const offset = index * diskChunkSize;
        if (offset < installedDisk.byteLength) {
          installedDisk.set(bytes.subarray(0, Math.min(bytes.byteLength, installedDisk.byteLength - offset)), offset);
        }
      }
      log(`Restored ${chunks.size} saved disk block(s) from this browser.`);
    } else {
      log(metadata
        ? 'Saved disk belongs to a different disk-installed.img; starting from the verified disk image.'
        : 'No saved disk found; starting from disk-installed.img.');
    }

    return installedDisk;
  };

  const saveDiskChunks = (
    db: IDBDatabase,
    baseSha256: string,
    byteLength: number,
    chunks: Array<{ index: number; bytes: Uint8Array }>,
  ): Promise<void> =>
    new Promise((resolve, reject) => {
      const transaction = db.transaction([diskMetadataStoreName, diskChunkStoreName], 'readwrite');
      transaction.objectStore(diskMetadataStoreName).put(
        { baseSha256, byteLength, chunkSize: diskChunkSize } satisfies DiskMetadata,
        'ipo-os-hda',
      );
      const store = transaction.objectStore(diskChunkStoreName);
      for (const chunk of chunks) {
        const key: IDBValidKey[] = [baseSha256, chunk.index];
        store.put(chunk.bytes, key);
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not save emulator disk blocks.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Saving emulator disk blocks was aborted.'));
    });

  const persistDisk = async (): Promise<void> => {
    if (diskSavePromise) {
      await diskSavePromise;
      return;
    }
    if (!activeDisk || !activeDiskBaseSha256 || !dirtyDiskChunks.size) return;

    const baseSha256 = activeDiskBaseSha256;
    const currentSave = (async () => {
      const db = await openDiskDatabase();
      while (dirtyDiskChunks.size) {
        const snapshot = [...dirtyDiskChunks].map((index) => {
          const offset = index * diskChunkSize;
          const bytes = activeDisk!.slice(offset, Math.min(offset + diskChunkSize, activeDisk!.byteLength));
          return { index, bytes };
        });
        const savedIndices = snapshot.map((chunk) => chunk.index);

        await saveDiskChunks(db, baseSha256, activeDisk!.byteLength, snapshot);
        for (const chunk of snapshot) {
          const offset = chunk.index * diskChunkSize;
          const currentBytes = activeDisk!.subarray(offset, offset + chunk.bytes.byteLength);
          if (sameBytes(currentBytes, chunk.bytes)) dirtyDiskChunks.delete(chunk.index);
        }
        diskSaveErrorReported = false;
        log(`Saved ${savedIndices.length} disk block(s) in this browser.`);
      }
    })();
    diskSavePromise = currentSave;
    try {
      await currentSave;
      if (dirtyDiskChunks.size) return persistDisk();
    } finally {
      if (diskSavePromise === currentSave) diskSavePromise = undefined;
    }
  };

  const reportDiskSaveError = (error: unknown) => {
    if (diskSaveErrorReported) return;
    diskSaveErrorReported = true;
    console.error('[v86] Could not persist the user disk:', error);
    log(`Disk save failed: ${String(error)}`);
    setStatus(`Disk save failed: ${String(error)}`);
  };

  const setProgress = (loaded: number, total: number) => {
    const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
    if (progressBar instanceof HTMLProgressElement) progressBar.value = percent;
    if (progressWrap) progressWrap.hidden = false;
    if (progressLabel) progressLabel.textContent = `${percent}%`;
  };

  const fetchBytes = async (url: string): Promise<Uint8Array> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not download ${url}: HTTP ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  };

  const sha256 = async (bytes: Uint8Array): Promise<string> => {
    const input = bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
      ? bytes.buffer as ArrayBuffer
      : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const digest = await crypto.subtle.digest('SHA-256', input);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  };

  const verifiedAsset = async (asset: Asset, label: string): Promise<Uint8Array> => {
    const bytes = await fetchBytes(new URL(asset.url, new URL(base, window.location.href)).href);
    if (bytes.byteLength !== asset.size || await sha256(bytes) !== asset.sha256) {
      throw new Error(`${label} size or SHA-256 verification failed`);
    }
    return bytes;
  };

  const setButtonState = (running: boolean) => {
    if (startButton) startButton.disabled = running;
    if (restartButton) restartButton.disabled = !running;
    fullscreenButtons.forEach((button) => {
      button.disabled = !running;
    });
  };

  const teardown = async () => {
    await emulator?.destroy();
    emulator = undefined;
    setButtonState(false);
  };

  const boot = async () => {
    if (!startButton || !screen || emulator) return;
    startButton.disabled = true;
    root.querySelector<HTMLElement>('[data-splash]')?.setAttribute('hidden', '');
    setStatus(labels.downloading ?? 'Downloading system images…');
    log('Preparing v86 and loading verified IPO images.');
    try {
      if (!preparedMachineAssets) {
        const manifestResponse = await fetch(`${base}emulator/manifest.json`);
        if (!manifestResponse.ok) throw new Error(`Could not load emulator manifest: HTTP ${manifestResponse.status}`);
        const manifest = (await manifestResponse.json()) as Manifest;
        const [bootRom, firmware, installedDisk] = await Promise.all([
          verifiedAsset(manifest.assets.boot_rom, 'IPO_Boot_ROM'),
          verifiedAsset(manifest.assets.firmware, 'IPO_Firmware'),
          verifiedAsset(manifest.assets.disk_installed, 'disk-installed.img'),
        ]);
        preparedMachineAssets = {
          bootRom,
          firmware,
          installedDisk,
          diskSha256: manifest.assets.disk_installed.sha256,
        };
      }
      const { bootRom, firmware } = preparedMachineAssets;
      const osDisk = await loadSavedDisk(
        new Uint8Array(preparedMachineAssets.installedDisk),
        preparedMachineAssets.diskSha256,
      );
      log('Verified separate IPO_Boot_ROM and IPO_Firmware BIOS images.');
      log(`Attached disk-installed.img as the single primary disk (${Math.round(osDisk.byteLength / (1024 * 1024))} MiB), with IPO_FS and applications pre-installed.`);
      setStatus(labels.starting ?? 'Starting v86…');
      osBooted = false;

      const runtimeUrl = new URL(`${base}emulator/libv86.mjs`, window.location.href).href;
      const { V86 } = await import(/* @vite-ignore */ runtimeUrl) as typeof import('v86');
      const v86 = new V86({
        wasm_path: `${base}emulator/v86.wasm`,
        memory_size: 512 * 1024 * 1024,
        vga_memory_size: 8 * 1024 * 1024,
        bios: { buffer: firmware.buffer as ArrayBuffer },
        bootrom: { buffer: bootRom.buffer as ArrayBuffer },
        vga_bios: { url: `${base}emulator/vgabios.bin` },
        hda: { buffer: osDisk.buffer as ArrayBuffer },
        screen: { container: screen, use_graphical_text: true },
        uart1: true,
        autostart: false,
        log_level: 0,
      });
      emulator = v86;
      v86.add_listener('download-progress', ({ loaded, total }) => {
        setProgress(loaded, total);
      });
      v86.add_listener('serial0-output-byte', (byte) => {
        serialLine += String.fromCharCode(byte);
        if (byte === 10 || serialLine.length > 240) {
          const line = serialLine.trimEnd();
          log(line);
          if (line.includes(osReadyMarker)) {
            osBooted = true;
            setStatus(labels.booted ?? 'IPO_OS booted successfully.');
          }
          serialLine = '';
        }
      });
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error('Timed out while loading the v86 runtime')), 120_000);
        v86.add_listener('emulator-ready', () => {
          window.clearTimeout(timeout);
          resolve();
        });
        v86.add_listener('download-error', (error) => {
          window.clearTimeout(timeout);
          reject(new Error(`v86 could not load ${error.file_name}`));
        });
      });
      v86.set_hda_write_callback(addDirtyDiskRange);
      await v86.run();
      v86.keyboard_set_enabled(true);
      v86.mouse_set_enabled(true);
      setButtonState(true);
      if (diskSaveTimer !== undefined) window.clearInterval(diskSaveTimer);
      diskSaveTimer = window.setInterval(() => {
        void persistDisk().catch(reportDiskSaveError);
      }, 1000);
      if (progressWrap) progressWrap.hidden = true;
      log('Disk changes are automatically saved to this browser.');
      setStatus(osBooted ? (labels.booted ?? 'IPO_OS booted successfully.') : (labels.running ?? 'v86 started'));
      log('v86 started with the IPO_Boot_ROM. Check serial output for the boot result.');
    } catch (error) {
      console.error('[v86] Startup failed:', error);
      log(`Startup failed: ${String(error)}`);
      setStatus(`${labels.error ?? 'Error'}: ${String(error)}`);
      await teardown();
    }
  };

  startButton?.addEventListener('click', () => void boot());
  restartButton?.addEventListener('click', () => {
    if (!emulator || restartInProgress) return;
    restartInProgress = true;
    restartButton.disabled = true;
    if (startButton) startButton.disabled = true;
    setStatus(labels.restarting ?? 'Restarting the virtual machine…');
    log('Saving disk changes and starting a fresh virtual machine.');
    void (async () => {
      try {
      await persistDisk();
      await teardown();
      serialLine = '';
      osBooted = false;
      await boot();
      } catch (error) {
      console.error('[v86] Restart failed:', error);
      log(`Restart failed: ${String(error)}`);
      setStatus(`${labels.error ?? 'Error'}: ${String(error)}`);
      setButtonState(Boolean(emulator));
      } finally {
      restartInProgress = false;
      }
    })();
  });
  fullscreenButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (!screenViewport) return;
      const isFullscreen = document.fullscreenElement === screenViewport;
      if (!isFullscreen) {
        const canvas = screen?.querySelector<HTMLCanvasElement>('canvas');
        if (canvas) {
          windowedCanvasStyle = {
            width: canvas.style.width,
            height: canvas.style.height,
            transform: canvas.style.transform,
          };
        }
      }
      const fullscreenRequest = isFullscreen ? document.exitFullscreen() : screenViewport.requestFullscreen();
      void fullscreenRequest.catch((error: unknown) => {
        windowedCanvasStyle = undefined;
        console.error('[v86] Could not toggle fullscreen:', error);
        setStatus(`Fullscreen toggle failed: ${String(error)}`);
      });
    });
  });
  let screenWasFullscreen = false;
  document.addEventListener('fullscreenchange', () => {
    if (!screenViewport) return;
    if (document.fullscreenElement === screenViewport) {
      screenWasFullscreen = true;
      return;
    }
    if (!screenWasFullscreen) return;
    screenWasFullscreen = false;

    window.requestAnimationFrame(() => {
      if (document.fullscreenElement === screenViewport) return;
      const canvas = screen?.querySelector<HTMLCanvasElement>('canvas');
      if (!canvas || !windowedCanvasStyle) return;
      canvas.style.width = windowedCanvasStyle.width;
      canvas.style.height = windowedCanvasStyle.height;
      canvas.style.transform = windowedCanvasStyle.transform;
      windowedCanvasStyle = undefined;
    });
  });
  root.querySelector<HTMLFormElement>('[data-serial-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = root.querySelector<HTMLInputElement>('[data-serial-input]');
    if (!emulator || !input?.value) return;
    emulator.keyboard_send_text(`${input.value}\n`);
    input.value = '';
    screen?.focus();
  });
  root.querySelector<HTMLButtonElement>('[data-log-clear]')?.addEventListener('click', () => {
    if (!consoleOutput) return;
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'browser-v86__log-empty';
    emptyMessage.textContent = root.dataset.logsEmpty ?? '';
    consoleOutput.replaceChildren(emptyMessage);
    if (logCount) logCount.textContent = lineCountFormat.replace('{count}', '0');
  });
  root.querySelector<HTMLButtonElement>('[data-log-copy]')?.addEventListener('click', () => {
    if (!consoleOutput) return;
    void navigator.clipboard.writeText(consoleOutput.innerText).catch((error: unknown) => {
      console.error('[v86] Could not copy logs:', error);
    });
  });
  root.querySelector<HTMLButtonElement>('[data-log-download]')?.addEventListener('click', () => {
    if (!consoleOutput) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([consoleOutput.innerText], { type: 'text/plain' }));
    link.download = 'ipo-os-emulator.log';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 0);
  });
  window.addEventListener('pagehide', () => {
    if (diskSaveTimer !== undefined) window.clearInterval(diskSaveTimer);
    void persistDisk().catch(reportDiskSaveError);
    void emulator?.destroy();
  }, { once: true });
}
