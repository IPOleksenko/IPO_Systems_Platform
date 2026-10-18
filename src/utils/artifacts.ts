import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface Artifact {
  id: string;
  file: string;
  name: string;
  category: string;
  description: string;
  size_bytes?: number;
  size_formatted: string;
  sha256: string;
  featured?: boolean;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function getFileSha256(filePath: string): string {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  } catch {
    return 'Pre-compiled release';
  }
}

export function getRealArtifacts(): { artifacts: Artifact[]; buildDate: string } {
  let artifacts: Artifact[] = [];
  let buildDate = '';
  const downloadsDir = path.resolve('public/downloads');
  const manifestPath = path.join(downloadsDir, 'manifest.json');

  if (fs.existsSync(manifestPath)) {
    try {
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      const data = JSON.parse(raw);
      artifacts = data.artifacts || [];
      buildDate = data.build_date ? new Date(data.build_date).toLocaleDateString() : '';
    } catch {
      artifacts = [];
    }
  }

  // Base fallback structure if manifest does not exist
  if (artifacts.length === 0) {
    artifacts = [
      {
        id: 'ipo-system-bundle',
        file: 'ipo-system-bundle.zip',
        name: 'Complete IPO Systems Bundle (All 3 Projects & Disk)',
        category: 'bundle',
        featured: true,
        description: 'All compiled binaries across the entire platform: Boot ROM (bootrom.bin), Firmware BIOS (firmware.rom), IPO_OS kernel image (IPO_OS.img), and 128 MB applications disk (disk.img).',
        size_formatted: '0 B',
        sha256: 'Pre-compiled release'
      },
      {
        id: 'ipo-os-raw',
        file: 'IPO_OS.img',
        name: 'IPO_OS Kernel Bootable Image',
        category: 'os',
        description: 'Raw 32-bit bootable image containing IPO_OS kernel (LBA 0 bootloader + kernel binary).',
        size_formatted: '0 B',
        sha256: 'Pre-compiled release'
      },
      {
        id: 'ipo-os-disk',
        file: 'disk.img',
        name: 'IPO_OS Applications Disk (128 MB)',
        category: 'os',
        description: 'Pre-formatted 128 MB disk image with compiled applications, Doom, TinyGL demos, and userland toolchain.',
        size_formatted: '0 B',
        sha256: 'Pre-compiled release'
      },
      {
        id: 'ipo-boot-rom',
        file: 'ipo-boot-rom.zip',
        name: 'IPO_Boot_ROM Package',
        category: 'bootrom',
        description: 'Compiled hardware reset vector 0xFFFFFFF0 ROM binary (bootrom.bin).',
        size_formatted: '0 B',
        sha256: 'Pre-compiled release'
      },
      {
        id: 'ipo-firmware',
        file: 'ipo-firmware.zip',
        name: 'IPO_Firmware Package',
        category: 'firmware',
        description: 'Compiled BIOS runtime service layer ROM binaries (firmware.rom, firmware.bin).',
        size_formatted: '0 B',
        sha256: 'Pre-compiled release'
      }
    ];
  }

  // Always enrich/override with real file size and sha256 directly from disk
  for (const art of artifacts) {
    const filePath = path.join(downloadsDir, art.file);
    if (fs.existsSync(filePath)) {
      try {
        const stat = fs.statSync(filePath);
        art.size_bytes = stat.size;
        art.size_formatted = formatBytes(stat.size);
        if (!art.sha256 || art.sha256 === 'Pre-compiled release') {
          art.sha256 = getFileSha256(filePath);
        }
      } catch {
        // keep existing formatted size if stat fails
      }
    }
  }

  return { artifacts, buildDate };
}
