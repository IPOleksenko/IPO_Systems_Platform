export function generateDiagramSvg(id: string, labels: Record<string, string>): string {
  // Common theme-aware styles for all generated SVGs
  const style = `
    <style>
      .box { fill: var(--bg-card, #ffffff); stroke: var(--border-color, #cbd5e1); stroke-width: 2px; rx: 8px; }
      .box-accent { fill: var(--accent-light, #eff6ff); stroke: var(--accent-primary, #3b82f6); stroke-width: 2px; rx: 8px; }
      .box-success { fill: var(--color-success-bg, #ecfdf5); stroke: var(--color-success, #10b981); stroke-width: 2px; rx: 8px; }
      .box-warn { fill: var(--color-warning-bg, #fffbeb); stroke: var(--color-warning, #f59e0b); stroke-width: 2px; rx: 8px; }
      .text-title { font-family: var(--font-sans, system-ui); font-size: 14px; font-weight: 700; fill: var(--text-primary, #0f172a); }
      .text-desc { font-family: var(--font-mono, monospace); font-size: 11px; fill: var(--text-secondary, #475569); }
      .arrow { stroke: var(--accent-primary, #3b82f6); stroke-width: 2px; marker-end: url(#arrowhead); fill: none; }
      .arrow-sub { stroke: var(--text-muted, #64748b); stroke-width: 1.5px; stroke-dasharray: 4; marker-end: url(#arrowhead-gray); fill: none; }
    </style>
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent-primary, #3b82f6)" />
      </marker>
      <marker id="arrowhead-gray" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="var(--text-muted, #64748b)" />
      </marker>
    </defs>
  `;

  const ALIASES: Record<string, string> = {
    vertical_platform_stack: 'global_stack',
    platform_stack: 'global_stack',
    scheduler_fsm: 'process_scheduler',
    process_lifecycle: 'process_scheduler',
    spi_flashing: 'spi_flashing_pinout',
    spi_pinout: 'spi_flashing_pinout',
    wm_pipeline: 'window_manager',
    windowing_pipeline: 'window_manager',
    interrupt_matrix: 'interrupt_routing',
    interrupts: 'interrupt_routing',
    driver_model: 'driver_architecture',
    drivers: 'driver_architecture',
    pci_tree: 'pci_bus_topology',
    pci_enumeration: 'pci_bus_topology',
    car_layout: 'car_memory_layout',
    storage_pipeline: 'storage_transfer_flow',
    storage_transfer: 'storage_transfer_flow',
    chipset_init: 'chipset_init_flow'
  };
  const targetId = ALIASES[id] || id;

  if (targetId === 'global_stack') {
    return `<svg viewBox="0 0 800 520" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <!-- Layer 1: Hardware -->
      <rect x="50" y="20" width="700" height="48" class="box" />
      <text x="400" y="48" text-anchor="middle" class="text-title">🖥️ ${labels.hardware || 'Physical Hardware'}</text>

      <path d="M400 68 L400 90" class="arrow" />

      <!-- Layer 2: Boot ROM -->
      <rect x="50" y="90" width="700" height="48" class="box-warn" />
      <text x="400" y="118" text-anchor="middle" class="text-title">⚡ ${labels.boot_rom || 'IPO_Boot_ROM'}</text>

      <path d="M400 138 L400 165" class="arrow" />
      <text x="410" y="155" class="text-desc">${labels.contract_2 || 'Contract 2'}</text>

      <!-- Layer 3: Firmware -->
      <rect x="50" y="165" width="700" height="48" class="box-success" />
      <text x="400" y="193" text-anchor="middle" class="text-title">📟 ${labels.firmware || 'IPO_Firmware'}</text>

      <path d="M400 213 L400 240" class="arrow" />
      <text x="410" y="230" class="text-desc">${labels.contract_3 || 'Contract 3'}</text>

      <!-- Layer 4: Kernel -->
      <rect x="50" y="240" width="700" height="52" class="box-accent" />
      <text x="400" y="271" text-anchor="middle" class="text-title">🛡️ ${labels.kernel || 'IPO_OS Kernel'}</text>

      <path d="M400 292 L400 325" class="arrow" />
      <text x="410" y="312" class="text-desc">${labels.syscall_gate || 'Syscall Gate (int 0x80)'}</text>

      <!-- Layer 5: Userspace -->
      <rect x="50" y="325" width="700" height="60" class="box" />
      <text x="400" y="360" text-anchor="middle" class="text-title">🚀 ${labels.userland || 'Userspace Applications'}</text>
    </svg>`;
  }

  if (targetId === 'boot_rom_flow') {
    return `<svg viewBox="0 0 840 680" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <!-- Steps 1 to 9 -->
      <rect x="70" y="20" width="700" height="45" class="box-warn" />
      <text x="420" y="47" text-anchor="middle" class="text-title">${labels.reset_vector || 'Reset Vector (0xFFFFFFF0 -> 0xF000:E000)'}</text>

      <path d="M420 65 L420 90" class="arrow" />
      <rect x="70" y="90" width="700" height="45" class="box" />
      <text x="420" y="117" text-anchor="middle" class="text-title">${labels.jump_base || '8 KiB Bootblock (LPC & SuperIO UART Init)'}</text>

      <path d="M420 135 L420 160" class="arrow" />
      <rect x="70" y="160" width="700" height="45" class="box-accent" />
      <text x="420" y="187" text-anchor="middle" class="text-title">${labels.car_setup || '32 KiB CAR (0x70000..0x77FFF) or 0x2E .car_bypass'}</text>

      <path d="M420 205 L420 230" class="arrow" />
      <rect x="70" y="230" width="700" height="45" class="box" />
      <text x="420" y="257" text-anchor="middle" class="text-title">${labels.chipset_probe || '32-bit Flash-XIP C romstage (Host Bridge & PAM0..6)'}</text>

      <path d="M420 275 L420 300" class="arrow" />
      <rect x="70" y="300" width="700" height="45" class="box-success" />
      <text x="420" y="327" text-anchor="middle" class="text-title">${labels.mrc_training || 'SMBus SPD + Cold DRAM Probe & R/W Verify'}</text>

      <path d="M420 345 L420 370" class="arrow" />
      <rect x="70" y="370" width="700" height="45" class="box" />
      <text x="420" y="397" text-anchor="middle" class="text-title">${labels.car_teardown || 'CAR Teardown & DRAM Migration'}</text>

      <path d="M420 415 L420 440" class="arrow" />
      <rect x="70" y="440" width="700" height="45" class="box" />
      <text x="420" y="467" text-anchor="middle" class="text-title">${labels.pic_pit || '8259 PIC & 8254 PIT Setup'}</text>

      <path d="M420 485 L420 510" class="arrow" />
      <rect x="70" y="510" width="700" height="45" class="box" />
      <text x="420" y="537" text-anchor="middle" class="text-title">${labels.shadow_ram || '56 KiB Bank Shadow Copy (0xF0000) & PAM0 Lock'}</text>

      <path d="M420 555 L420 580" class="arrow" />
      <rect x="70" y="580" width="700" height="50" class="box-success" />
      <text x="420" y="611" text-anchor="middle" class="text-title">➡️ ${labels.handover || 'Handover Contract 2 (jmp 0xF000:000C)'}</text>
    </svg>`;
  }

  if (targetId === 'firmware_flow') {
    return `<svg viewBox="0 0 840 680" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <rect x="70" y="20" width="700" height="45" class="box-accent" />
      <text x="420" y="47" text-anchor="middle" class="text-title">📥 ${labels.entry || 'Firmware Entry (0xF000:000C)'}</text>

      <path d="M420 65 L420 90" class="arrow" />
      <rect x="70" y="90" width="700" height="45" class="box" />
      <text x="420" y="117" text-anchor="middle" class="text-title">⚙️ ${labels.ivt_setup || 'IVT (INT 10h..1Ah) & Dynamic SMP / IOAPIC Probe'}</text>

      <path d="M420 135 L420 160" class="arrow" />
      <rect x="70" y="160" width="700" height="45" class="box" />
      <text x="420" y="187" text-anchor="middle" class="text-title">📋 ${labels.bda_ebda || 'BDA (0x400), EBDA RSDP & ACPI 1.0 + Dynamic E820'}</text>

      <path d="M420 205 L420 230" class="arrow" />
      <rect x="70" y="230" width="700" height="45" class="box" />
      <text x="420" y="257" text-anchor="middle" class="text-title">🔍 ${labels.pci_enum || 'PCI Enum (Bus 0..7), Dynamic BARs & IRQ Routing'}</text>

      <path d="M420 275 L420 300" class="arrow" />
      <rect x="70" y="300" width="700" height="45" class="box" />
      <text x="420" y="327" text-anchor="middle" class="text-title">🚪 ${labels.a20_gate || 'Fast A20 Gate (0x92)'}</text>

      <path d="M420 345 L420 370" class="arrow" />
      <rect x="70" y="370" width="700" height="45" class="box-warn" />
      <text x="420" y="397" text-anchor="middle" class="text-title">💾 ${labels.storage_probe || 'Multi-Bus Storage (ATA, AHCI, NVMe, USB EHCI)'}</text>

      <path d="M420 415 L420 440" class="arrow" />
      <rect x="70" y="440" width="700" height="45" class="box" />
      <text x="420" y="467" text-anchor="middle" class="text-title">📦 ${labels.mbr_load || 'MBR Load to 0x0000:7C00'}</text>

      <path d="M420 485 L420 510" class="arrow" />
      <rect x="70" y="510" width="700" height="50" class="box-success" />
      <text x="420" y="541" text-anchor="middle" class="text-title">🚀 ${labels.os_handover || 'OS Handover (Contract 3)'}</text>
    </svg>`;
  }

  if (targetId === 'kernel_boot') {
    return `<svg viewBox="0 0 840 680" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <rect x="70" y="20" width="700" height="45" class="box" />
      <text x="420" y="47" text-anchor="middle" class="text-title">1️⃣ ${labels.mbr_stage1 || 'MBR Stage 1 (0x7C00)'}</text>

      <path d="M420 65 L420 90" class="arrow" />
      <rect x="70" y="90" width="700" height="45" class="box" />
      <text x="420" y="117" text-anchor="middle" class="text-title">2️⃣ ${labels.stage2_load || 'Stage 2 Loader & E820 Cache'}</text>

      <path d="M420 135 L420 160" class="arrow" />
      <rect x="70" y="160" width="700" height="45" class="box-warn" />
      <text x="420" y="187" text-anchor="middle" class="text-title">3️⃣ ${labels.prot_mode || 'Protected Mode -> x86-64 LA57/PML4 or 32-bit Fallback'}</text>

      <path d="M420 205 L420 230" class="arrow" />
      <rect x="70" y="230" width="700" height="45" class="box-accent" />
      <text x="420" y="257" text-anchor="middle" class="text-title">4️⃣ ${labels.kernel_load || 'Kernel Load at 0x100000 (1 MiB) + Ksyms'}</text>

      <path d="M420 275 L420 300" class="arrow" />
      <rect x="70" y="300" width="700" height="45" class="box" />
      <text x="420" y="327" text-anchor="middle" class="text-title">5️⃣ ${labels.mm_init || 'kmalloc (0x04000000+), PMM (0x08000000+) & Heap (0x10000000+)'}</text>

      <path d="M420 345 L420 370" class="arrow" />
      <rect x="70" y="370" width="700" height="45" class="box" />
      <text x="420" y="397" text-anchor="middle" class="text-title">6️⃣ ${labels.fs_mount || 'Mount IPO_FS (LBA 2048) & Storage Pool + WAL'}</text>

      <path d="M420 415 L420 440" class="arrow" />
      <rect x="70" y="440" width="700" height="45" class="box" />
      <text x="420" y="467" text-anchor="middle" class="text-title">7️⃣ ${labels.drivers_init || 'All-Core SMP, AHCI/VirtIO-Blk, VirGL, Audio & External /drivers/*'}</text>

      <path d="M420 485 L420 510" class="arrow" />
      <rect x="70" y="510" width="700" height="50" class="box-success" />
      <text x="420" y="541" text-anchor="middle" class="text-title">💻 ${labels.launch_shell || 'Interactive Shell (33 Built-ins), Serial & WM'}</text>
    </svg>`;
  }

  if (targetId === 'memory_map') {
    return `<svg viewBox="0 0 840 560" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g transform="translate(50, 20)">
        <!-- Memory Blocks -->
        <rect x="0" y="0" width="740" height="38" class="box" />
        <text x="370" y="24" text-anchor="middle" class="text-title">${labels.ivt_bda || '0x00000 - 0x004FF: IVT & BDA'}</text>

        <rect x="0" y="45" width="740" height="38" class="box" />
        <text x="370" y="69" text-anchor="middle" class="text-title">${labels.boot_mbr || '0x06000 - 0x08FFF: E820 (0x6000), MBR (0x7C00), SMP (0x8000..0x81AF)'}</text>

        <rect x="0" y="90" width="740" height="38" class="box-warn" />
        <text x="370" y="114" text-anchor="middle" class="text-title">${labels.video_ram || '0xA0000 - 0xBFFFF: VGA Text (0xB8000) & Graphics VRAM'}</text>

        <rect x="0" y="135" width="740" height="38" class="box" />
        <text x="370" y="159" text-anchor="middle" class="text-title">${labels.ebda_rom || '0xC0000 - 0xFFFFF: VBIOS, Firmware (0xF000:000C) & 8 KiB Bootblock (0xFE000)'}</text>

        <rect x="0" y="180" width="740" height="48" class="box-accent" />
        <text x="370" y="209" text-anchor="middle" class="text-title">${labels.kernel_bin || '0x00100000+: IPO_OS Kernel Core (1 MiB) & SB16 DMA (0x600000)'}</text>

        <rect x="0" y="235" width="740" height="48" class="box-success" />
        <text x="370" y="264" text-anchor="middle" class="text-title">${labels.user_apps || '0x00800000 - 0x03FFFFFF: Userspace Apps (ELF32 / .bin) & Process Heaps'}</text>

        <rect x="0" y="290" width="740" height="52" class="box" />
        <text x="370" y="321" text-anchor="middle" class="text-title">${labels.kernel_heap || '0x04000000 - 0x0FFFFFFF: kmalloc Pool (64 MiB+) & PMM (0x08000000+)'}</text>

        <rect x="0" y="350" width="740" height="52" class="box-accent" />
        <text x="370" y="381" text-anchor="middle" class="text-title">${labels.user_heaps || '0x10000000+: Isolated Process Heaps, mmap(), Trampolines (0xC0000000), SHM (0xD0000000)'}</text>
      </g>
    </svg>`;
  }

  if (id === 'syscall_pipeline') {
    return `<svg viewBox="0 0 840 500" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <rect x="70" y="20" width="700" height="50" class="box" />
      <text x="420" y="50" text-anchor="middle" class="text-title">👤 ${labels.app_call || 'User Call ipo_syscall()'}</text>

      <path d="M420 70 L420 110" class="arrow" />
      <rect x="70" y="110" width="700" height="50" class="box-warn" />
      <text x="420" y="140" text-anchor="middle" class="text-title">⚡ ${labels.trap_gate || 'int $0x80 Assembly Trap Gate'}</text>

      <path d="M420 160 L420 200" class="arrow" />
      <rect x="70" y="200" width="700" height="50" class="box-accent" />
      <text x="420" y="230" text-anchor="middle" class="text-title">🛡️ ${labels.ring_switch || 'Ring 3 -> Ring 0 CPU Switch'}</text>

      <path d="M420 250 L420 290" class="arrow" />
      <rect x="70" y="290" width="700" height="50" class="box" />
      <text x="420" y="320" text-anchor="middle" class="text-title">⚙️ ${labels.dispatcher || 'Kernel Syscall Dispatcher'}</text>

      <path d="M420 340 L420 380" class="arrow" />
      <rect x="70" y="380" width="700" height="50" class="box-success" />
      <text x="420" y="410" text-anchor="middle" class="text-title">✅ ${labels.return_ring || 'iret Return with Result in EAX'}</text>
    </svg>`;
  }

  if (id === 'fs_layout') {
    return `<svg viewBox="0 0 840 380" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g transform="translate(50, 40)">
        <rect x="0" y="0" width="140" height="80" class="box" />
        <text x="70" y="38" text-anchor="middle" class="text-title">${labels.mbr_title || 'MBR / Pool+WAL'}</text>
        <text x="70" y="56" text-anchor="middle" class="text-desc">${labels.mbr_lba || 'LBA 0..2047'}</text>
        <text x="70" y="70" text-anchor="middle" class="text-desc">${labels.wal_lba || '(WAL 2030..2039)'}</text>

        <rect x="150" y="0" width="140" height="80" class="box-warn" />
        <text x="220" y="45" text-anchor="middle" class="text-title">${labels.superblock_title || 'Superblock'}</text>
        <text x="220" y="65" text-anchor="middle" class="text-desc">${labels.superblock_lba || 'LBA 2048'}</text>

        <rect x="300" y="0" width="140" height="80" class="box" />
        <text x="370" y="45" text-anchor="middle" class="text-title">${labels.bitmap_title || 'Bitmaps'}</text>
        <text x="370" y="65" text-anchor="middle" class="text-desc">${labels.bitmap_desc || 'Inodes + Blocks'}</text>

        <rect x="450" y="0" width="140" height="80" class="box-accent" />
        <text x="520" y="45" text-anchor="middle" class="text-title">${labels.inode_table_title || 'Inode Table'}</text>
        <text x="520" y="65" text-anchor="middle" class="text-desc">${labels.inode_table_desc || '128B per Inode'}</text>

        <rect x="600" y="0" width="140" height="80" class="box-success" />
        <text x="670" y="45" text-anchor="middle" class="text-title">${labels.data_extents_title || 'Data Extents'}</text>
        <text x="670" y="65" text-anchor="middle" class="text-desc">${labels.contiguous_blocks || 'Contiguous Blocks'}</text>
      </g>
    </svg>`;
  }

  if (id === 'pc_assembly_flow') {
    return `<svg viewBox="0 0 840 600" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g transform="translate(70, 20)">
        <rect x="0" y="0" width="700" height="45" class="box-warn" />
        <text x="350" y="27" text-anchor="middle" class="text-title">${labels.esd_prep || 'Step 1: ESD Safety'}</text>

        <path d="M350 45 L350 65" class="arrow" />
        <rect x="0" y="65" width="700" height="45" class="box" />
        <text x="350" y="92" text-anchor="middle" class="text-title">${labels.cpu_install || 'Step 2: CPU Installation'}</text>

        <path d="M350 110 L350 130" class="arrow" />
        <rect x="0" y="130" width="700" height="45" class="box" />
        <text x="350" y="157" text-anchor="middle" class="text-title">${labels.cooler_mount || 'Step 3: CPU Cooler'}</text>

        <path d="M350 175 L350 195" class="arrow" />
        <rect x="0" y="195" width="700" height="45" class="box" />
        <text x="350" y="222" text-anchor="middle" class="text-title">${labels.ram_install || 'Step 4: RAM Insertion'}</text>

        <path d="M350 240 L350 260" class="arrow" />
        <rect x="0" y="260" width="700" height="45" class="box" />
        <text x="350" y="287" text-anchor="middle" class="text-title">${labels.case_mb || 'Step 5: Motherboard Mount'}</text>

        <path d="M350 305 L350 325" class="arrow" />
        <rect x="0" y="325" width="700" height="45" class="box" />
        <text x="350" y="352" text-anchor="middle" class="text-title">${labels.psu_cabling || 'Step 6: PSU 24-pin & EPS'}</text>

        <path d="M350 370 L350 390" class="arrow" />
        <rect x="0" y="390" width="700" height="45" class="box" />
        <text x="350" y="417" text-anchor="middle" class="text-title">${labels.front_panel || 'Step 7: Front Panel Headers'}</text>

        <path d="M350 435 L350 455" class="arrow" />
        <rect x="0" y="455" width="700" height="50" class="box-success" />
        <text x="350" y="486" text-anchor="middle" class="text-title">⚡ ${labels.post_test || 'Step 8: First POST Check'}</text>
      </g>
    </svg>`;
  }

  if (targetId === 'front_panel_pinout') {
    return `<svg viewBox="0 0 840 425" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <!-- Header Pin Connector Box -->
      <g transform="translate(50, 15)">
        <rect x="0" y="0" width="740" height="205" class="box" />
        <text x="370" y="32" text-anchor="middle" class="text-title">${labels.jfp1_title || 'Motherboard JFP1 Front Panel Header'}</text>
        <text x="370" y="52" text-anchor="middle" class="text-desc">${labels.jfp1_subtitle || '9-Pin Keyed Standard Desktop Header (Top View)'}</text>

        <!-- Top Row Group: HDD LED (Pins 2 & 4) -->
        <rect x="70" y="68" width="170" height="60" rx="6" fill="rgba(239, 68, 68, 0.07)" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4" />
        <text x="155" y="84" text-anchor="middle" font-family="var(--font-sans, system-ui)" font-size="11" font-weight="bold" fill="#ef4444">${labels.hdd_led_short || 'HDD LED'}</text>
        <circle cx="115" cy="108" r="13" fill="#ef4444" />
        <text x="115" y="112" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">2</text>
        <text x="135" y="112" font-family="var(--font-mono, monospace)" font-size="11" font-weight="bold" fill="#ef4444">+</text>
        <circle cx="195" cy="108" r="13" fill="#ef4444" />
        <text x="195" y="112" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">4</text>
        <text x="215" y="112" font-family="var(--font-mono, monospace)" font-size="11" font-weight="bold" fill="#ef4444">-</text>

        <!-- Top Row Group: POWER SW (Pins 6 & 8) -->
        <rect x="290" y="68" width="180" height="60" rx="6" fill="rgba(59, 130, 246, 0.07)" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4" />
        <text x="380" y="84" text-anchor="middle" font-family="var(--font-sans, system-ui)" font-size="11" font-weight="bold" fill="#3b82f6">${labels.pwr_sw_short || 'POWER SWITCH'}</text>
        <circle cx="340" cy="108" r="13" fill="#3b82f6" />
        <text x="340" y="112" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">6</text>
        <circle cx="420" cy="108" r="13" fill="#3b82f6" />
        <text x="420" y="112" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">8</text>

        <!-- Top Row: Pin 10 (NC / Empty) -->
        <rect x="530" y="68" width="140" height="60" rx="6" fill="none" stroke="#64748b" stroke-width="1" stroke-dasharray="3" />
        <circle cx="600" cy="108" r="13" fill="none" stroke="#64748b" stroke-width="2" stroke-dasharray="3" />
        <text x="600" y="112" text-anchor="middle" fill="#64748b" font-size="10" font-weight="bold">NC</text>
        <text x="600" y="84" text-anchor="middle" font-family="var(--font-mono, monospace)" font-size="10" fill="#64748b">${labels.pin10_nc || 'No Pin (Pin 10)'}</text>

        <!-- Bottom Row Group: POWER LED (Pins 1 & 3) -->
        <rect x="70" y="136" width="170" height="60" rx="6" fill="rgba(16, 185, 129, 0.07)" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4" />
        <circle cx="115" cy="166" r="13" fill="#10b981" />
        <text x="115" y="170" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">1</text>
        <text x="135" y="170" font-family="var(--font-mono, monospace)" font-size="11" font-weight="bold" fill="#10b981">+</text>
        <circle cx="195" cy="166" r="13" fill="#10b981" />
        <text x="195" y="170" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">3</text>
        <text x="215" y="170" font-family="var(--font-mono, monospace)" font-size="11" font-weight="bold" fill="#10b981">-</text>
        <text x="155" y="191" text-anchor="middle" font-family="var(--font-sans, system-ui)" font-size="11" font-weight="bold" fill="#10b981">${labels.pwr_led_short || 'POWER LED'}</text>

        <!-- Bottom Row Group: RESET SW (Pins 5 & 7) -->
        <rect x="290" y="136" width="180" height="60" rx="6" fill="rgba(245, 158, 11, 0.07)" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4" />
        <circle cx="340" cy="166" r="13" fill="#f59e0b" />
        <text x="340" y="170" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">5</text>
        <circle cx="420" cy="166" r="13" fill="#f59e0b" />
        <text x="420" y="170" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">7</text>
        <text x="380" y="191" text-anchor="middle" font-family="var(--font-sans, system-ui)" font-size="11" font-weight="bold" fill="#f59e0b">${labels.reset_sw_short || 'RESET SWITCH'}</text>

        <!-- Bottom Row: Pin 9 (KEY / Blocked) -->
        <rect x="530" y="136" width="140" height="60" rx="6" fill="rgba(239, 68, 68, 0.05)" stroke="#ef4444" stroke-width="1" stroke-dasharray="3" />
        <rect x="588" y="154" width="24" height="24" rx="4" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3" />
        <text x="600" y="170" text-anchor="middle" fill="#ef4444" font-size="10" font-weight="bold">KEY</text>
        <text x="600" y="191" text-anchor="middle" font-family="var(--font-mono, monospace)" font-size="10" fill="#ef4444">${labels.pin9_key || 'Blocked (Pin 9)'}</text>
      </g>

      <!-- 4 Cards: Informative Connection Legend -->
      <g transform="translate(50, 235)">
        <!-- Card 1: Power LED -->
        <rect x="0" y="0" width="355" height="80" rx="8" class="box-success" />
        <circle cx="20" cy="24" r="6" fill="#10b981" />
        <text x="35" y="28" font-family="var(--font-sans, system-ui)" font-size="13" font-weight="bold" fill="var(--text-primary, #0f172a)">${labels.pwr_led_pins || 'Pins 1 (+), 3 (-) — Power LED'}</text>
        <text x="20" y="55" font-family="var(--font-sans, system-ui)" font-size="12" fill="var(--text-secondary, #475569)">${labels.pwr_led || 'Power Indicator LED (+ to Pin 1, - to Pin 3)'}</text>

        <!-- Card 2: HDD LED -->
        <rect x="385" y="0" width="355" height="80" rx="8" class="box-warn" />
        <circle cx="405" cy="24" r="6" fill="#ef4444" />
        <text x="420" y="28" font-family="var(--font-sans, system-ui)" font-size="13" font-weight="bold" fill="var(--text-primary, #0f172a)">${labels.hdd_led_pins || 'Pins 2 (+), 4 (-) — HDD LED'}</text>
        <text x="405" y="55" font-family="var(--font-sans, system-ui)" font-size="12" fill="var(--text-secondary, #475569)">${labels.hdd_led || 'Storage Activity LED (+ to Pin 2, - to Pin 4)'}</text>

        <!-- Card 3: Reset Switch -->
        <rect x="0" y="92" width="355" height="80" rx="8" class="box" />
        <circle cx="20" cy="116" r="6" fill="#f59e0b" />
        <text x="35" y="120" font-family="var(--font-sans, system-ui)" font-size="13" font-weight="bold" fill="var(--text-primary, #0f172a)">${labels.reset_sw_pins || 'Pins 5, 7 — Reset Switch'}</text>
        <text x="20" y="147" font-family="var(--font-sans, system-ui)" font-size="12" fill="var(--text-secondary, #475569)">${labels.reset_sw || 'Reset Switch (Momentary, no polarity)'}</text>

        <!-- Card 4: Power Switch -->
        <rect x="385" y="92" width="355" height="80" rx="8" class="box-accent" />
        <circle cx="405" cy="116" r="6" fill="#3b82f6" />
        <text x="420" y="120" font-family="var(--font-sans, system-ui)" font-size="13" font-weight="bold" fill="var(--text-primary, #0f172a)">${labels.pwr_sw_pins || 'Pins 6, 8 — Power Switch'}</text>
        <text x="405" y="147" font-family="var(--font-sans, system-ui)" font-size="12" fill="var(--text-secondary, #475569)">${labels.pwr_sw || 'Power Switch (Momentary, no polarity)'}</text>
      </g>
    </svg>`;
  }

  if (targetId === 'net_stack') {
    return `<svg viewBox="0 0 840 500" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <rect x="70" y="20" width="700" height="48" class="box" />
      <text x="420" y="48" text-anchor="middle" class="text-title">🔌 ${labels.nic_driver || 'Modular /drivers/rtl8139 KMD (RTL8139, E1000, VirtIO-Net)'}</text>

      <path d="M420 68 L420 98" class="arrow" />
      <rect x="70" y="98" width="700" height="48" class="box" />
      <text x="420" y="126" text-anchor="middle" class="text-title">📦 ${labels.ethernet_l2 || 'Ethernet II, ARP & ipo_chan ("eth0")'}</text>

      <path d="M420 146 L420 176" class="arrow" />
      <rect x="70" y="176" width="700" height="48" class="box-accent" />
      <text x="420" y="204" text-anchor="middle" class="text-title">🌐 ${labels.ipv4_l3 || 'IPv4, DHCP, ICMP & DNS Resolver'}</text>

      <path d="M420 224 L420 254" class="arrow" />
      <rect x="70" y="254" width="700" height="52" class="box-warn" />
      <text x="420" y="285" text-anchor="middle" class="text-title">🔄 ${labels.transport_l4 || 'TCP State Machine, UDP & BearSSL TLS'}</text>

      <path d="M420 306 L420 336" class="arrow" />
      <rect x="70" y="336" width="700" height="52" class="box-success" />
      <text x="420" y="367" text-anchor="middle" class="text-title">📡 ${labels.socket_api || 'POSIX-like Sockets (0x1090..0x109F)'}</text>
    </svg>`;
  }

  if (targetId === 'spi_flashing_pinout') {
    return `<svg viewBox="0 0 840 480" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g transform="translate(40, 20)">
        <rect x="0" y="0" width="340" height="420" class="box-warn" />
        <text x="170" y="35" text-anchor="middle" class="text-title">📟 ${labels.prog_title || 'CH341A Programmer (USB)'}</text>
        <rect x="30" y="70" width="280" height="35" class="box" />
        <text x="170" y="93" text-anchor="middle" class="text-desc">${labels.pin1_cs || 'Pin 1: CS# (Chip Select)'}</text>
        <rect x="30" y="115" width="280" height="35" class="box" />
        <text x="170" y="138" text-anchor="middle" class="text-desc">${labels.pin2_miso || 'Pin 2: MISO (Data Out)'}</text>
        <rect x="30" y="160" width="280" height="35" class="box" />
        <text x="170" y="183" text-anchor="middle" class="text-desc">${labels.pin3_wp || 'Pin 3: WP# (Write Protect -> 3.3V)'}</text>
        <rect x="30" y="205" width="280" height="35" class="box" />
        <text x="170" y="228" text-anchor="middle" class="text-desc">${labels.pin4_gnd || 'Pin 4: GND (Ground)'}</text>
        <rect x="30" y="250" width="280" height="35" class="box" />
        <text x="170" y="273" text-anchor="middle" class="text-desc">${labels.pin5_mosi || 'Pin 5: MOSI (Data In)'}</text>
        <rect x="30" y="295" width="280" height="35" class="box" />
        <text x="170" y="318" text-anchor="middle" class="text-desc">${labels.pin6_clk || 'Pin 6: CLK (Serial Clock)'}</text>
        <rect x="30" y="340" width="280" height="35" class="box" />
        <text x="170" y="363" text-anchor="middle" class="text-desc">${labels.pin7_hold || 'Pin 7: HOLD# (Hold -> 3.3V)'}</text>
        <rect x="30" y="385" width="280" height="30" class="box-success" />
        <text x="170" y="405" text-anchor="middle" class="text-desc">${labels.pin8_vcc || 'Pin 8: VCC (3.3V Power)'}</text>

        <path d="M340 87 L420 87" class="arrow" />
        <path d="M340 132 L420 132" class="arrow" />
        <path d="M340 222 L420 222" class="arrow" />
        <path d="M340 267 L420 267" class="arrow" />
        <path d="M340 312 L420 312" class="arrow" />
        <path d="M340 400 L420 400" class="arrow" />

        <rect x="420" y="0" width="340" height="420" class="box-accent" />
        <text x="590" y="35" text-anchor="middle" class="text-title">💾 ${labels.chip_title || 'SOIC-8 SPI Flash (128 KiB..16 MiB)'}</text>
        <rect x="450" y="70" width="280" height="35" class="box" />
        <text x="590" y="93" text-anchor="middle" class="text-desc">Pin 1: /CS -> Pin 1</text>
        <rect x="450" y="115" width="280" height="35" class="box" />
        <text x="590" y="138" text-anchor="middle" class="text-desc">Pin 2: DO (MISO) -> Pin 2</text>
        <rect x="450" y="160" width="280" height="35" class="box" />
        <text x="590" y="183" text-anchor="middle" class="text-desc">Pin 3: /WP -> VCC</text>
        <rect x="450" y="205" width="280" height="35" class="box" />
        <text x="590" y="228" text-anchor="middle" class="text-desc">Pin 4: GND -> Ground</text>
        <rect x="450" y="250" width="280" height="35" class="box" />
        <text x="590" y="273" text-anchor="middle" class="text-desc">Pin 5: DI (MOSI) -> Pin 5</text>
        <rect x="450" y="295" width="280" height="35" class="box" />
        <text x="590" y="318" text-anchor="middle" class="text-desc">Pin 6: CLK -> Pin 6</text>
        <rect x="450" y="340" width="280" height="35" class="box" />
        <text x="590" y="363" text-anchor="middle" class="text-desc">Pin 7: /HOLD -> VCC</text>
        <rect x="450" y="385" width="280" height="30" class="box-success" />
        <text x="590" y="405" text-anchor="middle" class="text-desc">Pin 8: VCC -> 3.3V</text>
      </g>
    </svg>`;
  }

  if (targetId === 'process_scheduler') {
    return `<svg viewBox="0 0 840 440" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g transform="translate(40, 20)">
        <rect x="20" y="150" width="150" height="60" class="box" />
        <text x="95" y="185" text-anchor="middle" class="text-title">${labels.state_created || 'CREATED'}</text>

        <path d="M170 180 L230 180" class="arrow" />

        <rect x="230" y="150" width="150" height="60" class="box-accent" />
        <text x="305" y="185" text-anchor="middle" class="text-title">${labels.state_ready || 'READY'}</text>

        <path d="M380 165 L460 165" class="arrow" />
        <text x="420" y="155" text-anchor="middle" class="text-desc">${labels.tr_schedule || 'SMP Schedule (0xE0 IPI)'}</text>

        <path d="M460 195 L380 195" class="arrow" />
        <text x="420" y="215" text-anchor="middle" class="text-desc">${labels.tr_preempt || 'Preempt / Yield'}</text>

        <rect x="460" y="150" width="150" height="60" class="box-success" />
        <text x="535" y="185" text-anchor="middle" class="text-title">${labels.state_running || 'RUNNING'}</text>

        <path d="M610 180 L670 180" class="arrow" />
        <text x="640" y="170" text-anchor="middle" class="text-desc">${labels.tr_exit || 'exit()'}</text>

        <rect x="670" y="150" width="130" height="60" class="box-warn" />
        <text x="735" y="185" text-anchor="middle" class="text-title">${labels.state_terminated || 'TERMINATED'}</text>

        <path d="M535 210 L535 300" class="arrow" />
        <text x="545" y="260" class="text-desc">${labels.tr_block || 'Block (Futex/IPC/Input)'}</text>

        <rect x="360" y="300" width="220" height="60" class="box" />
        <text x="470" y="335" text-anchor="middle" class="text-title">${labels.state_blocked || 'WAITING / BLOCKED'}</text>

        <path d="M360 330 L305 330 L305 210" class="arrow" />
        <text x="290" y="280" text-anchor="end" class="text-desc">${labels.tr_wakeup || 'Wakeup Event'}</text>
      </g>
    </svg>`;
  }

  if (targetId === 'car_memory_layout') {
    return `<svg viewBox="0 0 840 460" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g transform="translate(50, 20)">
        <rect x="0" y="0" width="740" height="40" class="box-warn" />
        <text x="370" y="25" text-anchor="middle" class="text-title">${labels.mtrr_config || 'MSR 0x250/0x258/0x268-0x26F: MTRR CAR Setup or 0x2E .car_bypass Fallback'}</text>

        <rect x="0" y="55" width="740" height="55" class="box-accent" />
        <text x="370" y="82" text-anchor="middle" class="text-title">${labels.car_range || '0x70000 - 0x77FFF: 32 KiB Cache-as-RAM SRAM Working Area'}</text>
        <text x="370" y="100" text-anchor="middle" class="text-desc">${labels.cache_lines || 'L1/L2 Data Cache lines pinned as temporary read/write SRAM before DRAM'}</text>

        <rect x="0" y="125" width="740" height="55" class="box-success" />
        <text x="370" y="152" text-anchor="middle" class="text-title">${labels.stack_top || '0x78000 / 0x77FF0: CAR Initial Stack (ESP = 0x00078000)'}</text>
        <text x="370" y="170" text-anchor="middle" class="text-desc">${labels.c_runtime || 'Backs 32-bit Flash-XIP C romstage for chipset probing, SPD & cold DRAM init'}</text>

        <rect x="0" y="195" width="740" height="50" class="box" />
        <text x="370" y="222" text-anchor="middle" class="text-title">${labels.mrc_zone || '0x70000 - 0x73FFF: SPD EEPROM Readouts & Host-Bridge Scratch Buffers'}</text>

        <rect x="0" y="260" width="740" height="50" class="box" />
        <text x="370" y="287" text-anchor="middle" class="text-title">${labels.post_logs || '0x74000 - 0x77FFF: Boot Progress Frame & romstage C Call Stack'}</text>

        <rect x="0" y="325" width="740" height="55" class="box-warn" />
        <text x="370" y="352" text-anchor="middle" class="text-title">⚡ ${labels.teardown_phase || 'CAR Teardown: Write-Back / INVD & Switch Stack to Physical DRAM (0x9000)'}</text>
        <text x="370" y="370" text-anchor="middle" class="text-desc">${labels.teardown_desc || 'Normal caching restored via CR0.CD=0; 56 KiB Firmware copied to 0xF0000 shadow RAM'}</text>
      </g>
    </svg>`;
  }

  if (targetId === 'chipset_init_flow') {
    return `<svg viewBox="0 0 840 500" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <rect x="70" y="20" width="700" height="48" class="box-warn" />
      <text x="420" y="48" text-anchor="middle" class="text-title">🔍 ${labels.probe_bridge || '1. Probe PCI 0:0.0 Device/Vendor ID (i440FX 0x1237 vs Q35 0x29C0)'}</text>

      <path d="M420 68 L420 98" class="arrow" />
      <rect x="70" y="98" width="700" height="48" class="box" />
      <text x="420" y="126" text-anchor="middle" class="text-title">⚙️ ${labels.smram_ctrl || '2. SMBus SPD Detection, Cold DRAM Initialization & DRAM R/W Verify'}</text>

      <path d="M420 146 L420 176" class="arrow" />
      <rect x="70" y="176" width="700" height="48" class="box-accent" />
      <text x="420" y="204" text-anchor="middle" class="text-title">🧠 ${labels.pam_config || '3. Program PAM0-PAM6 (RW 0x30): Copy 56 KiB Firmware Bank to 0xF0000'}</text>

      <path d="M420 224 L420 254" class="arrow" />
      <rect x="70" y="254" width="700" height="48" class="box" />
      <text x="420" y="282" text-anchor="middle" class="text-title">🔌 ${labels.piix_routing || '4. Configure 8259 PIC, 8254 PIT & Verify 12 B IPO_Firmware Magic'}</text>

      <path d="M420 302 L420 332" class="arrow" />
      <rect x="70" y="332" width="700" height="48" class="box-success" />
      <text x="420" y="360" text-anchor="middle" class="text-title">🔒 ${labels.lock_pam || '5. Set PAM0 Read-Enable (RE 0x10) & Jump to 0xF000:000C'}</text>
    </svg>`;
  }

  if (targetId === 'pci_bus_topology') {
    return `<svg viewBox="0 0 840 460" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g transform="translate(40, 20)">
        <rect x="200" y="10" width="360" height="55" class="box-warn" />
        <text x="380" y="38" text-anchor="middle" class="text-title">${labels.host_bridge || 'PCI Host Bridge (Bus 0, Dev 0, Func 0)'}</text>
        <text x="380" y="55" text-anchor="middle" class="text-desc">${labels.pci_ports || 'I/O Ports: 0xCF8 (Address) & 0xCFC (Data) • BAR Alloc 0xFE800000+'}</text>

        <path d="M380 65 L380 110" class="arrow" />
        <path d="M80 110 L680 110" stroke="var(--accent-primary, #3b82f6)" stroke-width="2" fill="none" />

        <!-- Dev 01: Storage -->
        <path d="M120 110 L120 150" class="arrow" />
        <rect x="30" y="150" width="180" height="80" class="box" />
        <text x="120" y="180" text-anchor="middle" class="text-title">${labels.dev_storage || 'Storage Controllers'}</text>
        <text x="120" y="200" text-anchor="middle" class="text-desc">${labels.dev_storage_sub || 'IDE / AHCI / NVMe'}</text>
        <text x="120" y="218" text-anchor="middle" class="text-desc">${labels.dev_storage_io || 'VirtIO-Blk & Ports'}</text>

        <!-- Dev 02: Display GPU -->
        <path d="M300 110 L300 150" class="arrow" />
        <rect x="210" y="150" width="180" height="80" class="box-accent" />
        <text x="300" y="180" text-anchor="middle" class="text-title">${labels.dev_gpu || 'Display / GPU'}</text>
        <text x="300" y="200" text-anchor="middle" class="text-desc">${labels.dev_gpu_sub || 'BGA / VirtIO-GPU 3D'}</text>
        <text x="300" y="218" text-anchor="middle" class="text-desc">${labels.dev_gpu_io || 'BAR0 LFB + VirGL'}</text>

        <!-- Dev 03: Network KMD -->
        <path d="M480 110 L480 150" class="arrow" />
        <rect x="390" y="150" width="180" height="80" class="box-success" />
        <text x="480" y="180" text-anchor="middle" class="text-title">${labels.dev_nic || 'Ethernet KMD'}</text>
        <text x="480" y="200" text-anchor="middle" class="text-desc">${labels.dev_nic_sub || 'RTL8139/E1000/VNet'}</text>
        <text x="480" y="218" text-anchor="middle" class="text-desc">${labels.dev_nic_io || 'PIRQ / ELCR Routed'}</text>

        <!-- Dev 04: Audio & USB -->
        <path d="M660 110 L660 150" class="arrow" />
        <rect x="570" y="150" width="180" height="80" class="box" />
        <text x="660" y="180" text-anchor="middle" class="text-title">${labels.dev_usb_audio || 'Audio & USB'}</text>
        <text x="660" y="200" text-anchor="middle" class="text-desc">${labels.dev_usb_audio_sub || 'HDA / AC97 / VirtIO-Snd'}</text>
        <text x="660" y="218" text-anchor="middle" class="text-desc">${labels.dev_usb_audio_io || 'USB EHCI & UHCI'}</text>

        <rect x="80" y="270" width="600" height="60" class="box-accent" />
        <text x="380" y="297" text-anchor="middle" class="text-title">${labels.bus_scan_title || 'Firmware Scan: Buses 0..7 x 32 Devices x 8 Functions'}</text>
        <text x="380" y="318" text-anchor="middle" class="text-desc">${labels.bus_scan_desc || 'Dynamic MMIO (0xFE800000+) & I/O (0xC000+) BAR allocator + PIRQ swizzle'}</text>
      </g>
    </svg>`;
  }

  if (targetId === 'storage_transfer_flow') {
    return `<svg viewBox="0 0 840 460" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g transform="translate(50, 20)">
        <rect x="0" y="0" width="740" height="50" class="box" />
        <text x="370" y="30" text-anchor="middle" class="text-title">${labels.st_step1 || '1. IPO_FS & Storage Pool + WAL: Request 64-bit Block LBA'}</text>

        <path d="M370 50 L370 85" class="arrow" />
        <rect x="0" y="85" width="740" height="50" class="box-warn" />
        <text x="370" y="115" text-anchor="middle" class="text-title">${labels.st_step2 || '2. Block Layer Dispatch: VirtIO-Blk / AHCI SATA DMA / ATA PIO'}</text>

        <path d="M370 135 L370 170" class="arrow" />
        <rect x="0" y="170" width="740" height="55" class="box-accent" />
        <text x="370" y="195" text-anchor="middle" class="text-title">${labels.st_step3 || '3. Hardware I/O (ATA Task File 0x1F2..0x1F7 or PRDT/Virtqueue)'}</text>
        <text x="370" y="214" text-anchor="middle" class="text-desc">${labels.st_step3_desc || 'Issue 512B Sector Read/Write Command & Submit DMA/PIO Transfer'}</text>

        <path d="M370 225 L370 260" class="arrow" />
        <rect x="0" y="260" width="740" height="50" class="box" />
        <text x="370" y="290" text-anchor="middle" class="text-title">${labels.st_step4 || '4. Poll Controller Status (BSY/DRQ) or DMA Ring Completion'}</text>

        <path d="M370 310 L370 345" class="arrow" />
        <rect x="0" y="345" width="740" height="55" class="box-success" />
        <text x="370" y="370" text-anchor="middle" class="text-title">${labels.st_step5 || '5. Commit Sectors to RAM Buffer & WAL Checkpoint'}</text>
        <text x="370" y="389" text-anchor="middle" class="text-desc">${labels.st_step5_desc || 'Extents & dynamic inode chunks verified in IPO_FS block layer'}</text>
      </g>
    </svg>`;
  }

  if (targetId === 'interrupt_routing') {
    return `<svg viewBox="0 0 840 500" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g transform="translate(30, 20)">
        <!-- Hardware Sources -->
        <rect x="0" y="20" width="230" height="180" class="box-warn" />
        <text x="115" y="48" text-anchor="middle" class="text-title">${labels.irq_hw_title || 'Hardware IRQs & IPIs'}</text>
        <text x="115" y="75" text-anchor="middle" class="text-desc">${labels.irq_0 || 'IRQ 0: PIT Timer (0x20)'}</text>
        <text x="115" y="98" text-anchor="middle" class="text-desc">${labels.irq_1 || 'IRQ 1: PS/2 Kbd (0x21)'}</text>
        <text x="115" y="121" text-anchor="middle" class="text-desc">${labels.irq_5 || 'IRQ 5/11: SB16 / NIC KMD'}</text>
        <text x="115" y="144" text-anchor="middle" class="text-desc">${labels.irq_12 || 'IRQ 12: PS/2 Mouse (0x2C)'}</text>
        <text x="115" y="167" text-anchor="middle" class="text-desc">${labels.irq_ipi || 'LAPIC IPI 0xE0: SMP Resched'}</text>

        <!-- CPU Traps & Syscall -->
        <rect x="0" y="230" width="230" height="180" class="box-accent" />
        <text x="115" y="260" text-anchor="middle" class="text-title">${labels.traps_title || 'CPU Traps & Syscalls'}</text>
        <text x="115" y="290" text-anchor="middle" class="text-desc">0x00: Divide Error (#DE)</text>
        <text x="115" y="315" text-anchor="middle" class="text-desc">0x0D: Protection Fault (#GP)</text>
        <text x="115" y="340" text-anchor="middle" class="text-desc">0x0E: #PF (Dynamic Stack)</text>
        <text x="115" y="375" text-anchor="middle" class="text-title">${labels.trap_80 || 'int $0x80: 305 Syscalls'}</text>

        <path d="M230 110 L300 230" class="arrow" />
        <path d="M230 320 L300 250" class="arrow" />

        <!-- IDT Table -->
        <rect x="300" y="120" width="220" height="220" class="box" />
        <text x="410" y="155" text-anchor="middle" class="text-title">${labels.idt_title || 'IDT (256 Entries)'}</text>
        <text x="410" y="180" text-anchor="middle" class="text-desc">${labels.idt_desc1 || '32-bit 8B / 64-bit 16B gates'}</text>
        <text x="410" y="210" text-anchor="middle" class="text-desc">${labels.idt_desc2 || '0x00-0x1F: CPU Exceptions'}</text>
        <text x="410" y="235" text-anchor="middle" class="text-desc">${labels.idt_desc3 || '0x20-0x2F: Remapped 8259 PIC'}</text>
        <text x="410" y="260" text-anchor="middle" class="text-desc">${labels.idt_desc4 || '0x80: Syscall | 0xE0: SMP IPI'}</text>
        <text x="410" y="295" text-anchor="middle" class="text-desc">${labels.idt_desc5 || 'DPL=3 for 0x80; DPL=0 for IRQs'}</text>

        <path d="M520 230 L580 230" class="arrow" />

        <!-- Ring 0 Handlers -->
        <rect x="580" y="40" width="200" height="370" class="box-success" />
        <text x="680" y="70" text-anchor="middle" class="text-title">${labels.ring0_handlers || 'Ring 0 Handlers'}</text>
        <text x="680" y="110" text-anchor="middle" class="text-desc">timer_isr() &amp; SMP tick</text>
        <text x="680" y="145" text-anchor="middle" class="text-desc">keyboard_isr() / mouse_isr()</text>
        <text x="680" y="180" text-anchor="middle" class="text-desc">irq_dispatch() (.kmd hooks)</text>
        <text x="680" y="215" text-anchor="middle" class="text-desc">page_fault_grow_stack()</text>
        <text x="680" y="250" text-anchor="middle" class="text-desc">lapic_ipi_handler(0xE0)</text>
        <text x="680" y="290" text-anchor="middle" class="text-desc">syscall_dispatch(int 0x80)</text>
        <text x="680" y="340" text-anchor="middle" class="text-title">${labels.eoi_text || 'PIC / LAPIC EOI'}</text>
        <text x="680" y="370" text-anchor="middle" class="text-desc">${labels.iret_text || 'iret / iretq return'}</text>
      </g>
    </svg>`;
  }

  if (targetId === 'driver_architecture') {
    return `<svg viewBox="0 0 840 480" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g transform="translate(50, 20)">
        <!-- Layer 1: KMOD & Syscalls / Extensions -->
        <rect x="0" y="0" width="740" height="55" class="box" />
        <text x="370" y="28" text-anchor="middle" class="text-title">${labels.drv_layer1 || 'External /drivers/* Executables & KMOD (.kmd) + IPO Extensions'}</text>
        <text x="370" y="46" text-anchor="middle" class="text-desc">${labels.drv_layer1_desc || 'kmod_load_file(), ipo_ext_*(), ipo_chan_*() ("eth0"), Dynamic Syscalls 0x1090..0x109F'}</text>

        <path d="M370 55 L370 95" class="arrow" />

        <!-- Layer 2: Kernel Device & Driver Registry -->
        <rect x="0" y="95" width="740" height="60" class="box-accent" />
        <text x="370" y="125" text-anchor="middle" class="text-title">${labels.drv_layer2 || 'Kernel Device Registry & Driver Model (device_node_t / driver_t)'}</text>
        <text x="370" y="143" text-anchor="middle" class="text-desc">${labels.drv_layer2_desc || 'Spinlock-synced dynamic nodes • 64-bit MMIO/DMA (0x1170..74) & IRQ hooks (0x1160..65)'}</text>

        <path d="M370 155 L370 195" class="arrow" />

        <!-- Layer 3: Built-in & External Subsystems -->
        <rect x="0" y="195" width="170" height="110" class="box-warn" />
        <text x="85" y="225" text-anchor="middle" class="text-title">${labels.drv_storage || 'Storage Drivers'}</text>
        <text x="85" y="250" text-anchor="middle" class="text-desc">${labels.drv_storage_1 || 'AHCI SATA DMA'}</text>
        <text x="85" y="270" text-anchor="middle" class="text-desc">${labels.drv_storage_2 || 'VirtIO-Blk PCI'}</text>
        <text x="85" y="290" text-anchor="middle" class="text-desc">${labels.drv_storage_3 || 'ATA PIO Fallback'}</text>

        <rect x="190" y="195" width="170" height="110" class="box-warn" />
        <text x="275" y="225" text-anchor="middle" class="text-title">${labels.drv_input || 'Input Drivers'}</text>
        <text x="275" y="250" text-anchor="middle" class="text-desc">${labels.drv_input_1 || 'PS/2 Kbd & Mouse'}</text>
        <text x="275" y="270" text-anchor="middle" class="text-desc">${labels.drv_input_2 || '/drivers/touchpad'}</text>
        <text x="275" y="290" text-anchor="middle" class="text-desc">${labels.drv_input_3 || '/drivers/gamepad'}</text>

        <rect x="380" y="195" width="170" height="110" class="box-warn" />
        <text x="465" y="225" text-anchor="middle" class="text-title">${labels.drv_net || 'Network KMDs'}</text>
        <text x="465" y="250" text-anchor="middle" class="text-desc">${labels.drv_net_1 || '/drivers/rtl8139'}</text>
        <text x="465" y="270" text-anchor="middle" class="text-desc">${labels.drv_net_2 || 'E1000 & VirtIO-Net'}</text>
        <text x="465" y="290" text-anchor="middle" class="text-desc">${labels.drv_net_3 || '/drivers/custom_proto'}</text>

        <rect x="570" y="195" width="170" height="110" class="box-warn" />
        <text x="655" y="225" text-anchor="middle" class="text-title">${labels.drv_av || 'GPU & Audio'}</text>
        <text x="655" y="250" text-anchor="middle" class="text-desc">${labels.drv_av_1 || 'VirtIO-GPU + VirGL 3D'}</text>
        <text x="655" y="270" text-anchor="middle" class="text-desc">${labels.drv_av_2 || 'BGA LFB & VGA'}</text>
        <text x="655" y="290" text-anchor="middle" class="text-desc">${labels.drv_av_3 || 'HDA/AC97/SB16/VSnd'}</text>

        <path d="M85 305 L85 345" class="arrow" />
        <path d="M275 305 L275 345" class="arrow" />
        <path d="M465 305 L465 345" class="arrow" />
        <path d="M655 305 L655 345" class="arrow" />

        <!-- Layer 4: Physical Hardware -->
        <rect x="0" y="345" width="740" height="55" class="box-success" />
        <text x="370" y="373" text-anchor="middle" class="text-title">${labels.drv_hw || 'Physical Hardware (PCIe/PCI, SATA, USB, LPC/ISA, MMIO, Port I/O)'}</text>
        <text x="370" y="391" text-anchor="middle" class="text-desc">${labels.drv_hw_desc || 'Ring 0 MMIO/DMA grants; kernel-resolved symbols for .kmd modules'}</text>
      </g>
    </svg>`;
  }

  if (targetId === 'ipc_architecture') {
    return `<svg viewBox="0 0 840 480" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g transform="translate(40, 20)">
        <!-- Process 1 -->
        <rect x="20" y="60" width="180" height="280" class="box-accent" />
        <text x="110" y="95" text-anchor="middle" class="text-title">${labels.proc_a || 'Process A (Producer)'}</text>
        <text x="110" y="120" text-anchor="middle" class="text-desc">${labels.ring3_user || 'Ring 3 Userspace'}</text>
        <text x="110" y="150" text-anchor="middle" class="text-desc">${labels.proc_a_sub1 || 'Named Endpoint Cap'}</text>
        <text x="110" y="190" text-anchor="middle" class="text-desc">${labels.proc_a_sub2 || 'Pipe Writer FD'}</text>
        <text x="110" y="220" text-anchor="middle" class="text-desc">${labels.proc_a_sub3 || 'SHM (0xD0000000+)'}</text>
        <text x="110" y="260" text-anchor="middle" class="text-desc">${labels.proc_a_sub4 || 'kill() / futex wake'}</text>
        <text x="110" y="300" text-anchor="middle" class="text-title">ipo_ipc_send()</text>

        <!-- Kernel IPC Core -->
        <rect x="250" y="20" width="260" height="380" class="box-warn" />
        <text x="380" y="55" text-anchor="middle" class="text-title">${labels.ipc_core || 'Kernel IPC & Sync (Ring 0)'}</text>

        <rect x="270" y="80" width="220" height="55" class="box" />
        <text x="380" y="105" text-anchor="middle" class="text-title">${labels.ipc_msg || 'Dynamic Endpoints'}</text>
        <text x="380" y="122" text-anchor="middle" class="text-desc">${labels.ipc_msg_desc || 'Self-expanding msgs & rights'}</text>

        <rect x="270" y="150" width="220" height="55" class="box" />
        <text x="380" y="175" text-anchor="middle" class="text-title">${labels.ipc_pipes || 'Named/Anon Pipes'}</text>
        <text x="380" y="192" text-anchor="middle" class="text-desc">${labels.ipc_pipes_desc || 'Self-expanding ring buffer'}</text>

        <rect x="270" y="220" width="220" height="55" class="box" />
        <text x="380" y="245" text-anchor="middle" class="text-title">${labels.ipc_sig || 'Signals & Futex'}</text>
        <text x="380" y="262" text-anchor="middle" class="text-desc">${labels.ipc_sig_desc || 'sigaction, pthreads, 0x1205'}</text>

        <rect x="270" y="290" width="220" height="55" class="box" />
        <text x="380" y="315" text-anchor="middle" class="text-title">${labels.ipc_shm || 'Shared Memory (SHM)'}</text>
        <text x="380" y="332" text-anchor="middle" class="text-desc">${labels.ipc_shm_desc || 'Zero-copy 0xD0000000+ pages'}</text>

        <!-- Process 2 -->
        <rect x="560" y="60" width="180" height="280" class="box-success" />
        <text x="650" y="95" text-anchor="middle" class="text-title">${labels.proc_b || 'Process B (Consumer)'}</text>
        <text x="650" y="120" text-anchor="middle" class="text-desc">${labels.ring3_user || 'Ring 3 Userspace'}</text>
        <text x="650" y="150" text-anchor="middle" class="text-desc">${labels.proc_b_sub1 || 'Endpoint Receiver'}</text>
        <text x="650" y="190" text-anchor="middle" class="text-desc">${labels.proc_b_sub2 || 'Pipe Reader FD'}</text>
        <text x="650" y="220" text-anchor="middle" class="text-desc">${labels.proc_b_sub3 || 'Attached SHM Pages'}</text>
        <text x="650" y="260" text-anchor="middle" class="text-desc">${labels.proc_b_sub4 || 'Signal / Futex Wait'}</text>
        <text x="650" y="300" text-anchor="middle" class="text-title">ipo_ipc_receive()</text>

        <path d="M200 110 L250 110" class="arrow" />
        <path d="M510 110 L560 110" class="arrow" />
        <path d="M200 180 L250 180" class="arrow" />
        <path d="M510 180 L560 180" class="arrow" />
        <path d="M200 320 L250 320" class="arrow" />
        <path d="M510 320 L560 320" class="arrow" />
      </g>
    </svg>`;
  }

  if (targetId === 'window_manager') {
    return `<svg viewBox="0 0 840 440" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g transform="translate(40, 20)">
        <rect x="20" y="30" width="220" height="90" class="box-accent" />
        <text x="130" y="65" text-anchor="middle" class="text-title">${labels.wm_client1 || 'WM App Windows'}</text>
        <text x="130" y="90" text-anchor="middle" class="text-desc">${labels.wm_client1_desc || 'wm_poll_event() & Buffers'}</text>

        <rect x="20" y="150" width="220" height="90" class="box-accent" />
        <text x="130" y="185" text-anchor="middle" class="text-title">${labels.wm_client2 || '2D/HDR Apps (links, SENSE)'}</text>
        <text x="130" y="210" text-anchor="middle" class="text-desc">${labels.wm_client2_desc || 'RGBA64F -> Native Format'}</text>

        <rect x="20" y="270" width="220" height="90" class="box-accent" />
        <text x="130" y="305" text-anchor="middle" class="text-title">${labels.wm_client3 || '3D OpenGL (gl_cube/teapot)'}</text>
        <text x="130" y="330" text-anchor="middle" class="text-desc">${labels.wm_client3_desc || 'VirGL 3D (0x11F0..F7) / CPU'}</text>

        <path d="M240 75 L330 180" class="arrow" />
        <path d="M240 195 L330 195" class="arrow" />
        <path d="M240 315 L330 210" class="arrow" />

        <rect x="330" y="120" width="200" height="150" class="box-warn" />
        <text x="430" y="160" text-anchor="middle" class="text-title">${labels.wm_comp || 'WM Compositor'}</text>
        <text x="430" y="188" text-anchor="middle" class="text-desc">${labels.wm_comp_desc1 || 'Dynamic Term-Matched Res'}</text>
        <text x="430" y="212" text-anchor="middle" class="text-desc">${labels.wm_comp_desc2 || 'Z-Order & Pixel Cursor'}</text>
        <text x="430" y="236" text-anchor="middle" class="text-desc">${labels.wm_comp_desc3 || 'wm_compositor_tick()'}</text>

        <path d="M530 195 L600 195" class="arrow" />

        <rect x="600" y="110" width="180" height="170" class="box-success" />
        <text x="690" y="155" text-anchor="middle" class="text-title">${labels.wm_hw || 'GPU & Display'}</text>
        <text x="690" y="185" text-anchor="middle" class="text-title">${labels.wm_hw_sub || 'Hardware LFB / 3D'}</text>
        <text x="690" y="215" text-anchor="middle" class="text-desc">${labels.wm_hw_d1 || 'BGA / VirtIO-GPU 2D+VirGL'}</text>
        <text x="690" y="240" text-anchor="middle" class="text-desc">${labels.wm_hw_d2 || 'Mode 13h Fallback / MMIO'}</text>
      </g>
    </svg>`;
  }

  return `<svg viewBox="0 0 600 200" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
    ${style}
    <rect x="10" y="10" width="580" height="180" class="box" />
    <text x="300" y="105" text-anchor="middle" class="text-title">Diagram: ${id}</text>
  </svg>`;
}
