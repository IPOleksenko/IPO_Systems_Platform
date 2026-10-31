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
        name: 'Complete IPO Systems Bundle (All Projects & Disks)',
        category: 'bundle',
        featured: true,
        description: 'All compiled binaries across the platform: Boot ROM (bootrom.bin), Firmware BIOS (firmware.rom), IPO_OS kernel image (IPO_OS.img), clean and pre-installed disks (disk-clean.img, disk-installed.img), and pre-compiled applications package (applications.zip).',
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
        id: 'ipo-disk-installed',
        file: 'disk-installed.img',
        name: 'IPO_OS Pre-Installed Disk (512 MB)',
        category: 'software',
        description: 'Ready-to-use 512 MB IPO_FS disk image with all applications, DOOM, toolchains, runtime libraries, and fonts pre-installed.',
        size_formatted: '0 B',
        sha256: 'Pre-compiled release'
      },
      {
        id: 'ipo-disk-clean',
        file: 'disk-clean.img',
        name: 'IPO_OS Clean Formatted Disk (512 MB)',
        category: 'os',
        description: 'Clean 512 MB disk image formatted with the extent-based IPO_FS filesystem without pre-installed applications.',
        size_formatted: '0 B',
        sha256: 'Pre-compiled release'
      },
      {
        id: 'ipo-applications',
        file: 'applications.zip',
        name: 'IPO_OS Compiled Applications Package',
        category: 'software',
        description: 'Compiled production binaries: applications, DOOM, in-OS toolchains (TCC, Lua, Python, NASM), runtime libraries (libc, libm, libapp, tinygl), SDK headers, and fonts.',
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
        description: 'Compiled BIOS runtime service layer ROM binary (firmware.rom).',
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
