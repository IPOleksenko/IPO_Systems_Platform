export interface NavItem {
  id: string;
  slug: string;
  titleKey: string;
  badge?: string;
}

export interface NavGroup {
  id: string;
  titleKey: string;
  items: NavItem[];
}

export interface ProjectNav {
  projectId: string;
  titleKey: string;
  groups: NavGroup[];
}

export const navigationData: ProjectNav[] = [
  {
    projectId: 'ipo_os',
    titleKey: 'sections.ipo_os.title',
    groups: [
      {
        id: 'part_a',
        titleKey: 'sections.ipo_os.part_a',
        items: [
          { id: 'overview', slug: 'ipo-os/overview', titleKey: 'pages.ipo_os.overview' },
          { id: 'architecture', slug: 'ipo-os/architecture', titleKey: 'pages.ipo_os.architecture' },
          { id: 'hardware-requirements', slug: 'ipo-os/hardware-requirements', titleKey: 'pages.ipo_os.hardware_requirements' }
        ]
      },
      {
        id: 'part_b',
        titleKey: 'sections.ipo_os.part_b',
        items: [
          { id: 'platform-selection', slug: 'ipo-os/hardware/platform-selection', titleKey: 'pages.ipo_os.platform_selection' },
          { id: 'components', slug: 'ipo-os/hardware/components', titleKey: 'pages.ipo_os.components' },
          { id: 'configurations', slug: 'ipo-os/hardware/configurations', titleKey: 'pages.ipo_os.configurations' },
          { id: 'assembly-guide', slug: 'ipo-os/hardware/assembly-guide', titleKey: 'pages.ipo_os.assembly_guide' },
          { id: 'firmware-setup', slug: 'ipo-os/hardware/firmware-setup', titleKey: 'pages.ipo_os.firmware_setup' },
          { id: 'media-preparation', slug: 'ipo-os/hardware/media-preparation', titleKey: 'pages.ipo_os.media_preparation' },
          { id: 'first-boot-diagnostics', slug: 'ipo-os/hardware/first-boot-diagnostics', titleKey: 'pages.ipo_os.first_boot' },
          { id: 'virtual-machines', slug: 'ipo-os/hardware/virtual-machines', titleKey: 'pages.ipo_os.virtual_machines' },
          { id: 'checklists', slug: 'ipo-os/hardware/checklists', titleKey: 'pages.ipo_os.checklists' }
        ]
      },
      {
        id: 'part_c',
        titleKey: 'sections.ipo_os.part_c',
        items: [
          { id: 'boot-sequence', slug: 'ipo-os/kernel/boot-sequence', titleKey: 'pages.ipo_os.boot_sequence' },
          { id: 'bootloader-contract', slug: 'ipo-os/kernel/bootloader-contract', titleKey: 'pages.ipo_os.bootloader_contract' },
          { id: 'cpu-modes', slug: 'ipo-os/kernel/cpu-modes', titleKey: 'pages.ipo_os.cpu_modes' },
          { id: 'memory-management', slug: 'ipo-os/kernel/memory-management', titleKey: 'pages.ipo_os.memory_management' },
          { id: 'scheduler', slug: 'ipo-os/kernel/scheduler', titleKey: 'pages.ipo_os.scheduler' },
          { id: 'syscall-subsystem', slug: 'ipo-os/kernel/syscall-subsystem', titleKey: 'pages.ipo_os.syscalls_kernel' },
          { id: 'interrupts-traps', slug: 'ipo-os/kernel/interrupts-traps', titleKey: 'pages.ipo_os.interrupts' },
          { id: 'vfs-storage', slug: 'ipo-os/kernel/vfs-storage', titleKey: 'pages.ipo_os.vfs_storage' },
          { id: 'driver-model', slug: 'ipo-os/kernel/driver-model', titleKey: 'pages.ipo_os.driver_model' },
          { id: 'io-console', slug: 'ipo-os/kernel/io-console', titleKey: 'pages.ipo_os.io_console' },
          { id: 'ipc', slug: 'ipo-os/kernel/ipc', titleKey: 'pages.ipo_os.ipc' },
          { id: 'security-isolation', slug: 'ipo-os/kernel/security-isolation', titleKey: 'pages.ipo_os.security' },
          { id: 'debugging', slug: 'ipo-os/kernel/debugging', titleKey: 'pages.ipo_os.kernel_debugging' }
        ]
      },
      {
        id: 'part_d',
        titleKey: 'sections.ipo_os.part_d',
        items: [
          { id: 'toolchain-setup', slug: 'ipo-os/dev/toolchain-setup', titleKey: 'pages.ipo_os.toolchain_setup' },
          { id: 'hello-world', slug: 'ipo-os/dev/hello-world', titleKey: 'pages.ipo_os.hello_world' },
          { id: 'binary-format', slug: 'ipo-os/dev/binary-format', titleKey: 'pages.ipo_os.binary_format' },
          { id: 'abi-calling-conventions', slug: 'ipo-os/dev/abi-calling-conventions', titleKey: 'pages.ipo_os.abi' },
          { id: 'syscalls-usage', slug: 'ipo-os/dev/syscalls-usage', titleKey: 'pages.ipo_os.syscalls_app' },
          { id: 'standard-library', slug: 'ipo-os/dev/standard-library', titleKey: 'pages.ipo_os.stdlib' },
          { id: 'memory-io-files', slug: 'ipo-os/dev/memory-io-files', titleKey: 'pages.ipo_os.memory_io' },
          { id: 'ui-output', slug: 'ipo-os/dev/ui-output', titleKey: 'pages.ipo_os.ui_programming' },
          { id: 'build-system', slug: 'ipo-os/dev/build-system', titleKey: 'pages.ipo_os.build_system' },
          { id: 'packaging-deployment', slug: 'ipo-os/dev/packaging-deployment', titleKey: 'pages.ipo_os.packaging' },
          { id: 'app-debugging', slug: 'ipo-os/dev/app-debugging', titleKey: 'pages.ipo_os.app_debugging' },
          { id: 'best-practices', slug: 'ipo-os/dev/best-practices', titleKey: 'pages.ipo_os.best_practices' },
          { id: 'examples', slug: 'ipo-os/dev/examples', titleKey: 'pages.ipo_os.examples' }
        ]
      },
      {
        id: 'part_e',
        titleKey: 'sections.ipo_os.part_e',
        items: [
          { id: 'ref-syscalls', slug: 'ipo-os/ref/syscalls', titleKey: 'pages.ipo_os.ref_syscalls' },
          { id: 'ref-memory-io-map', slug: 'ipo-os/ref/memory-io-map', titleKey: 'pages.ipo_os.ref_memory_io' },
          { id: 'ref-structures-headers', slug: 'ipo-os/ref/structures-headers', titleKey: 'pages.ipo_os.ref_structures' },
          { id: 'ref-error-codes', slug: 'ipo-os/ref/error-codes', titleKey: 'pages.ipo_os.ref_errors' },
          { id: 'ref-glossary', slug: 'ipo-os/ref/glossary', titleKey: 'pages.ipo_os.ref_glossary' }
        ]
      },
      {
        id: 'part_f',
        titleKey: 'sections.ipo_os.part_f',
        items: [
          { id: 'contrib-build', slug: 'ipo-os/contrib/build-kernel', titleKey: 'pages.ipo_os.contrib_build' },
          { id: 'contrib-style', slug: 'ipo-os/contrib/code-style', titleKey: 'pages.ipo_os.contrib_style' },
          { id: 'contrib-testing', slug: 'ipo-os/contrib/testing-prs', titleKey: 'pages.ipo_os.contrib_testing' }
        ]
      }
    ]
  },
  {
    projectId: 'ipo_boot_rom',
    titleKey: 'sections.ipo_boot_rom.title',
    groups: [
      {
        id: 'boot_rom_core',
        titleKey: 'sections.ipo_boot_rom.title',
        items: [
          { id: 'bootrom-overview', slug: 'ipo-boot-rom/overview', titleKey: 'pages.ipo_boot_rom.overview' },
          { id: 'bootrom-getting-started', slug: 'ipo-boot-rom/getting-started', titleKey: 'pages.ipo_boot_rom.getting_started' },
          { id: 'bootrom-architecture', slug: 'ipo-boot-rom/architecture', titleKey: 'pages.ipo_boot_rom.architecture' },
          { id: 'bootrom-flashing', slug: 'ipo-boot-rom/hardware-flashing', titleKey: 'pages.ipo_boot_rom.hardware_flashing' },
          { id: 'bootrom-reference', slug: 'ipo-boot-rom/reference', titleKey: 'pages.ipo_boot_rom.reference' },
          { id: 'bootrom-troubleshooting', slug: 'ipo-boot-rom/troubleshooting', titleKey: 'pages.ipo_boot_rom.troubleshooting' }
        ]
      }
    ]
  },
  {
    projectId: 'ipo_firmware',
    titleKey: 'sections.ipo_firmware.title',
    groups: [
      {
        id: 'firmware_core',
        titleKey: 'sections.ipo_firmware.title',
        items: [
          { id: 'firmware-overview', slug: 'ipo-firmware/overview', titleKey: 'pages.ipo_firmware.overview' },
          { id: 'firmware-getting-started', slug: 'ipo-firmware/getting-started', titleKey: 'pages.ipo_firmware.getting_started' },
          { id: 'firmware-architecture', slug: 'ipo-firmware/architecture', titleKey: 'pages.ipo_firmware.architecture' },
          { id: 'firmware-interrupts', slug: 'ipo-firmware/interrupt-reference', titleKey: 'pages.ipo_firmware.interrupt_reference' },
          { id: 'firmware-reference', slug: 'ipo-firmware/reference', titleKey: 'pages.ipo_firmware.reference' },
          { id: 'firmware-troubleshooting', slug: 'ipo-firmware/troubleshooting', titleKey: 'pages.ipo_firmware.troubleshooting' }
        ]
      }
    ]
  }
];

export function getAllSlugs(): string[] {
  const slugs: string[] = [];
  for (const p of navigationData) {
    for (const g of p.groups) {
      for (const item of g.items) {
        slugs.push(item.slug);
      }
    }
  }
  return slugs;
}

export function getAdjacentPages(currentSlug: string): { prev?: NavItem; next?: NavItem } {
  const allItems: NavItem[] = [];
  for (const p of navigationData) {
    for (const g of p.groups) {
      for (const item of g.items) {
        allItems.push(item);
      }
    }
  }
  const idx = allItems.findIndex((it) => it.slug === currentSlug);
  if (idx === -1) return {};
  return {
    prev: idx > 0 ? allItems[idx - 1] : undefined,
    next: idx < allItems.length - 1 ? allItems[idx + 1] : undefined
  };
}
