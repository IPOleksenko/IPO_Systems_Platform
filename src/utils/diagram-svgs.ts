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

  if (id === 'boot_rom_flow') {
    return `<svg viewBox="0 0 840 680" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <!-- Steps 1 to 9 -->
      <rect x="70" y="20" width="700" height="45" class="box-warn" />
      <text x="420" y="47" text-anchor="middle" class="text-title">${labels.reset_vector || 'Reset Vector'}</text>

      <path d="M420 65 L420 90" class="arrow" />
      <rect x="70" y="90" width="700" height="45" class="box" />
      <text x="420" y="117" text-anchor="middle" class="text-title">${labels.jump_base || 'Jump ROM Base'}</text>

      <path d="M420 135 L420 160" class="arrow" />
      <rect x="70" y="160" width="700" height="45" class="box-accent" />
      <text x="420" y="187" text-anchor="middle" class="text-title">${labels.car_setup || 'CAR Setup'}</text>

      <path d="M420 205 L420 230" class="arrow" />
      <rect x="70" y="230" width="700" height="45" class="box" />
      <text x="420" y="257" text-anchor="middle" class="text-title">${labels.chipset_probe || 'Chipset Probe'}</text>

      <path d="M420 275 L420 300" class="arrow" />
      <rect x="70" y="300" width="700" height="45" class="box-success" />
      <text x="420" y="327" text-anchor="middle" class="text-title">${labels.mrc_training || 'MRC Training'}</text>

      <path d="M420 345 L420 370" class="arrow" />
      <rect x="70" y="370" width="700" height="45" class="box" />
      <text x="420" y="397" text-anchor="middle" class="text-title">${labels.car_teardown || 'CAR Teardown'}</text>

      <path d="M420 415 L420 440" class="arrow" />
      <rect x="70" y="440" width="700" height="45" class="box" />
      <text x="420" y="467" text-anchor="middle" class="text-title">${labels.pic_pit || 'PIC & PIT'}</text>

      <path d="M420 485 L420 510" class="arrow" />
      <rect x="70" y="510" width="700" height="45" class="box" />
      <text x="420" y="537" text-anchor="middle" class="text-title">${labels.shadow_ram || 'PAM Shadow RAM'}</text>

      <path d="M420 555 L420 580" class="arrow" />
      <rect x="70" y="580" width="700" height="50" class="box-success" />
      <text x="420" y="611" text-anchor="middle" class="text-title">➡️ ${labels.handover || 'Handover Contract 2'}</text>
    </svg>`;
  }

  if (id === 'firmware_flow') {
    return `<svg viewBox="0 0 840 680" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <rect x="70" y="20" width="700" height="45" class="box-accent" />
      <text x="420" y="47" text-anchor="middle" class="text-title">📥 ${labels.entry || 'Entry (0xF000:0004)'}</text>

      <path d="M420 65 L420 90" class="arrow" />
      <rect x="70" y="90" width="700" height="45" class="box" />
      <text x="420" y="117" text-anchor="middle" class="text-title">⚙️ ${labels.ivt_setup || 'IVT Setup'}</text>

      <path d="M420 135 L420 160" class="arrow" />
      <rect x="70" y="160" width="700" height="45" class="box" />
      <text x="420" y="187" text-anchor="middle" class="text-title">📋 ${labels.bda_ebda || 'BDA & EBDA ACPI'}</text>

      <path d="M420 205 L420 230" class="arrow" />
      <rect x="70" y="230" width="700" height="45" class="box" />
      <text x="420" y="257" text-anchor="middle" class="text-title">🔍 ${labels.pci_enum || 'PCI Enumeration'}</text>

      <path d="M420 275 L420 300" class="arrow" />
      <rect x="70" y="300" width="700" height="45" class="box" />
      <text x="420" y="327" text-anchor="middle" class="text-title">🚪 ${labels.a20_gate || 'Fast A20 Gate'}</text>

      <path d="M420 345 L420 370" class="arrow" />
      <rect x="70" y="370" width="700" height="45" class="box-warn" />
      <text x="420" y="397" text-anchor="middle" class="text-title">💾 ${labels.storage_probe || 'Storage Discovery'}</text>

      <path d="M420 415 L420 440" class="arrow" />
      <rect x="70" y="440" width="700" height="45" class="box" />
      <text x="420" y="467" text-anchor="middle" class="text-title">📦 ${labels.mbr_load || 'MBR Load (0x7C00)'}</text>

      <path d="M420 485 L420 510" class="arrow" />
      <rect x="70" y="510" width="700" height="50" class="box-success" />
      <text x="420" y="541" text-anchor="middle" class="text-title">🚀 ${labels.os_handover || 'OS Handover (Contract 3)'}</text>
    </svg>`;
  }

  if (id === 'kernel_boot') {
    return `<svg viewBox="0 0 840 680" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <rect x="70" y="20" width="700" height="45" class="box" />
      <text x="420" y="47" text-anchor="middle" class="text-title">1️⃣ ${labels.mbr_stage1 || 'MBR Stage 1'}</text>

      <path d="M420 65 L420 90" class="arrow" />
      <rect x="70" y="90" width="700" height="45" class="box" />
      <text x="420" y="117" text-anchor="middle" class="text-title">2️⃣ ${labels.stage2_load || 'Stage 2 Load'}</text>

      <path d="M420 135 L420 160" class="arrow" />
      <rect x="70" y="160" width="700" height="45" class="box-warn" />
      <text x="420" y="187" text-anchor="middle" class="text-title">3️⃣ ${labels.prot_mode || '32-bit Protected Mode'}</text>

      <path d="M420 205 L420 230" class="arrow" />
      <rect x="70" y="230" width="700" height="45" class="box-accent" />
      <text x="420" y="257" text-anchor="middle" class="text-title">4️⃣ ${labels.kernel_load || 'Kernel Load at 0x10000'}</text>

      <path d="M420 275 L420 300" class="arrow" />
      <rect x="70" y="300" width="700" height="45" class="box" />
      <text x="420" y="327" text-anchor="middle" class="text-title">5️⃣ ${labels.mm_init || 'PMM & Heap (kmalloc)'}</text>

      <path d="M420 345 L420 370" class="arrow" />
      <rect x="70" y="370" width="700" height="45" class="box" />
      <text x="420" y="397" text-anchor="middle" class="text-title">6️⃣ ${labels.fs_mount || 'Mount IPO_FS (LBA 2048)'}</text>

      <path d="M420 415 L420 440" class="arrow" />
      <rect x="70" y="440" width="700" height="45" class="box" />
      <text x="420" y="467" text-anchor="middle" class="text-title">7️⃣ ${labels.drivers_init || 'Drivers: ATA, Keyboard, RTL8139, WM'}</text>

      <path d="M420 485 L420 510" class="arrow" />
      <rect x="70" y="510" width="700" height="50" class="box-success" />
      <text x="420" y="541" text-anchor="middle" class="text-title">💻 ${labels.launch_shell || 'Interactive Shell (/applications/shell.bin)'}</text>
    </svg>`;
  }

  if (id === 'memory_map') {
    return `<svg viewBox="0 0 840 500" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g transform="translate(50, 20)">
        <!-- Memory Blocks -->
        <rect x="0" y="0" width="740" height="40" class="box" />
        <text x="370" y="25" text-anchor="middle" class="text-title">${labels.ivt_bda || '0x00000 - 0x004FF: IVT & BDA'}</text>

        <rect x="0" y="48" width="740" height="40" class="box" />
        <text x="370" y="73" text-anchor="middle" class="text-title">${labels.boot_mbr || '0x07C00 - 0x07DFF: Bootloader MBR'}</text>

        <rect x="0" y="96" width="740" height="60" class="box-accent" />
        <text x="370" y="131" text-anchor="middle" class="text-title">${labels.kernel_bin || '0x10000 - 0x7FFFF: IPO_OS Kernel Core'}</text>

        <rect x="0" y="164" width="740" height="45" class="box-warn" />
        <text x="370" y="191" text-anchor="middle" class="text-title">${labels.video_ram || '0xA0000 - 0xBFFFF: Video VGA Framebuffer'}</text>

        <rect x="0" y="217" width="740" height="45" class="box" />
        <text x="370" y="244" text-anchor="middle" class="text-title">${labels.ebda_rom || '0xC0000 - 0xFFFFF: VBIOS & Shadow RAM'}</text>

        <rect x="0" y="270" width="740" height="60" class="box" />
        <text x="370" y="305" text-anchor="middle" class="text-title">${labels.kernel_heap || '0x100000 - 0x7FFFFF: Kernel Heap (kmalloc)'}</text>

        <rect x="0" y="338" width="740" height="70" class="box-success" />
        <text x="370" y="378" text-anchor="middle" class="text-title">${labels.user_apps || '0x800000+: Userspace Applications'}</text>
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
        <text x="70" y="45" text-anchor="middle" class="text-title">MBR / Reserved</text>
        <text x="70" y="65" text-anchor="middle" class="text-desc">LBA 0..2047</text>

        <rect x="150" y="0" width="140" height="80" class="box-warn" />
        <text x="220" y="45" text-anchor="middle" class="text-title">Superblock</text>
        <text x="220" y="65" text-anchor="middle" class="text-desc">LBA 2048</text>

        <rect x="300" y="0" width="140" height="80" class="box" />
        <text x="370" y="45" text-anchor="middle" class="text-title">Bitmaps</text>
        <text x="370" y="65" text-anchor="middle" class="text-desc">Inodes & Blocks</text>

        <rect x="450" y="0" width="140" height="80" class="box-accent" />
        <text x="520" y="45" text-anchor="middle" class="text-title">Inode Table</text>
        <text x="520" y="65" text-anchor="middle" class="text-desc">128B per Inode</text>

        <rect x="600" y="0" width="140" height="80" class="box-success" />
        <text x="670" y="45" text-anchor="middle" class="text-title">Data Extents</text>
        <text x="670" y="65" text-anchor="middle" class="text-desc">Contiguous Blocks</text>
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

  if (id === 'front_panel_pinout') {
    return `<svg viewBox="0 0 840 425" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <!-- Header Pin Connector Box -->
      <g transform="translate(50, 15)">
        <rect x="0" y="0" width="740" height="205" class="box" />
        <text x="370" y="32" text-anchor="middle" class="text-title">Motherboard JFP1 Front Panel Header</text>
        <text x="370" y="52" text-anchor="middle" class="text-desc">9-Pin Keyed Standard Desktop Header (Top View)</text>

        <!-- Top Row Group: HDD LED (Pins 2 & 4) -->
        <rect x="70" y="68" width="170" height="60" rx="6" fill="rgba(239, 68, 68, 0.07)" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4" />
        <text x="155" y="84" text-anchor="middle" font-family="var(--font-sans, system-ui)" font-size="11" font-weight="bold" fill="#ef4444">HDD LED</text>
        <circle cx="115" cy="108" r="13" fill="#ef4444" />
        <text x="115" y="112" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">2</text>
        <text x="135" y="112" font-family="var(--font-mono, monospace)" font-size="11" font-weight="bold" fill="#ef4444">+</text>
        <circle cx="195" cy="108" r="13" fill="#ef4444" />
        <text x="195" y="112" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">4</text>
        <text x="215" y="112" font-family="var(--font-mono, monospace)" font-size="11" font-weight="bold" fill="#ef4444">-</text>

        <!-- Top Row Group: POWER SW (Pins 6 & 8) -->
        <rect x="290" y="68" width="180" height="60" rx="6" fill="rgba(59, 130, 246, 0.07)" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4" />
        <text x="380" y="84" text-anchor="middle" font-family="var(--font-sans, system-ui)" font-size="11" font-weight="bold" fill="#3b82f6">POWER SWITCH</text>
        <circle cx="340" cy="108" r="13" fill="#3b82f6" />
        <text x="340" y="112" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">6</text>
        <circle cx="420" cy="108" r="13" fill="#3b82f6" />
        <text x="420" y="112" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">8</text>

        <!-- Top Row: Pin 10 (NC / Empty) -->
        <rect x="530" y="68" width="140" height="60" rx="6" fill="none" stroke="#64748b" stroke-width="1" stroke-dasharray="3" />
        <circle cx="600" cy="108" r="13" fill="none" stroke="#64748b" stroke-width="2" stroke-dasharray="3" />
        <text x="600" y="112" text-anchor="middle" fill="#64748b" font-size="10" font-weight="bold">NC</text>
        <text x="600" y="84" text-anchor="middle" font-family="var(--font-mono, monospace)" font-size="10" fill="#64748b">No Pin (Pin 10)</text>

        <!-- Bottom Row Group: POWER LED (Pins 1 & 3) -->
        <rect x="70" y="136" width="170" height="60" rx="6" fill="rgba(16, 185, 129, 0.07)" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4" />
        <circle cx="115" cy="166" r="13" fill="#10b981" />
        <text x="115" y="170" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">1</text>
        <text x="135" y="170" font-family="var(--font-mono, monospace)" font-size="11" font-weight="bold" fill="#10b981">+</text>
        <circle cx="195" cy="166" r="13" fill="#10b981" />
        <text x="195" y="170" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">3</text>
        <text x="215" y="170" font-family="var(--font-mono, monospace)" font-size="11" font-weight="bold" fill="#10b981">-</text>
        <text x="155" y="191" text-anchor="middle" font-family="var(--font-sans, system-ui)" font-size="11" font-weight="bold" fill="#10b981">POWER LED</text>

        <!-- Bottom Row Group: RESET SW (Pins 5 & 7) -->
        <rect x="290" y="136" width="180" height="60" rx="6" fill="rgba(245, 158, 11, 0.07)" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4" />
        <circle cx="340" cy="166" r="13" fill="#f59e0b" />
        <text x="340" y="170" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">5</text>
        <circle cx="420" cy="166" r="13" fill="#f59e0b" />
        <text x="420" y="170" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">7</text>
        <text x="380" y="191" text-anchor="middle" font-family="var(--font-sans, system-ui)" font-size="11" font-weight="bold" fill="#f59e0b">RESET SWITCH</text>

        <!-- Bottom Row: Pin 9 (KEY / Blocked) -->
        <rect x="530" y="136" width="140" height="60" rx="6" fill="rgba(239, 68, 68, 0.05)" stroke="#ef4444" stroke-width="1" stroke-dasharray="3" />
        <rect x="588" y="154" width="24" height="24" rx="4" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3" />
        <text x="600" y="170" text-anchor="middle" fill="#ef4444" font-size="10" font-weight="bold">KEY</text>
        <text x="600" y="191" text-anchor="middle" font-family="var(--font-mono, monospace)" font-size="10" fill="#ef4444">Blocked (Pin 9)</text>
      </g>

      <!-- 4 Cards: Informative Connection Legend -->
      <g transform="translate(50, 235)">
        <!-- Card 1: Power LED -->
        <rect x="0" y="0" width="355" height="80" rx="8" class="box-success" />
        <circle cx="20" cy="24" r="6" fill="#10b981" />
        <text x="35" y="28" font-family="var(--font-sans, system-ui)" font-size="13" font-weight="bold" fill="var(--text-primary, #0f172a)">Pins 1 (+), 3 (-) — Power LED</text>
        <text x="20" y="55" font-family="var(--font-sans, system-ui)" font-size="12" fill="var(--text-secondary, #475569)">${labels.pwr_led || 'Power Indicator LED (+ to Pin 1, - to Pin 3)'}</text>

        <!-- Card 2: HDD LED -->
        <rect x="385" y="0" width="355" height="80" rx="8" class="box-warn" />
        <circle cx="405" cy="24" r="6" fill="#ef4444" />
        <text x="420" y="28" font-family="var(--font-sans, system-ui)" font-size="13" font-weight="bold" fill="var(--text-primary, #0f172a)">Pins 2 (+), 4 (-) — HDD LED</text>
        <text x="405" y="55" font-family="var(--font-sans, system-ui)" font-size="12" fill="var(--text-secondary, #475569)">${labels.hdd_led || 'Storage Activity LED (+ to Pin 2, - to Pin 4)'}</text>

        <!-- Card 3: Reset Switch -->
        <rect x="0" y="92" width="355" height="80" rx="8" class="box" />
        <circle cx="20" cy="116" r="6" fill="#f59e0b" />
        <text x="35" y="120" font-family="var(--font-sans, system-ui)" font-size="13" font-weight="bold" fill="var(--text-primary, #0f172a)">Pins 5, 7 — Reset Switch (RESET_SW)</text>
        <text x="20" y="147" font-family="var(--font-sans, system-ui)" font-size="12" fill="var(--text-secondary, #475569)">${labels.reset_sw || 'Reset Switch (Momentary, no polarity)'}</text>

        <!-- Card 4: Power Switch -->
        <rect x="385" y="92" width="355" height="80" rx="8" class="box-accent" />
        <circle cx="405" cy="116" r="6" fill="#3b82f6" />
        <text x="420" y="120" font-family="var(--font-sans, system-ui)" font-size="13" font-weight="bold" fill="var(--text-primary, #0f172a)">Pins 6, 8 — Power Switch (PWR_SW)</text>
        <text x="405" y="147" font-family="var(--font-sans, system-ui)" font-size="12" fill="var(--text-secondary, #475569)">${labels.pwr_sw || 'Power Switch (Momentary, no polarity)'}</text>
      </g>
    </svg>`;
  }

  if (id === 'net_stack') {
    return `<svg viewBox="0 0 840 500" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <rect x="70" y="20" width="700" height="48" class="box" />
      <text x="420" y="48" text-anchor="middle" class="text-title">🔌 ${labels.nic_driver || 'RTL8139 PCI Driver'}</text>

      <path d="M420 68 L420 98" class="arrow" />
      <rect x="70" y="98" width="700" height="48" class="box" />
      <text x="420" y="126" text-anchor="middle" class="text-title">📦 ${labels.ethernet_l2 || 'Ethernet II & ARP'}</text>

      <path d="M420 146 L420 176" class="arrow" />
      <rect x="70" y="176" width="700" height="48" class="box-accent" />
      <text x="420" y="204" text-anchor="middle" class="text-title">🌐 ${labels.ipv4_l3 || 'IPv4 Routing Table & Checksums'}</text>

      <path d="M420 224 L420 254" class="arrow" />
      <rect x="70" y="254" width="700" height="52" class="box-warn" />
      <text x="420" y="285" text-anchor="middle" class="text-title">🔄 ${labels.transport_l4 || 'TCP State Machine (RFC 793/9293) & UDP'}</text>

      <path d="M420 306 L420 336" class="arrow" />
      <rect x="70" y="336" width="700" height="52" class="box-success" />
      <text x="420" y="367" text-anchor="middle" class="text-title">📡 ${labels.socket_api || 'POSIX-like Sockets: socket(), bind(), connect()'}</text>
    </svg>`;
  }

  if (id === 'spi_flashing_pinout' || id === 'spi_flashing' || id === 'spi_pinout') {
    return `<svg viewBox="0 0 840 480" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g transform="translate(40, 20)">
        <rect x="0" y="0" width="340" height="420" class="box-warn" />
        <text x="170" y="35" text-anchor="middle" class="text-title">📟 CH341A Programmer (USB)</text>
        <rect x="30" y="70" width="280" height="35" class="box" />
        <text x="170" y="93" text-anchor="middle" class="text-desc">Pin 1: CS# (Chip Select)</text>
        <rect x="30" y="115" width="280" height="35" class="box" />
        <text x="170" y="138" text-anchor="middle" class="text-desc">Pin 2: MISO (Data Out)</text>
        <rect x="30" y="160" width="280" height="35" class="box" />
        <text x="170" y="183" text-anchor="middle" class="text-desc">Pin 3: WP# (Write Protect -> 3.3V)</text>
        <rect x="30" y="205" width="280" height="35" class="box" />
        <text x="170" y="228" text-anchor="middle" class="text-desc">Pin 4: GND (Ground)</text>
        <rect x="30" y="250" width="280" height="35" class="box" />
        <text x="170" y="273" text-anchor="middle" class="text-desc">Pin 5: MOSI (Data In)</text>
        <rect x="30" y="295" width="280" height="35" class="box" />
        <text x="170" y="318" text-anchor="middle" class="text-desc">Pin 6: CLK (Serial Clock)</text>
        <rect x="30" y="340" width="280" height="35" class="box" />
        <text x="170" y="363" text-anchor="middle" class="text-desc">Pin 7: HOLD# (Hold -> 3.3V)</text>
        <rect x="30" y="385" width="280" height="30" class="box-success" />
        <text x="170" y="405" text-anchor="middle" class="text-desc">Pin 8: VCC (3.3V Power)</text>

        <path d="M340 87 L420 87" class="arrow" />
        <path d="M340 132 L420 132" class="arrow" />
        <path d="M340 222 L420 222" class="arrow" />
        <path d="M340 267 L420 267" class="arrow" />
        <path d="M340 312 L420 312" class="arrow" />
        <path d="M340 400 L420 400" class="arrow" />

        <rect x="420" y="0" width="340" height="420" class="box-accent" />
        <text x="590" y="35" text-anchor="middle" class="text-title">💾 SOIC-8 SPI Flash Chip</text>
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

  if (id === 'process_scheduler' || id === 'scheduler_fsm' || id === 'process_lifecycle') {
    return `<svg viewBox="0 0 840 440" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g transform="translate(40, 20)">
        <rect x="20" y="150" width="150" height="60" class="box" />
        <text x="95" y="185" text-anchor="middle" class="text-title">CREATED</text>

        <path d="M170 180 L230 180" class="arrow" />

        <rect x="230" y="150" width="150" height="60" class="box-accent" />
        <text x="305" y="185" text-anchor="middle" class="text-title">READY</text>

        <path d="M380 165 L460 165" class="arrow" />
        <text x="420" y="155" text-anchor="middle" class="text-desc">Schedule</text>

        <path d="M460 195 L380 195" class="arrow" />
        <text x="420" y="215" text-anchor="middle" class="text-desc">Preempt / Yield</text>

        <rect x="460" y="150" width="150" height="60" class="box-success" />
        <text x="535" y="185" text-anchor="middle" class="text-title">RUNNING</text>

        <path d="M610 180 L670 180" class="arrow" />
        <text x="640" y="170" text-anchor="middle" class="text-desc">exit()</text>

        <rect x="670" y="150" width="130" height="60" class="box-warn" />
        <text x="735" y="185" text-anchor="middle" class="text-title">TERMINATED</text>

        <path d="M535 210 L535 300" class="arrow" />
        <text x="545" y="260" class="text-desc">Block (Input/Sleep)</text>

        <rect x="360" y="300" width="220" height="60" class="box" />
        <text x="470" y="335" text-anchor="middle" class="text-title">WAITING / BLOCKED</text>

        <path d="M360 330 L305 330 L305 210" class="arrow" />
        <text x="290" y="280" text-anchor="end" class="text-desc">Wakeup Event</text>
      </g>
    </svg>`;
  }

  if (targetId === 'car_memory_layout') {
    return `<svg viewBox="0 0 840 460" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g transform="translate(50, 20)">
        <rect x="0" y="0" width="740" height="40" class="box-warn" />
        <text x="370" y="25" text-anchor="middle" class="text-title">${labels.mtrr_config || 'MSR 0x250/0x258/0x268-0x26F: Fixed MTRRs Configured as Write-Back (WB)'}</text>

        <rect x="0" y="55" width="740" height="55" class="box-accent" />
        <text x="370" y="82" text-anchor="middle" class="text-title">${labels.car_range || '0x70000 - 0x7FFFF: 64 KB Cache-as-RAM SRAM Working Area'}</text>
        <text x="370" y="100" text-anchor="middle" class="text-desc">${labels.cache_lines || 'L1/L2 Data Cache lines pinned as temporary read/write storage without DRAM'}</text>

        <rect x="0" y="125" width="740" height="55" class="box-success" />
        <text x="370" y="152" text-anchor="middle" class="text-title">${labels.stack_top || '0x7FFFF: Initial Stack Pointer (ESP = 0x0007FFFF, SS = 0x0000)'}</text>
        <text x="370" y="170" text-anchor="middle" class="text-desc">${labels.c_runtime || 'Allows execution of compiled 32-bit C code for chipset initialization and MRC training'}</text>

        <rect x="0" y="195" width="740" height="50" class="box" />
        <text x="370" y="222" text-anchor="middle" class="text-title">${labels.mrc_zone || '0x70000 - 0x77FFF: MRC Calibration Buffers and SPD EEPROM Tables'}</text>

        <rect x="0" y="260" width="740" height="50" class="box" />
        <text x="370" y="287" text-anchor="middle" class="text-title">${labels.post_logs || '0x78000 - 0x7EFFF: POST Stage Progress Log & Global Descriptor Table (GDT)'}</text>

        <rect x="0" y="325" width="740" height="55" class="box-warn" />
        <text x="370" y="352" text-anchor="middle" class="text-title">⚡ ${labels.teardown_phase || 'Phase 4 CAR Teardown: INVD Flush & Migrate Stack to Physical DRAM 0x7000'}</text>
        <text x="370" y="370" text-anchor="middle" class="text-desc">${labels.teardown_desc || 'Normal caching restored via CR0.CD=0; DRAM ready for firmware load'}</text>
      </g>
    </svg>`;
  }

  if (targetId === 'chipset_init_flow') {
    return `<svg viewBox="0 0 840 500" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <rect x="70" y="20" width="700" height="48" class="box-warn" />
      <text x="420" y="48" text-anchor="middle" class="text-title">🔍 ${labels.probe_bridge || '1. Read PCI 0:0.0 Device/Vendor ID (i440FX 0x1237:0x8086 vs Q35 0x29C0:0x8086)'}</text>

      <path d="M420 68 L420 98" class="arrow" />
      <rect x="70" y="98" width="700" height="48" class="box" />
      <text x="420" y="126" text-anchor="middle" class="text-title">⚙️ ${labels.smram_ctrl || '2. Configure SMRAM Control Register & Disable TSEG / Lockout'}</text>

      <path d="M420 146 L420 176" class="arrow" />
      <rect x="70" y="176" width="700" height="48" class="box-accent" />
      <text x="420" y="204" text-anchor="middle" class="text-title">🧠 ${labels.pam_config || '3. Program PAM0-PAM6: Unlock 0xC0000-0xFFFFF for Shadow RAM Write'}</text>

      <path d="M420 224 L420 254" class="arrow" />
      <rect x="70" y="254" width="700" height="48" class="box" />
      <text x="420" y="282" text-anchor="middle" class="text-title">🔌 ${labels.piix_routing || '4. Configure Southbridge (PIIX4 / ICH9): Route IRQs to PIC 8259'}</text>

      <path d="M420 302 L420 332" class="arrow" />
      <rect x="70" y="332" width="700" height="48" class="box-success" />
      <text x="420" y="360" text-anchor="middle" class="text-title">🔒 ${labels.lock_pam || '5. Write-Protect PAM0 (0xF0000-0xFFFFF) and Handover Control'}</text>
    </svg>`;
  }

  if (targetId === 'pci_bus_topology') {
    return `<svg viewBox="0 0 840 460" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g transform="translate(40, 20)">
        <rect x="220" y="10" width="320" height="55" class="box-warn" />
        <text x="380" y="38" text-anchor="middle" class="text-title">CPU Host Bridge (Bus 0, Dev 0, Func 0)</text>
        <text x="380" y="55" text-anchor="middle" class="text-desc">I/O Ports: 0xCF8 (Address) &amp; 0xCFC (Data)</text>

        <path d="M380 65 L380 110" class="arrow" />
        <path d="M80 110 L680 110" stroke="var(--accent-primary, #3b82f6)" stroke-width="2" fill="none" />

        <!-- Dev 01: IDE/SATA -->
        <path d="M120 110 L120 150" class="arrow" />
        <rect x="30" y="150" width="180" height="80" class="box" />
        <text x="120" y="180" text-anchor="middle" class="text-title">Dev 01.0: IDE / SATA</text>
        <text x="120" y="200" text-anchor="middle" class="text-desc">PIIX3 / PIIX4 IDE</text>
        <text x="120" y="218" text-anchor="middle" class="text-desc">Ports 0x1F0, 0x170</text>

        <!-- Dev 02: VGA -->
        <path d="M300 110 L300 150" class="arrow" />
        <rect x="210" y="150" width="180" height="80" class="box-accent" />
        <text x="300" y="180" text-anchor="middle" class="text-title">Dev 02.0: VGA Display</text>
        <text x="300" y="200" text-anchor="middle" class="text-desc">Bochs BGA / QEMU</text>
        <text x="300" y="218" text-anchor="middle" class="text-desc">BAR0 Framebuffer</text>

        <!-- Dev 03: RTL8139 -->
        <path d="M480 110 L480 150" class="arrow" />
        <rect x="390" y="150" width="180" height="80" class="box-success" />
        <text x="480" y="180" text-anchor="middle" class="text-title">Dev 03.0: Ethernet</text>
        <text x="480" y="200" text-anchor="middle" class="text-desc">Realtek RTL8139</text>
        <text x="480" y="218" text-anchor="middle" class="text-desc">BAR0 I/O Port / IRQ 11</text>

        <!-- Dev 04: USB -->
        <path d="M660 110 L660 150" class="arrow" />
        <rect x="570" y="150" width="180" height="80" class="box" />
        <text x="660" y="180" text-anchor="middle" class="text-title">Dev 04.0: USB UHCI</text>
        <text x="660" y="200" text-anchor="middle" class="text-desc">Host Controller</text>
        <text x="660" y="218" text-anchor="middle" class="text-desc">BAR4 I/O Base</text>

        <rect x="80" y="270" width="600" height="60" class="box-accent" />
        <text x="380" y="297" text-anchor="middle" class="text-title">Recursive Bus Scan: 256 Buses × 32 Devices × 8 Functions</text>
        <text x="380" y="318" text-anchor="middle" class="text-desc">Vendor ID != 0xFFFF indicates present hardware; BARs programmed with base addresses</text>
      </g>
    </svg>`;
  }

  if (targetId === 'storage_transfer_flow') {
    return `<svg viewBox="0 0 840 460" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g transform="translate(50, 20)">
        <rect x="0" y="0" width="740" height="50" class="box" />
        <text x="370" y="30" text-anchor="middle" class="text-title">1. VFS / BIOS Request: Read Sector at 28-bit/48-bit LBA Address</text>

        <path d="M370 50 L370 85" class="arrow" />
        <rect x="0" y="85" width="740" height="50" class="box-warn" />
        <text x="370" y="115" text-anchor="middle" class="text-title">2. Poll ATA Status (0x1F7): Wait while (Status &amp; 0x80) [BSY bit == 1]</text>

        <path d="M370 135 L370 170" class="arrow" />
        <rect x="0" y="170" width="740" height="55" class="box-accent" />
        <text x="370" y="195" text-anchor="middle" class="text-title">3. Write ATA Task File: Drive (0x1F6), Count (0x1F2), LBA (0x1F3-0x1F5)</text>
        <text x="370" y="214" text-anchor="middle" class="text-desc">Issue Command 0x20 (READ SECTORS with Retry) to Port 0x1F7</text>

        <path d="M370 225 L370 260" class="arrow" />
        <rect x="0" y="260" width="740" height="50" class="box" />
        <text x="370" y="290" text-anchor="middle" class="text-title">4. Wait for DRQ (Data Request) bit == 1 in Status Register</text>

        <path d="M370 310 L370 345" class="arrow" />
        <rect x="0" y="345" width="740" height="55" class="box-success" />
        <text x="370" y="370" text-anchor="middle" class="text-title">5. rep insw: Read 256 Words (512 Bytes) from Data Port 0x1F0 into RAM Buffer</text>
        <text x="370" y="389" text-anchor="middle" class="text-desc">Sector verified and delivered to Kernel VFS Page Cache / Caller Buffer</text>
      </g>
    </svg>`;
  }

  if (targetId === 'interrupt_routing') {
    return `<svg viewBox="0 0 840 500" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g transform="translate(30, 20)">
        <!-- Hardware Sources -->
        <rect x="0" y="20" width="230" height="180" class="box-warn" />
        <text x="115" y="48" text-anchor="middle" class="text-title">Hardware IRQs (8259 PIC)</text>
        <text x="115" y="75" text-anchor="middle" class="text-desc">IRQ 0: PIT Timer (0x20)</text>
        <text x="115" y="98" text-anchor="middle" class="text-desc">IRQ 1: Keyboard (0x21)</text>
        <text x="115" y="121" text-anchor="middle" class="text-desc">IRQ 11: RTL8139 NIC (0x2B)</text>
        <text x="115" y="144" text-anchor="middle" class="text-desc">IRQ 12: PS/2 Mouse (0x2C)</text>
        <text x="115" y="167" text-anchor="middle" class="text-desc">IRQ 14/15: Primary/Sec ATA</text>

        <!-- CPU Traps & Syscall -->
        <rect x="0" y="230" width="230" height="180" class="box-accent" />
        <text x="115" y="260" text-anchor="middle" class="text-title">CPU Traps &amp; Syscalls</text>
        <text x="115" y="290" text-anchor="middle" class="text-desc">0x00: Divide by Zero (#DE)</text>
        <text x="115" y="315" text-anchor="middle" class="text-desc">0x0D: General Protection (#GP)</text>
        <text x="115" y="340" text-anchor="middle" class="text-desc">0x0E: Page Fault (#PF)</text>
        <text x="115" y="375" text-anchor="middle" class="text-title">int $0x80: Syscall Gate</text>

        <path d="M230 110 L300 230" class="arrow" />
        <path d="M230 320 L300 250" class="arrow" />

        <!-- IDT Table -->
        <rect x="300" y="120" width="220" height="220" class="box" />
        <text x="410" y="155" text-anchor="middle" class="text-title">IDT (256 Entries)</text>
        <text x="410" y="180" text-anchor="middle" class="text-desc">Loaded via lidt [idtr]</text>
        <text x="410" y="210" text-anchor="middle" class="text-desc">Vectors 0x00-0x1F: Faults</text>
        <text x="410" y="235" text-anchor="middle" class="text-desc">Vectors 0x20-0x2F: PIC IRQs</text>
        <text x="410" y="260" text-anchor="middle" class="text-desc">Vector 0x80: Syscall Gate</text>
        <text x="410" y="295" text-anchor="middle" class="text-desc">DPL=3 for 0x80; DPL=0 for IRQs</text>

        <path d="M520 230 L580 230" class="arrow" />

        <!-- Ring 0 Handlers -->
        <rect x="580" y="40" width="200" height="370" class="box-success" />
        <text x="680" y="70" text-anchor="middle" class="text-title">Ring 0 Handlers</text>
        <text x="680" y="110" text-anchor="middle" class="text-desc">isr_timer_tick()</text>
        <text x="680" y="145" text-anchor="middle" class="text-desc">isr_keyboard()</text>
        <text x="680" y="180" text-anchor="middle" class="text-desc">isr_rtl8139_packet()</text>
        <text x="680" y="215" text-anchor="middle" class="text-desc">isr_mouse_packet()</text>
        <text x="680" y="250" text-anchor="middle" class="text-desc">isr_page_fault()</text>
        <text x="680" y="290" text-anchor="middle" class="text-desc">sys_dispatcher(int 0x80)</text>
        <text x="680" y="340" text-anchor="middle" class="text-title">EOI sent: outb(0x20, 0x20)</text>
        <text x="680" y="370" text-anchor="middle" class="text-desc">iret returns to caller</text>
      </g>
    </svg>`;
  }

  if (targetId === 'driver_architecture') {
    return `<svg viewBox="0 0 840 480" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g transform="translate(50, 20)">
        <!-- Layer 1: VFS Nodes -->
        <rect x="0" y="0" width="740" height="55" class="box" />
        <text x="370" y="28" text-anchor="middle" class="text-title">VFS Device Inodes: /dev/console, /dev/tty0, /dev/ata0, /dev/eth0, /dev/fb0</text>
        <text x="370" y="46" text-anchor="middle" class="text-desc">Standard POSIX interface: open(), read(), write(), ioctl(), close()</text>

        <path d="M370 55 L370 95" class="arrow" />

        <!-- Layer 2: Abstract Device Interface -->
        <rect x="0" y="95" width="740" height="60" class="box-accent" />
        <text x="370" y="125" text-anchor="middle" class="text-title">Kernel Driver Registration Table (struct device_ops)</text>
        <text x="370" y="143" text-anchor="middle" class="text-desc">Function pointers: .read_block, .write_block, .handle_irq, .set_mode</text>

        <path d="M370 155 L370 195" class="arrow" />

        <!-- Layer 3: Concrete Drivers -->
        <rect x="0" y="195" width="170" height="110" class="box-warn" />
        <text x="85" y="225" text-anchor="middle" class="text-title">ATA PIO Driver</text>
        <text x="85" y="250" text-anchor="middle" class="text-desc">Ports 0x1F0-0x1F7</text>
        <text x="85" y="270" text-anchor="middle" class="text-desc">IRQ 14</text>
        <text x="85" y="290" text-anchor="middle" class="text-desc">512B Sectors</text>

        <rect x="190" y="195" width="170" height="110" class="box-warn" />
        <text x="275" y="225" text-anchor="middle" class="text-title">PS/2 Driver</text>
        <text x="275" y="250" text-anchor="middle" class="text-desc">Ports 0x60, 0x64</text>
        <text x="275" y="270" text-anchor="middle" class="text-desc">IRQs 1 &amp; 12</text>
        <text x="275" y="290" text-anchor="middle" class="text-desc">Scancodes &amp; Packets</text>

        <rect x="380" y="195" width="170" height="110" class="box-warn" />
        <text x="465" y="225" text-anchor="middle" class="text-title">RTL8139 Driver</text>
        <text x="465" y="250" text-anchor="middle" class="text-desc">PCI Config Space</text>
        <text x="465" y="270" text-anchor="middle" class="text-desc">IRQ 11</text>
        <text x="465" y="290" text-anchor="middle" class="text-desc">Ring DMA Buffers</text>

        <rect x="570" y="195" width="170" height="110" class="box-warn" />
        <text x="655" y="225" text-anchor="middle" class="text-title">VBE / VGA Driver</text>
        <text x="655" y="250" text-anchor="middle" class="text-desc">BGA / VESA Modes</text>
        <text x="655" y="270" text-anchor="middle" class="text-desc">Linear Framebuffer</text>
        <text x="655" y="290" text-anchor="middle" class="text-desc">Double Buffering</text>

        <path d="M85 305 L85 345" class="arrow" />
        <path d="M275 305 L275 345" class="arrow" />
        <path d="M465 305 L465 345" class="arrow" />
        <path d="M655 305 L655 345" class="arrow" />

        <!-- Layer 4: Physical Hardware -->
        <rect x="0" y="345" width="740" height="55" class="box-success" />
        <text x="370" y="373" text-anchor="middle" class="text-title">Physical Hardware (x86 Buses: PCI, ISA, LPC, MMIO, Port I/O)</text>
        <text x="370" y="391" text-anchor="middle" class="text-desc">Isolated behind Ring 0 kernel privileges; memory-mapped I/O protected via page tables</text>
      </g>
    </svg>`;
  }

  if (targetId === 'ipc_architecture') {
    return `<svg viewBox="0 0 840 480" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g transform="translate(40, 20)">
        <!-- Process 1 -->
        <rect x="20" y="60" width="180" height="280" class="box-accent" />
        <text x="110" y="95" text-anchor="middle" class="text-title">Process A (Client)</text>
        <text x="110" y="120" text-anchor="middle" class="text-desc">Ring 3 Userspace</text>
        <text x="110" y="150" text-anchor="middle" class="text-desc">PID 10</text>
        <text x="110" y="190" text-anchor="middle" class="text-desc">File Descriptors</text>
        <text x="110" y="220" text-anchor="middle" class="text-desc">Virtual Memory Page</text>
        <text x="110" y="260" text-anchor="middle" class="text-desc">Signal Mask</text>
        <text x="110" y="300" text-anchor="middle" class="text-title">sys_ipc_send()</text>

        <!-- Kernel IPC Core -->
        <rect x="250" y="20" width="260" height="380" class="box-warn" />
        <text x="380" y="55" text-anchor="middle" class="text-title">Kernel IPC Core (Ring 0)</text>

        <rect x="270" y="80" width="220" height="55" class="box" />
        <text x="380" y="105" text-anchor="middle" class="text-title">Message Queues</text>
        <text x="380" y="122" text-anchor="middle" class="text-desc">Fixed 256-byte message slots</text>

        <rect x="270" y="150" width="220" height="55" class="box" />
        <text x="380" y="175" text-anchor="middle" class="text-title">Anonymous Pipes</text>
        <text x="380" y="192" text-anchor="middle" class="text-desc">4 KB Circular ring buffer</text>

        <rect x="270" y="220" width="220" height="55" class="box" />
        <text x="380" y="245" text-anchor="middle" class="text-title">POSIX Signals</text>
        <text x="380" y="262" text-anchor="middle" class="text-desc">Async delivery on iret frame</text>

        <rect x="270" y="290" width="220" height="55" class="box" />
        <text x="380" y="315" text-anchor="middle" class="text-title">Shared Memory Pages</text>
        <text x="380" y="332" text-anchor="middle" class="text-desc">Zero-copy shared frames</text>

        <!-- Process 2 -->
        <rect x="560" y="60" width="180" height="280" class="box-success" />
        <text x="650" y="95" text-anchor="middle" class="text-title">Process B (Server/WM)</text>
        <text x="650" y="120" text-anchor="middle" class="text-desc">Ring 3 Userspace</text>
        <text x="650" y="150" text-anchor="middle" class="text-desc">PID 4 (Window Manager)</text>
        <text x="650" y="190" text-anchor="middle" class="text-desc">Receives Draw Events</text>
        <text x="650" y="220" text-anchor="middle" class="text-desc">Maps Shared Buffers</text>
        <text x="650" y="260" text-anchor="middle" class="text-desc">Handles SIGCHLD</text>
        <text x="650" y="300" text-anchor="middle" class="text-title">sys_ipc_recv()</text>

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
        <text x="130" y="65" text-anchor="middle" class="text-title">App Window 1</text>
        <text x="130" y="90" text-anchor="middle" class="text-desc">Client Backbuffer</text>

        <rect x="20" y="150" width="220" height="90" class="box-accent" />
        <text x="130" y="185" text-anchor="middle" class="text-title">App Window 2</text>
        <text x="130" y="210" text-anchor="middle" class="text-desc">Client Backbuffer</text>

        <rect x="20" y="270" width="220" height="90" class="box-accent" />
        <text x="130" y="305" text-anchor="middle" class="text-title">Desktop / Shell</text>
        <text x="130" y="330" text-anchor="middle" class="text-desc">Wallpaper &amp; Taskbar</text>

        <path d="M240 75 L330 180" class="arrow" />
        <path d="M240 195 L330 195" class="arrow" />
        <path d="M240 315 L330 210" class="arrow" />

        <rect x="330" y="120" width="200" height="150" class="box-warn" />
        <text x="430" y="165" text-anchor="middle" class="text-title">Window Manager</text>
        <text x="430" y="195" text-anchor="middle" class="text-desc">Clipping &amp; Z-Order</text>
        <text x="430" y="220" text-anchor="middle" class="text-desc">Dirty Rect Blit</text>

        <path d="M530 195 L600 195" class="arrow" />

        <rect x="600" y="110" width="180" height="170" class="box-success" />
        <text x="690" y="155" text-anchor="middle" class="text-title">VBE / VGA</text>
        <text x="690" y="185" text-anchor="middle" class="text-title">Hardware Display</text>
        <text x="690" y="215" text-anchor="middle" class="text-desc">Linear Framebuffer</text>
        <text x="690" y="240" text-anchor="middle" class="text-desc">0xA0000 / BGA MMIO</text>
      </g>
    </svg>`;
  }

  return `<svg viewBox="0 0 600 200" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
    ${style}
    <rect x="10" y="10" width="580" height="180" class="box" />
    <text x="300" y="105" text-anchor="middle" class="text-title">Diagram: ${id}</text>
  </svg>`;
}
