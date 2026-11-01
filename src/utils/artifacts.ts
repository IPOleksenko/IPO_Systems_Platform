import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface Artifact {
  id: string;
  file: string;
  name: string;
  category: string;
  description: string;
  archive_group?: string;
  download_group?: string;
  archive_format?: string;
  rom_size?: string;
  rom_size_bytes?: number;
  size_bytes?: number;
  size_formatted: string;
  sha256: string;
  featured?: boolean;
}

export interface ArtifactGroup {
  id: string;
  artifacts: Artifact[];
}

const artifactTranslationKeys: Record<string, string> = {
  'ipo-os-raw': 'artifact_labels.ipo_os_raw',
  'ipo-disk-installed': 'artifact_labels.ipo_disk_installed',
  'ipo-disk-clean': 'artifact_labels.ipo_disk_clean',
  'ipo-applications': 'artifact_labels.ipo_applications',
  'ipo-firmware': 'artifact_labels.ipo_firmware'
};

export function getArtifactTranslationKey(artifactId: string): string | undefined {
  return artifactTranslationKeys[artifactId];
}

export function groupArtifacts(artifacts: Artifact[]): ArtifactGroup[] {
  const groups = new Map<string, ArtifactGroup>();
  for (const artifact of artifacts) {
    const id = artifact.archive_group ?? artifact.download_group ?? artifact.id;
    const group = groups.get(id) ?? { id, artifacts: [] };
    group.artifacts.push(artifact);
    groups.set(id, group);
  }
  return [...groups.values()];
}

export function getArtifactFormat(artifact: Artifact): string {
  if (artifact.archive_format) return artifact.archive_format;
  return artifact.file.split('.').pop()?.toUpperCase() ?? 'FILE';
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
    const bootromSizes = [
      ['64k', '64 KB', 64 * 1024],
      ['128k', '128 KB', 128 * 1024],
      ['256k', '256 KB', 256 * 1024],
      ['512k', '512 KB', 512 * 1024],
      ['1m', '1 MB', 1024 * 1024],
      ['2m', '2 MB', 2 * 1024 * 1024],
      ['4m', '4 MB', 4 * 1024 * 1024],
      ['8m', '8 MB', 8 * 1024 * 1024],
      ['16m', '16 MB', 16 * 1024 * 1024]
    ] as const;
    artifacts = [
      {
        id: 'ipo-system-bundle',
        file: 'ipo-system-bundle.zip',
        name: 'Complete IPO Systems Bundle (All Projects & Disks)',
        category: 'bundle',
        archive_group: 'ipo-system-bundle',
        archive_format: 'ZIP',
        featured: true,
        description: 'All compiled binaries across the platform: Boot ROM (bootrom.bin), Firmware (firmware.rom), IPO_OS kernel image (IPO_OS.img), clean and pre-installed disks (disk-clean.img, disk-installed.img), and pre-compiled applications package (applications.zip).',
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
        archive_group: 'ipo-applications',
        archive_format: 'ZIP',
        description: 'Compiled production binaries: applications, DOOM, in-OS toolchains (TCC, Lua, Python, NASM), runtime libraries (libc, libm, libapp, tinygl), SDK headers, and fonts.',
        size_formatted: '0 B',
        sha256: 'Pre-compiled release'
      },
      ...bootromSizes.map(([slug, size, bytes]) => ({
        id: `ipo-boot-rom-${slug}`,
        file: `ipo-boot-rom${slug === '4m' ? '' : `-${slug}`}.bin`,
        name: `IPO_Boot_ROM (${size})`,
        category: 'bootrom',
        download_group: 'ipo-boot-rom',
        rom_size: size,
        rom_size_bytes: bytes,
        description: `IPO_Boot_ROM image sized for a ${size} flash chip.`,
        size_bytes: bytes,
        size_formatted: formatBytes(bytes),
        sha256: 'Pre-compiled release'
      })),
      {
        id: 'ipo-firmware',
        file: 'firmware.rom',
        name: 'IPO_Firmware',
        category: 'firmware',
        description: 'Compiled IPO_Firmware runtime services ROM binary (firmware.rom).',
        size_formatted: '0 B',
        sha256: 'Pre-compiled release'
      }
    ];
  }

  const knownArchiveGroups: Record<string, string> = {
    'ipo-system-bundle': 'ipo-system-bundle',
    'ipo-applications': 'ipo-applications',
  };
  for (const artifact of artifacts) {
    const format = ['tar.gz', 'tar.bz2', 'tar.xz'].find((extension) => artifact.file.endsWith(`.${extension}`))
      ?? (artifact.file.endsWith('.zip') ? 'zip' : undefined);
    const archiveGroup = artifact.archive_group ?? knownArchiveGroups[artifact.id];
    if (format && archiveGroup) {
      artifact.archive_group = archiveGroup;
      artifact.archive_format ??= format.toUpperCase();
    }
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
