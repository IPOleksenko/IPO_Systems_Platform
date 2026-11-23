export interface CodeSnippet {
  id: string;
  lang: string;
  title: string;
  code: string;
}

export interface StructTableField {
  offset: string;
  size: string;
  type: string;
  name: string;
}

export interface StructTable {
  id: string;
  totalSize: string;
  fields: StructTableField[];
}

export interface SyscallDoc {
  numHex: string;
  numDec: number;
  name: string;
  signature: string;
}

export const sharedCodeSnippets: Record<string, CodeSnippet> = {
  'hello-c': {
    id: 'hello-c',
    lang: 'c',
    title: 'main.c (First IPO_OS Application)',
    code: `#include <stdio.h>

int main(int argc, char **argv) {
    if (argc == 1) {
        printf("Hello, World!\\n");
        return 0;
    }

    for (int i = 1; i < argc; i++) {
        printf("Hello, %s\\n", argv[i]);
    }

    return 0;
}
`
  },

  'hello-asm': {
    id: 'hello-asm',
    lang: 'asm',
    title: 'hello_asm.asm (Pure Assembly Application)',
    code: `; Pure 32-bit x86 Assembly Application for IPO_OS
; Loaded at allocated free memory by process manager
[BITS 32]
[ORG 0x00800000]
section .entry
global _start

_start:
    ; Prepare arguments array on stack for ipo_syscall
    ; IPO_SYSCALL_PRINT = 0x1001
    ; int ipo_syscall(num, argc, argv)
    push msg
    mov eax, esp       ; EAX = pointer to argv array

    ; Call kernel via int 0x80:
    ; EAX = syscall number (0x1001)
    ; EBX = argc (1)
    ; ECX = argv pointer (stack pointer pointing to msg)
    push eax           ; save argv pointer
    mov eax, 0x1001    ; IPO_SYSCALL_PRINT
    mov ebx, 1         ; argc = 1
    pop ecx            ; ECX = argv

    int 0x80           ; Dispatch system call to Ring 0

    ; Clean up stack and exit gracefully
    ; IPO_SYSCALL_EXIT = 0xFFFF
    add esp, 4         ; restore push msg

    push dword 0       ; exit code 0
    mov ecx, esp       ; argv pointer
    mov eax, 0xFFFF    ; IPO_SYSCALL_EXIT
    mov ebx, 1         ; argc = 1
    int 0x80

.halt:
    hlt

section .data
msg: db "Hello, World from pure 32-bit Assembly on IPO_OS!", 10, 0
`
  },

  'socket-tcp-server': {
    id: 'socket-tcp-server',
    lang: 'c',
    title: 'tcp_server.c (POSIX Sockets HTTP Server on IPO_OS)',
    code: `#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <net/socket.h>

int main(int argc, char **argv) {
    int server_fd = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (server_fd < 0) {
        printf("Error: failed to create TCP socket\n");
        return 1;
    }

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_port = 8000;
    addr.sin_addr.s_addr = INADDR_ANY;

    if (bind(server_fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        printf("Error: bind failed on port 8000\n");
        close(server_fd);
        return 1;
    }

    listen(server_fd, 5);
    printf("IPO_OS HTTP Server listening on http://0.0.0.0:8000/\n");

    while (1) {
        struct sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);
        int client_fd = accept(server_fd, (struct sockaddr *)&client_addr, &client_len);
        if (client_fd >= 0) {
            char buffer[512];
            ssize_t received = recv(client_fd, buffer, sizeof(buffer) - 1, 0);
            if (received > 0) {
                buffer[received] = '\0';
                const char *response = 
                    "HTTP/1.1 200 OK\r\n"
                    "Content-Type: text/html\r\n"
                    "Connection: close\r\n\r\n"
                    "<h1>Hello from IPO_OS Bare-Metal HTTP Server!</h1>\n";
                send(client_fd, response, strlen(response), 0);
            }
            close(client_fd);
        }
    }
    close(server_fd);
    return 0;
}
`
  },

  'opengl-cube': {
    id: 'opengl-cube',
    lang: 'c',
    title: 'gl_cube.c (Hardware VirGL 3D & CPU Fallback in IPO_OS)',
    code: `#include <GL/gl.h>
#include <GL/ipo_gl.h>
#include <ipo/gpu_client.h>
#include <ipo/gfx.h>
#include <wm.h>

void render_cube_frame(ipo_gfx3d_ctx_t *ctx, wm_window_t *win, float rot_x, float rot_y) {
    (void)ipo_gfx_ensure_hd_mode(1280u, 720u);

    ipo_gpu_info_t gi;
    bool has_gpu = (ipo_gpu_get_info(&gi) &&
                    gi.backend_mode == IPO_GPU_BACKEND_VIRGL_3D &&
                    !gi.forced_cpu_fallback);

    ipo_gfx3d_clear(ctx, 0xFF0B1018u, 1.0f);
    ipo_gfx3d_set_rotation(ctx, rot_x, rot_y, 0.0f);
    ipo_gfx3d_draw_mesh(ctx, &cube_mesh);
    ipo_gfx3d_present(ctx, win, has_gpu);
}
`
  },

  'wm-gui-window': {
    id: 'wm-gui-window',
    lang: 'c',
    title: 'wm_app.c (Creating GUI Window & Polling Events)',
    code: `#include <wm.h>
#include <stdbool.h>
#include <stdio.h>

int main(void) {
    wm_window_options_t opts = WM_WINDOW_OPTIONS_DEFAULT;
    opts.x = 30;
    opts.y = 25;
    opts.w = 180;
    opts.h = 90;
    opts.title = "Sample Window";

    wm_window_t *win = wm_create_window(&opts);
    if (!win) {
        printf("Failed to create WM window\\n");
        return 1;
    }

    wm_buf_fill_rect(win->framebuf, win->w, win->h, 0, 0, win->w, win->h, 9);
    wm_buf_draw_rect(win->framebuf, win->w, win->h, 2, 2, win->w - 4, win->h - 4, 15);
    wm_buf_draw_string(win->framebuf, win->w, win->h, 10, 15, "IPO_OS GUI Window", 15);
    wm_invalidate(win);

    wm_event_t ev;
    bool running = true;
    while (running && wm_is_window_valid(win)) {
        while (wm_poll_event(win, &ev)) {
            if (ev.type == WM_EVENT_CLOSE) running = false;
            else if (ev.type == WM_EVENT_CLICK) printf("Window clicked!\\n");
        }
        wm_compositor_tick();
    }
    wm_destroy_window(win);
    return 0;
}
`
  },

  'micropython-script': {
    id: 'micropython-script',
    lang: 'python',
    title: 'test.py (Executing Python on Bare-Metal IPO_OS)',
    code: `# Python script running on bare-metal x86 inside IPO_OS
import sys

print("Hello from MicroPython running on bare-metal IPO_OS!")
print("Python Version:", sys.version)

# Math calculation
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print("Fibonacci(20) =", fib(20))
`
  },

  'in-os-tcc': {
    id: 'in-os-tcc',
    lang: 'bash',
    title: 'Compiling C code directly inside IPO_OS',
    code: `# 1. Create C file in shell
echo 'int main() { printf("Built inside IPO_OS!\\n"); return 0; }' > prog.c

# 2. Compile with Tiny C Compiler running in IPO_OS
tcc -o prog prog.c

# 3. Execute freshly compiled binary
prog
`
  },

  'multitasking-shell-operators': {
    id: 'multitasking-shell-operators',
    lang: 'bash',
    title: 'Shell Multitasking & Workspace Operators',
    code: `# Run programs in separate virtual workspaces (Ctrl+PgUp / Ctrl+PgDn to switch):
run edit & links & hosting_server

# Run multiple GUI/3D applications concurrently on the same desktop:
run gl_cube && gl_gears && gl_teapot

# Pipeline: wait for left command and pass return code to right:
run hello | echo

# Sequential execution:
run setfont /fonts/terminus.fnt ; startwm
`
  },

  'disk-editor-cmds': {
    id: 'disk-editor-cmds',
    lang: 'bash',
    title: 'tools/disk_editor.py Complete Command Reference',
    code: `# Inspect disk image contents (root directory)
python3 tools/disk_editor.py -i build/disks/disk.img ls /

# Copy host compiled executable into IPO_FS /applications folder
python3 tools/disk_editor.py -i build/disks/disk.img put ./build/applications/doom/doom.bin /applications/doom

# Create directory inside filesystem
python3 tools/disk_editor.py -i build/disks/disk.img mkdir /home/user

# Write text file into image
python3 tools/disk_editor.py -i build/disks/disk.img touch /autorun "startwm\\nrun gl_gears\\n"

# View file content
python3 tools/disk_editor.py -i build/disks/disk.img cat /autorun

# Delete file or directory
python3 tools/disk_editor.py -i build/disks/disk.img rm /old_app
`
  },

  'makefile-all-targets': {
    id: 'makefile-all-targets',
    lang: 'bash',
    title: 'Makefile Target Reference (IPO_OS & IPO_OS_Software)',
    code: `# === IPO_OS (Kernel & Base System) ===
# Full build and run in QEMU (clean, lib, kernel, boot, image, disks, run):
make all

# Incremental kernel module builds:
make lib          # Builds kernel standard library (src/lib/libk.a)
make kernel       # Builds kernel.bin + symbol table via generate_ksyms.py
make boot         # Builds MBR + Stage 2 bootloader (build/boot/boot.bin)
make image        # Builds bootable IPO_OS.bin (boot.bin + kernel.bin, max 2030 sectors)
make disks        # Prepares build/disks/disk.img with Partition 1 + IPO_FS

# Host TAP networking configuration (direct L2 communication, host 192.168.7.1):
make setup-tap

# Launch in QEMU (x86_64 with KVM/VirGL/Audio auto-detection):
make run NET_MODE=tap AUDIODEV=pa
make run NET_MODE=user DRIVE_TYPE=ahci

# Cleanups:
make clean        # Removes build outputs, including build/disks
make clean-lib    # Cleans kernel library artifacts
make clean-disks  # Removes build/disks directory

# === IPO_OS_Software (Userland Ecosystem & Modular Drivers) ===
# Build all libraries, /drivers/* KMD executables, 34 apps, 15 toolchain ELFs, and fonts:
make -C ../IPO_OS_Software all
make -C ../IPO_OS_Software drivers
make -C ../IPO_OS_Software load-apps DISK=../IPO_OS/build/disks/disk.img
`
  },

  'tap-networking-setup': {
    id: 'tap-networking-setup',
    lang: 'bash',
    title: 'Setting up TAP0 Host Virtual Interface',
    code: `# 1. Configure virtual TAP device on host (requires root/sudo)
sudo ./tools/setup-tap.sh tap0 192.168.7.1 24 192.168.7.2

# 2. Launch IPO_OS with TAP network enabled
make run NET_MODE=tap

# 3. Inside IPO_OS shell: verify network configuration (requires /drivers/rtl8139 loaded)
ifconfig

# 4. From Linux host: ping guest OS or test TCP server
ping 192.168.7.2
curl http://192.168.7.2:8000/
`
  },

  'qemu-full-stack-run': {
    id: 'qemu-full-stack-run',
    lang: 'bash',
    title: 'Running Complete Vertical Stack in QEMU',
    code: `# Execute unified Boot ROM + Firmware + IPO_OS disk (default x86_64 SMP + VirGL + Audio):
qemu-system-x86_64 \\
    -M pc -cpu qemu64,+rdrand -smp 4 -m 2048 \\
    -bios ../IPO_Boot_ROM/build/bootrom.bin \\
    -drive format=raw,file=build/disks/disk.img,if=ide,index=0 \\
    -device virtio-vga-gl -display gtk,gl=on \\
    -device rtl8139,netdev=net0 \\
    -netdev user,id=net0,net=192.168.7.0/24,host=192.168.7.1,dhcpstart=192.168.7.2 \\
    -audiodev pa,id=snd0 -device sb16,audiodev=snd0 \\
    -serial stdio
`
  },

  'flashrom-spi-cmds': {
    id: 'flashrom-spi-cmds',
    lang: 'bash',
    title: 'Physical SPI Flashing with flashrom & CH341A',
    code: `# 1. Dump backup 1 from physical SPI flash chip
flashrom -p ch341a_spi -r backup1.bin

# 2. Dump backup 2 to verify connection stability
flashrom -p ch341a_spi -r backup2.bin

# 3. Verify identical checksums before proceeding
cmp backup1.bin backup2.bin || echo "CRITICAL: Clamp contact unstable! Re-attach clip!"

# 4. Build unified ROM image (default 4MiB IEC suffix, with XIP romstage & firmware)
make FIRMWARE=../IPO_Firmware/build/firmware.bin FLASH_SIZE=4MiB

# 5. Flash physical chip with verification
flashrom -p ch341a_spi -w build/bootrom.bin
`
  },

  'syscall-c-wrapper': {
    id: 'syscall-c-wrapper',
    lang: 'c',
    title: 'lib/libc/sys.c (Syscall Invoker)',
    code: `#include <stdint.h>
#include <syscall.h>

int ipo_syscall(uint32_t num, uint32_t argc, uint32_t *argv) {
    int ret;
    __asm__ volatile(
        "int $0x80"
        : "=a"(ret)
        : "a"(num),
          "b"(argc),
          "c"(argv)
        : "edx", "memory", "cc"
    );
    return ret;
}
`
  },

  'app-linker-script': {
    id: 'app-linker-script',
    lang: 'c',
    title: 'lib/linker.ld (Application Linker Script)',
    code: `ENTRY(_start)

PHDRS
{
    text PT_LOAD;
    data PT_LOAD;
}

SECTIONS
{
    . = 0x800000; /* Userspace base image load address (8 MiB) */

    .text : ALIGN(4)
    {
        *(.entry)
        *(.text.startup)
        *(.text.main)
        *(.text*)
        KEEP(*(SORT_NONE(.init)))
        KEEP(*(SORT_NONE(.fini)))
    } :text

    .rodata : ALIGN(4)
    {
        *(.rodata*)
        *(.rdata*)
    } :text

    .eh_frame_hdr : ALIGN(4) { *(.eh_frame_hdr) } :text
    .eh_frame : ALIGN(4)
    {
        PROVIDE_HIDDEN(__eh_frame_start = .);
        KEEP(*(.eh_frame))
        *(.eh_frame.*)
        LONG(0);
        PROVIDE_HIDDEN(__eh_frame_end = .);
    } :text
    .gcc_except_table : ALIGN(4) { *(.gcc_except_table*) } :text

    . = ALIGN(4);
    .preinit_array : ALIGN(4)
    {
        PROVIDE_HIDDEN (__preinit_array_start = .);
        KEEP (*(.preinit_array))
        PROVIDE_HIDDEN (__preinit_array_end = .);
    } :data
    .init_array : ALIGN(4)
    {
        PROVIDE_HIDDEN (__init_array_start = .);
        KEEP (*(SORT_BY_INIT_PRIORITY(.init_array.*) SORT_BY_INIT_PRIORITY(.ctors.*)))
        KEEP (*(.init_array EXCLUDE_FILE (*crtbegin.o *crtbegin?.o *crtend.o *crtend?.o ) .ctors))
        PROVIDE_HIDDEN (__init_array_end = .);
    } :data
    .fini_array : ALIGN(4)
    {
        PROVIDE_HIDDEN (__fini_array_start = .);
        KEEP (*(SORT_BY_INIT_PRIORITY(.fini_array.*) SORT_BY_INIT_PRIORITY(.dtors.*)))
        KEEP (*(.fini_array EXCLUDE_FILE (*crtbegin.o *crtbegin?.o *crtend.o *crtend?.o ) .dtors))
        PROVIDE_HIDDEN (__fini_array_end = .);
    } :data

    .data : ALIGN(4) { *(.data*) } :data
    .bss : ALIGN(4)
    {
        PROVIDE_HIDDEN (__bss_start = .);
        *(COMMON)
        *(.bss*)
        PROVIDE_HIDDEN (__bss_end = .);
    } :data

    _end = .;
    PROVIDE(end = .);
}
`
  },

  'app-entry-s': {
    id: 'app-entry-s',
    lang: 'asm',
    title: 'lib/crt/crt0.s (Userspace C Runtime Entrypoint)',
    code: `.code32
.global _start
.extern main
.extern __libc_start_main
.extern environ
.extern __progname

.section .entry, "ax"
_start:
    fninit
    /* Zero .bss [__bss_start .. __bss_end] */
    pushl %ebp
    movl %esp, %ebp
    movl 8(%ebp), %eax   /* argc */
    movl 12(%ebp), %edx  /* argv */
    movl 16(%ebp), %ecx  /* envp */
    andl $-16, %esp
    /* Calls __libc_start_main(main, argc, argv, envp) */
`
  },

  'kernel-linker-script': {
    id: 'kernel-linker-script',
    lang: 'c',
    title: 'src/kernel/linker.ld (Kernel Linker Script)',
    code: `ENTRY(_start)

SECTIONS
{
    . = 0x100000; /* Kernel linked and loaded at 1 MiB physical address (0x100000) */

    .text : ALIGN(4096)
    {
        *(.entry)
        *(.text*)
    }

    .rodata : ALIGN(4096)
    {
        *(.rodata*)
    }

    .data : ALIGN(4096)
    {
        *(.data*)
    }

    .bss : ALIGN(4096)
    {
        *(COMMON)
        *(.bss*)
    }

    /DISCARD/ :
    {
        *(.eh_frame*)
        *(.comment*)
    }
}
`
  },

  'app-makefile': {
    id: 'app-makefile',
    lang: 'makefile',
    title: 'Makefile for Custom User Application',
    code: `CC      := gcc
ASM     := nasm
OBJCOPY := objcopy

CFLAGS  := -m32 -O2 -msse2 -mfpmath=sse \\
           -ffreestanding \\
           -fno-pic -fno-pie \\
           -fno-builtin \\
           -std=gnu11 \\
           -I/path/to/IPO_OS_Software/include

LDFLAGS := -m elf_i386 -T /path/to/IPO_OS_Software/lib/linker.ld

all: my_app.bin

main.o: main.c
	$(CC) $(CFLAGS) -c main.c -o main.o

my_app.bin: main.o
	ld $(LDFLAGS) /path/to/IPO_OS_Software/build/lib/crt0.o main.o \\
		/path/to/IPO_OS_Software/build/lib/libapp.a \\
		/path/to/IPO_OS_Software/build/lib/libapp_api.a \\
		/path/to/IPO_OS_Software/build/lib/libc.a \\
		/path/to/IPO_OS_Software/build/lib/libgcc.a -o my_app.elf
	$(OBJCOPY) --set-section-flags .bss=alloc,load,contents \\
		-j .text -j .rodata -j .data -j .bss -O binary my_app.elf my_app.bin
	@rm -f my_app.elf
	@echo "✓ Generated raw binary: my_app.bin ready for IPO_FS"

clean:
	rm -f *.o *.bin *.elf
`
  },

  'tap-setup-cmds': {
    id: 'tap-setup-cmds',
    lang: 'bash',
    title: 'Setting up TAP0 Host Virtual Interface',
    code: `# 1. Configure virtual TAP device on host (requires root/sudo)
sudo ./tools/setup-tap.sh tap0 192.168.7.1 24 192.168.7.2

# 2. Launch IPO_OS with TAP network enabled
make run NET_MODE=tap

# 3. Inside IPO_OS shell: verify network configuration
ifconfig

# 4. From Linux host: ping guest OS or test TCP server
ping 192.168.7.2
curl http://192.168.7.2:8000/
`
  }
};

export const sharedStructTables: StructTable[] = [
  {
    id: 'ipo_superblock',
    totalSize: '104 bytes (Root superblock of 512-byte LBA 2048 block)',
    fields: [
      { offset: '0x00', size: '8 bytes', type: 'uint64_t', name: 'magic' },
      { offset: '0x08', size: '8 bytes', type: 'uint64_t', name: 'fs_size_blocks' },
      { offset: '0x10', size: '4 bytes', type: 'uint32_t', name: 'block_size' },
      { offset: '0x14', size: '4 bytes', type: 'uint32_t', name: 'flags' },
      { offset: '0x18', size: '8 bytes', type: 'uint64_t', name: 'inode_count' },
      { offset: '0x20', size: '8 bytes', type: 'uint64_t', name: 'inode_bitmap_start' },
      { offset: '0x28', size: '8 bytes', type: 'uint64_t', name: 'block_bitmap_start' },
      { offset: '0x30', size: '8 bytes', type: 'uint64_t', name: 'inode_table_start' },
      { offset: '0x38', size: '8 bytes', type: 'uint64_t', name: 'data_blocks_start' },
      { offset: '0x40', size: '4 bytes', type: 'uint32_t', name: 'primary_inodes' },
      { offset: '0x44', size: '4 bytes', type: 'uint32_t', name: 'reserved' },
      { offset: '0x48', size: '8 bytes', type: 'uint64_t', name: 'dynamic_chunk_tree' },
      { offset: '0x50', size: '8 bytes', type: 'uint64_t', name: 'dynamic_chunks_count' },
      { offset: '0x58', size: '8 bytes', type: 'uint64_t', name: 'dynamic_inodes_count' },
      { offset: '0x60', size: '8 bytes', type: 'uint64_t', name: 'dynamic_inodes_used' }
    ]
  },
  {
    id: 'ipo_inode',
    totalSize: '128 bytes',
    fields: [
      { offset: '0x00', size: '4 bytes', type: 'uint32_t', name: 'mode' },
      { offset: '0x04', size: '4 bytes', type: 'uint32_t', name: 'links_count' },
      { offset: '0x08', size: '8 bytes', type: 'uint64_t', name: 'size' },
      { offset: '0x10', size: '96 bytes', type: 'struct ipo_extent[4]', name: 'extents' },
      { offset: '0x70', size: '8 bytes', type: 'uint64_t', name: 'next_extent_node' },
      { offset: '0x78', size: '8 bytes', type: 'uint64_t', name: 'reserved' }
    ]
  },
  {
    id: 'ipo_extent',
    totalSize: '24 bytes',
    fields: [
      { offset: '0x00', size: '8 bytes', type: 'uint64_t', name: 'logical_block' },
      { offset: '0x08', size: '8 bytes', type: 'uint64_t', name: 'physical_block' },
      { offset: '0x10', size: '4 bytes', type: 'uint32_t', name: 'block_count' },
      { offset: '0x14', size: '4 bytes', type: 'uint32_t', name: 'flags' }
    ]
  },
  {
    id: 'storage_pool_raw_sb',
    totalSize: '512 bytes (LBA 2030/2039 + XTMB extension blocks 2040..2047)',
    fields: [
      { offset: '0x00', size: '4 bytes', type: 'uint32_t', name: 'magic' },
      { offset: '0x04', size: '4 bytes', type: 'uint32_t', name: 'version' },
      { offset: '0x08', size: '16 bytes', type: 'uint8_t[16]', name: 'pool_uuid' },
      { offset: '0x18', size: '16 bytes', type: 'uint8_t[16]', name: 'local_member_uuid' },
      { offset: '0x28', size: '4 bytes', type: 'uint32_t', name: 'member_index' },
      { offset: '0x2C', size: '4 bytes', type: 'uint32_t', name: 'member_count' },
      { offset: '0x30', size: '8 bytes', type: 'uint64_t', name: 'total_capacity_sectors' },
      { offset: '0x38', size: '4 bytes', type: 'uint32_t', name: 'chunk_size_sectors' },
      { offset: '0x3C', size: '4 bytes', type: 'uint32_t', name: 'generation' },
      { offset: '0x40', size: '4 bytes', type: 'uint32_t', name: 'state' },
      { offset: '0x44', size: 'N × 48 B', type: 'storage_pool_raw_member_t[]', name: 'members' },
      { offset: '0x1FC', size: '4 bytes', type: 'uint32_t', name: 'crc32' }
    ]
  },
  {
    id: 'storage_raw_disk_tx_entry',
    totalSize: '64 bytes (8 entries per 512-byte sector, LBA 2031..2038)',
    fields: [
      { offset: '0x00', size: '4 bytes', type: 'uint32_t', name: 'magic' },
      { offset: '0x04', size: '4 bytes', type: 'uint32_t', name: 'tx_id' },
      { offset: '0x08', size: '2 bytes', type: 'uint16_t', name: 'op' },
      { offset: '0x0A', size: '2 bytes', type: 'uint16_t', name: 'state' },
      { offset: '0x0C', size: '8 bytes', type: 'uint64_t', name: 'lba' },
      { offset: '0x14', size: '4 bytes', type: 'uint32_t', name: 'count' },
      { offset: '0x18', size: '4 bytes', type: 'uint32_t', name: 'timestamp' },
      { offset: '0x1C', size: '4 bytes', type: 'uint32_t', name: 'data_crc' },
      { offset: '0x20', size: '4 bytes', type: 'uint32_t', name: 'entry_crc' },
      { offset: '0x24', size: '28 bytes', type: 'uint8_t[28]', name: 'reserved' }
    ]
  },
  {
    id: 'kmod_header',
    totalSize: 'Bare-metal PIC (.kmd) + kmod_init_meta_t (24 B) & kmod_t (44 B in RAM)',
    fields: [
      { offset: '0x00', size: '4 bytes', type: 'uint32_t', name: 'id' },
      { offset: '0x04', size: '4 bytes', type: 'char*', name: 'name' },
      { offset: '0x08', size: '4 bytes', type: 'char*', name: 'author' },
      { offset: '0x0C', size: '4 bytes', type: 'char*', name: 'description' },
      { offset: '0x10', size: '4 bytes', type: 'uint32_t', name: 'flags' },
      { offset: '0x14', size: '4 bytes', type: 'void*', name: 'image_base' },
      { offset: '0x18', size: '4 bytes', type: 'size_t', name: 'image_size' },
      { offset: '0x1C', size: '4 bytes', type: 'int (*)(void)', name: 'init' },
      { offset: '0x20', size: '4 bytes', type: 'int (*)(void)', name: 'cleanup' },
      { offset: '0x24', size: '4 bytes', type: 'uint32_t', name: 'ref_count' },
      { offset: '0x28', size: '4 bytes', type: 'struct kmod*', name: 'next' },
      { offset: 'meta', size: '24 bytes', type: 'kmod_init_meta_t', name: 'resolve_sym_metadata' }
    ]
  },
  {
    id: 'cpu_info',
    totalSize: '40+ bytes (cpu_info_t with ipo_vaddr_t stack pointers)',
    fields: [
      { offset: '0x00', size: '4 bytes', type: 'uint32_t', name: 'cpu_id' },
      { offset: '0x04', size: '4 bytes', type: 'uint32_t', name: 'lapic_id' },
      { offset: '0x08', size: '1 byte', type: 'bool', name: 'is_bsp' },
      { offset: '0x09', size: '1 byte', type: 'volatile bool', name: 'is_online' },
      { offset: '0x0C', size: '4/8 bytes', type: 'ipo_vaddr_t', name: 'stack_base' },
      { offset: '0x10', size: '4/8 bytes', type: 'ipo_vaddr_t', name: 'stack_top' },
      { offset: '0x14', size: '4 bytes', type: 'volatile uint32_t', name: 'ticks' },
      { offset: '0x18', size: '4 bytes', type: 'volatile uint32_t', name: 'tasks_executed' },
      { offset: '0x1C', size: '4 bytes', type: 'volatile uint32_t', name: 'tasks_queued' },
      { offset: '0x20', size: '4 bytes', type: 'volatile uint32_t', name: 'busy' },
      { offset: '0x24', size: '4 bytes', type: 'volatile uint32_t', name: 'current_task_id' }
    ]
  },
  {
    id: 'process_pcb',
    totalSize: 'Dynamic PCB (process_t with threads, address_space & self-expanding heaps)',
    fields: [
      { offset: 'hdr', size: '4 bytes', type: 'uint32_t', name: 'pid' },
      { offset: 'img', size: 'ptr + size', type: 'void* / ipo_size_t', name: 'binary_base / entry_point' },
      { offset: 'ctx', size: 'arch_ctx', type: 'arch_context_t*', name: 'arch_ctx' },
      { offset: 'mm', size: 'ptr + list', type: 'address_space_t*', name: 'address_space' },
      { offset: 'stk', size: '4096 B+', type: 'ipo_vaddr_t', name: 'stack_base / stack_size' },
      { offset: 'ret', size: 'dynamic', type: 'process_return_value_t', name: 'return_val' },
      { offset: 'heap', size: '0x10000000+', type: 'ipo_vaddr_t + chunks[]', name: 'user_heap_base / heap_chunks' },
      { offset: 'mmap', size: 'dynamic', type: 'proc_mmap_region_t*', name: 'mmap_regions' },
      { offset: 'thrd', size: 'dynamic', type: 'process_thread_t*', name: 'threads / thread_count' },
      { offset: 'sig', size: 'dynamic', type: 'sigaction_t[]', name: 'signal_handlers / pending' },
      { offset: 'vram', size: 'dynamic', type: 'void*', name: 'text_vram_backup / text_output_buf' },
      { offset: 'meta', size: 'char*', type: 'char* / struct process*', name: 'name / return_format / next' }
    ]
  },
  {
    id: 'device_node',
    totalSize: 'Dynamic device_node_t with ipo_paddr_t* bar[] & strings (src/include/kernel/device.h)',
    fields: [
      { offset: '0x00', size: '4 bytes', type: 'uint32_t', name: 'id' },
      { offset: '0x04', size: '4 bytes', type: 'uint32_t', name: 'parent_id' },
      { offset: '0x08', size: '4 bytes', type: 'uint32_t', name: 'capabilities' },
      { offset: '0x0C', size: '4 bytes', type: 'device_type_t', name: 'type' },
      { offset: '0x10', size: '4 bytes', type: 'device_state_t', name: 'state' },
      { offset: '0x14', size: 'dynamic', type: 'char* + len/cap', name: 'name' },
      { offset: '0x20', size: 'dynamic', type: 'char* + len/cap', name: 'vendor / model / description' },
      { offset: '0x44', size: '64-bit BARs', type: 'device_resources_t', name: 'res' },
      { offset: '0x78', size: 'dynamic', type: 'char* + void*', name: 'driver_name / driver_ptr' },
      { offset: '0x88', size: 'pointers', type: 'device_ops_t* + next', name: 'ops / priv_data / next' }
    ]
  },
  {
    id: 'kmalloc_stats',
    totalSize: '28 bytes (Primary 64 MiB at 0x04000000 + dynamic overflow arenas)',
    fields: [
      { offset: '0x00', size: '4 bytes', type: 'size_t', name: 'heap_total' },
      { offset: '0x04', size: '4 bytes', type: 'size_t', name: 'heap_used' },
      { offset: '0x08', size: '4 bytes', type: 'size_t', name: 'alloc_bytes' },
      { offset: '0x0C', size: '4 bytes', type: 'size_t', name: 'free_bytes' },
      { offset: '0x10', size: '4 bytes', type: 'size_t', name: 'alloc_blocks' },
      { offset: '0x14', size: '4 bytes', type: 'size_t', name: 'free_blocks' },
      { offset: '0x18', size: '4 bytes', type: 'size_t', name: 'block_header' }
    ]
  },
  {
    id: 'ata_device',
    totalSize: '44 bytes (0x2C)',
    fields: [
      { offset: '0x00', size: '1 byte', type: 'uint8_t', name: 'present' },
      { offset: '0x01', size: '1 byte', type: 'uint8_t', name: 'channel' },
      { offset: '0x02', size: '1 byte', type: 'uint8_t', name: 'drive' },
      { offset: '0x04', size: '4 bytes', type: 'ata_device_type_t', name: 'type' },
      { offset: '0x08', size: '2 bytes', type: 'uint16_t', name: 'cylinders' },
      { offset: '0x0A', size: '2 bytes', type: 'uint16_t', name: 'heads' },
      { offset: '0x0C', size: '2 bytes', type: 'uint16_t', name: 'sectors' },
      { offset: '0x0E', size: '2 bytes', type: 'uint16_t', name: 'io_base' },
      { offset: '0x10', size: '2 bytes', type: 'uint16_t', name: 'ctrl_base' },
      { offset: '0x12', size: '1 byte', type: 'uint8_t', name: 'irq' },
      { offset: '0x14', size: '4 bytes', type: 'uint32_t', name: 'sector_size' },
      { offset: '0x18', size: '8 bytes', type: 'uint64_t', name: 'capacity_sectors' },
      { offset: '0x20', size: '4 bytes', type: 'char*', name: 'model' },
      { offset: '0x24', size: '4 bytes', type: 'char*', name: 'serial' },
      { offset: '0x28', size: '4 bytes', type: 'char*', name: 'firmware' }
    ]
  },
  {
    id: 'ipo_idt_entry',
    totalSize: '8 bytes (32-bit IDT gate) / 16 bytes (64-bit ipo_idt_entry64_t in Long Mode)',
    fields: [
      { offset: '0x00', size: '2 bytes', type: 'uint16_t', name: 'base_lo' },
      { offset: '0x02', size: '2 bytes', type: 'uint16_t', name: 'selector' },
      { offset: '0x04', size: '1 byte', type: 'uint8_t', name: 'zero' },
      { offset: '0x05', size: '1 byte', type: 'uint8_t', name: 'flags' },
      { offset: '0x06', size: '2/10 B', type: 'uint16_t / uint64_t', name: 'base_hi' }
    ]
  },
  {
    id: 'bootrom_post_codes',
    totalSize: '8-bit Diagnostic Port 0x80 (IPO_Boot_ROM/include/contract.inc)',
    fields: [
      { offset: '0x12', size: '1 byte', type: 'Progress', name: 'POST_CAR_START' },
      { offset: '0x13', size: '1 byte', type: 'Progress', name: 'POST_CAR_OK' },
      { offset: '0x15', size: '1 byte', type: 'Progress', name: 'POST_ROMSTAGE_START' },
      { offset: '0x16', size: '1 byte', type: 'Progress', name: 'POST_ROMSTAGE_OK' },
      { offset: '0x1F', size: '1 byte', type: 'Warning', name: 'POST_WARN_SPD_FAIL' },
      { offset: '0x2E', size: '1 byte', type: 'Notice', name: 'POST_NOMTRR_BYPASS' }
    ]
  },
  {
    id: 'firmware_post_codes',
    totalSize: '8-bit Diagnostic Port 0x80 (IPO_Firmware/include/boot_constants.inc)',
    fields: [
      { offset: '0x29', size: '1 byte', type: 'Progress', name: 'POST_DISK_SPINUP_WAIT' }
    ]
  }
];

export const sharedSyscallsList: SyscallDoc[] = [
  {
    numHex: '0x0001',
    numDec: 1,
    name: 'IPO_SYSCALL_REGISTER',
    signature: 'int ipo_register_syscall(uint32_t num, ipo_syscall_handler_t handler)',
  },
  {
    numHex: '0x0002',
    numDec: 2,
    name: 'IPO_SYSCALL_CALL',
    signature: 'int ipo_syscall(uint32_t num, uint32_t argc, uint32_t *argv)',
  },
  {
    numHex: '0x1001',
    numDec: 4097,
    name: 'IPO_SYSCALL_PRINT',
    signature: 'int ipo_print(const char *text)',
  },
  {
    numHex: '0x1002',
    numDec: 4098,
    name: 'IPO_SYSCALL_WRITE',
    signature: 'int ipo_write(int fd, const void *buf, uint32_t count, uint32_t offset)',
  },
  {
    numHex: '0x1010',
    numDec: 4112,
    name: 'IPO_SYSCALL_FS_CREATE',
    signature: 'int ipo_create(const char *path, uint8_t type)',
  },
  {
    numHex: '0x1011',
    numDec: 4113,
    name: 'IPO_SYSCALL_FS_OPEN',
    signature: 'int ipo_open(const char *path)',
  },
  {
    numHex: '0x1012',
    numDec: 4114,
    name: 'IPO_SYSCALL_FS_READ',
    signature: 'int ipo_read(int fd, void *buf, uint32_t count, uint32_t offset)',
  },
  {
    numHex: '0x1013',
    numDec: 4115,
    name: 'IPO_SYSCALL_FS_WRITE',
    signature: 'int ipo_write(int fd, const void *buf, uint32_t count, uint32_t offset)',
  },
  {
    numHex: '0x1014',
    numDec: 4116,
    name: 'IPO_SYSCALL_FS_DELETE',
    signature: 'int ipo_delete(const char *path)',
  },
  {
    numHex: '0x1015',
    numDec: 4117,
    name: 'IPO_SYSCALL_FS_STAT',
    signature: 'int ipo_stat(const char *path, struct ipo_inode *st)',
  },
  {
    numHex: '0x1016',
    numDec: 4118,
    name: 'IPO_SYSCALL_FS_LIST',
    signature: 'int ipo_list_dir(const char *path, char *buf, int size)',
  },
  {
    numHex: '0x1017',
    numDec: 4119,
    name: 'IPO_SYSCALL_FS_RENAME',
    signature: 'int ipo_rename(const char *src, const char *dst)',
  },
  {
    numHex: '0x1018',
    numDec: 4120,
    name: 'IPO_SYSCALL_FS_CLOSE',
    signature: 'int ipo_close(int fd)',
  },
  {
    numHex: '0x1019',
    numDec: 4121,
    name: 'IPO_SYSCALL_FS_SEEK',
    signature: 'int ipo_seek(int fd, int32_t offset, int whence)',
  },
  {
    numHex: '0x101A',
    numDec: 4122,
    name: 'IPO_SYSCALL_FS_TRUNCATE',
    signature: 'int ipo_truncate64(const char *path, uint64_t size)',
  },
  {
    numHex: '0x101B',
    numDec: 4123,
    name: 'IPO_SYSCALL_FS_FTRUNCATE',
    signature: 'int ipo_ftruncate64(int fd, uint64_t size)',
  },
  {
    numHex: '0x101C',
    numDec: 4124,
    name: 'IPO_SYSCALL_FS_MKDIR',
    signature: 'int ipo_mkdir(const char *path)',
  },
  {
    numHex: '0x101D',
    numDec: 4125,
    name: 'IPO_SYSCALL_FS_RMDIR',
    signature: 'int ipo_rmdir(const char *path)',
  },
  {
    numHex: '0x101E',
    numDec: 4126,
    name: 'IPO_SYSCALL_FS_LSEEK64',
    signature: 'int64_t ipo_lseek64(int fd, int64_t offset, int whence)',
  },
  {
    numHex: '0x1020',
    numDec: 4128,
    name: 'IPO_SYSCALL_EXEC',
    signature: 'int ipo_exec(const char *path, int argc, char **argv)',
  },
  {
    numHex: '0x1021',
    numDec: 4129,
    name: 'IPO_SYSCALL_READ',
    signature: 'int ipo_read_line(char *buf, uint32_t max_len)',
  },
  {
    numHex: '0x1022',
    numDec: 4130,
    name: 'IPO_SYSCALL_TERMINAL_INPUT',
    signature: 'int ipo_terminal_input(const char *text, int auto_execute)',
  },
  {
    numHex: '0x1023',
    numDec: 4131,
    name: 'IPO_SYSCALL_PROCESS_YIELD',
    signature: 'int ipo_yield(void)',
  },
  {
    numHex: '0x1024',
    numDec: 4132,
    name: 'IPO_SYSCALL_PROCESS_IS_FOREGROUND',
    signature: 'int ipo_is_foreground(void)',
  },
  {
    numHex: '0x1025',
    numDec: 4133,
    name: 'IPO_SYSCALL_GETCWD',
    signature: 'int ipo_getcwd(char *buf, uint32_t size)',
  },
  {
    numHex: '0x1026',
    numDec: 4134,
    name: 'IPO_SYSCALL_CHDIR',
    signature: 'int ipo_chdir(const char *path)',
  },
  {
    numHex: '0x1027',
    numDec: 4135,
    name: 'IPO_SYSCALL_GET_EXIT_CODE',
    signature: 'int ipo_get_exit_code(void)',
  },
  {
    numHex: '0x1028',
    numDec: 4136,
    name: 'IPO_SYSCALL_PROCESS_IS_BATCH_ACTIVE',
    signature: 'int ipo_is_batch_active(void)',
  },
  {
    numHex: '0x1029',
    numDec: 4137,
    name: 'IPO_SYSCALL_SET_RETURN_VALUE',
    signature: 'int ipo_set_return_value(int type, ...)',
  },
  {
    numHex: '0x102A',
    numDec: 4138,
    name: 'IPO_SYSCALL_GET_RETURN_VALUE',
    signature: 'int ipo_get_return_value(char *buf, uint32_t max_len)',
  },
  {
    numHex: '0x1030',
    numDec: 4144,
    name: 'IPO_SYSCALL_ASYNC_START',
    signature: 'int ipo_async_start(const char *task_name, uint32_t interval_ms, void (*task_fn)(void))',
  },
  {
    numHex: '0x1031',
    numDec: 4145,
    name: 'IPO_SYSCALL_ASYNC_STOP',
    signature: 'int ipo_async_stop(int task_id)',
  },
  {
    numHex: '0x1040',
    numDec: 4160,
    name: 'IPO_SYSCALL_STACK_GROW',
    signature: 'int ipo_stack_grow(uint32_t bytes)',
  },
  {
    numHex: '0x1041',
    numDec: 4161,
    name: 'IPO_SYSCALL_STACK_SHRINK',
    signature: 'int ipo_stack_shrink(uint32_t bytes)',
  },
  {
    numHex: '0x1042',
    numDec: 4162,
    name: 'IPO_SYSCALL_VAR_SET',
    signature: 'int ipo_var_set(const char *name, const void *val, uint32_t sz)',
  },
  {
    numHex: '0x1043',
    numDec: 4163,
    name: 'IPO_SYSCALL_VAR_GET',
    signature: 'int ipo_var_get(const char *name, void *buf, uint32_t sz)',
  },
  {
    numHex: '0x1044',
    numDec: 4164,
    name: 'IPO_SYSCALL_VAR_DELETE',
    signature: 'int ipo_var_delete(const char *name)',
  },
  {
    numHex: '0x1045',
    numDec: 4165,
    name: 'IPO_SYSCALL_SBRK',
    signature: 'void *ipo_sbrk(int32_t increment)',
  },
  {
    numHex: '0x1046',
    numDec: 4166,
    name: 'IPO_SYSCALL_TIME',
    signature: 'uint32_t ipo_time(uint32_t *tloc)',
  },
  {
    numHex: '0x1047',
    numDec: 4167,
    name: 'IPO_SYSCALL_FREE',
    signature: 'void ipo_kfree(void *ptr)',
  },
  {
    numHex: '0x1048',
    numDec: 4168,
    name: 'IPO_SYSCALL_MILLIS',
    signature: 'uint32_t timer_millis(void)',
  },
  {
    numHex: '0x1049',
    numDec: 4169,
    name: 'IPO_SYSCALL_ELAPSED_MS',
    signature: 'uint32_t timer_elapsed_ms(uint32_t start_ms)',
  },
  {
    numHex: '0x104A',
    numDec: 4170,
    name: 'IPO_SYSCALL_TIMER_AFTER',
    signature: 'int timer_after(uint32_t start_ms, uint32_t delay_ms)',
  },
  {
    numHex: '0x104B',
    numDec: 4171,
    name: 'IPO_SYSCALL_RTC_GET_STR',
    signature: 'int ipo_rtc_get_str(const char *fmt, char *out_buf, size_t cap)',
  },
  {
    numHex: '0x104C',
    numDec: 4172,
    name: 'IPO_SYSCALL_RTC_SET_STR',
    signature: 'int ipo_rtc_set_str(const char *spec, uint32_t kind)',
  },
  {
    numHex: '0x104D',
    numDec: 4173,
    name: 'IPO_SYSCALL_RTC_GET_FORMAT',
    signature: 'int ipo_rtc_get_format(char *out_buf, size_t cap)',
  },
  {
    numHex: '0x104E',
    numDec: 4174,
    name: 'IPO_SYSCALL_RTC_SET_FORMAT',
    signature: 'int ipo_rtc_set_format(const char *fmt)',
  },
  {
    numHex: '0x104F',
    numDec: 4175,
    name: 'IPO_SYSCALL_RTC_ADD_STR',
    signature: 'int ipo_rtc_add_str(const char *unit, const char *amount)',
  },
  {
    numHex: '0x1050',
    numDec: 4176,
    name: 'IPO_SYSCALL_KEYMAP_SET',
    signature: 'int ipo_keymap_set_with_font(const char *name, const void *entries, uint32_t count, const void *glyphs, uint32_t glyph_count)',
  },
  {
    numHex: '0x1051',
    numDec: 4177,
    name: 'IPO_SYSCALL_KEYMAP_GET',
    signature: 'int ipo_keymap_get(char *buf, uint32_t max_len)',
  },
  {
    numHex: '0x1052',
    numDec: 4178,
    name: 'IPO_SYSCALL_FONT_LOAD',
    signature: 'int ipo_font_load(const char *path)',
  },
  {
    numHex: '0x1053',
    numDec: 4179,
    name: 'IPO_SYSCALL_KEYMAP_DISABLE',
    signature: 'int ipo_keymap_disable(const char *name)',
  },
  {
    numHex: '0x1054',
    numDec: 4180,
    name: 'IPO_SYSCALL_KEYMAP_ENABLE',
    signature: 'int ipo_keymap_enable(const char *name)',
  },
  {
    numHex: '0x1055',
    numDec: 4181,
    name: 'IPO_SYSCALL_KEYMAP_REMOVE',
    signature: 'int ipo_keymap_remove(const char *name)',
  },
  {
    numHex: '0x1056',
    numDec: 4182,
    name: 'IPO_SYSCALL_KEYMAP_TRANSLATE',
    signature: 'int ipo_keymap_translate(uint8_t scancode)',
  },
  {
    numHex: '0x1057',
    numDec: 4183,
    name: 'IPO_SYSCALL_KEYMAP_IS_ACTIVE',
    signature: 'int ipo_keymap_is_active(const char *name)',
  },
  {
    numHex: '0x1058',
    numDec: 4184,
    name: 'IPO_SYSCALL_KEYMAP_CYCLE_NEXT',
    signature: 'int ipo_keymap_cycle_next(void)',
  },
  {
    numHex: '0x1059',
    numDec: 4185,
    name: 'IPO_SYSCALL_KEYMAP_CYCLE_PREV',
    signature: 'int ipo_keymap_cycle_prev(void)',
  },
  {
    numHex: '0x105A',
    numDec: 4186,
    name: 'IPO_SYSCALL_KEYMAP_GET_NAME',
    signature: 'int ipo_keymap_get_name(char *buf, uint32_t len)',
  },
  {
    numHex: '0x105B',
    numDec: 4187,
    name: 'IPO_SYSCALL_FONT_GET_INFO',
    signature: 'int ipo_font_get_info(char *name_buf, uint32_t max_name_len, uint32_t *out_glyph_count)',
  },
  {
    numHex: '0x105C',
    numDec: 4188,
    name: 'IPO_SYSCALL_VGA_GLYPH',
    signature: 'int ipo_vga_glyph(uint32_t codepoint)',
  },
  {
    numHex: '0x105D',
    numDec: 4189,
    name: 'IPO_SYSCALL_VGA_SET_MODE',
    signature: 'int ipo_vga_set_mode(uint32_t mode)',
  },
  {
    numHex: '0x105E',
    numDec: 4190,
    name: 'IPO_SYSCALL_VGA_GET_MODE',
    signature: 'int ipo_vga_get_mode(void)',
  },
  {
    numHex: '0x105F',
    numDec: 4191,
    name: 'IPO_SYSCALL_SYSTEM_INTERRUPT',
    signature: 'int ipo_system_interrupt(uint32_t type, uint32_t arg)',
  },
  {
    numHex: '0x1060',
    numDec: 4192,
    name: 'IPO_SYSCALL_DRIVER_REGISTER',
    signature: 'int ipo_driver_register(void *drv)',
  },
  {
    numHex: '0x1061',
    numDec: 4193,
    name: 'IPO_SYSCALL_DRIVER_UNREGISTER',
    signature: 'int ipo_driver_unregister(const char *name)',
  },
  {
    numHex: '0x1062',
    numDec: 4194,
    name: 'IPO_SYSCALL_DRIVER_LIST',
    signature: 'int ipo_driver_list(void)',
  },
  {
    numHex: '0x1063',
    numDec: 4195,
    name: 'IPO_SYSCALL_DRIVER_SET_DESC',
    signature: 'int ipo_driver_set_description(const char *name, const char *desc)',
  },
  {
    numHex: '0x1064',
    numDec: 4196,
    name: 'IPO_SYSCALL_FS_STATVFS',
    signature: 'int ipo_statvfs(uint32_t out_stats[7])',
  },
  {
    numHex: '0x1065',
    numDec: 4197,
    name: 'IPO_SYSCALL_VGA_GET_BOUNDS',
    signature: 'int ipo_vga_get_screen_bounds(int32_t *width, int32_t *height)',
  },
  {
    numHex: '0x1066',
    numDec: 4198,
    name: 'IPO_SYSCALL_PORT_IN8',
    signature: 'uint8_t ipo_port_in8(uint16_t port)',
  },
  {
    numHex: '0x1067',
    numDec: 4199,
    name: 'IPO_SYSCALL_PORT_OUT8',
    signature: 'void ipo_port_out8(uint16_t port, uint8_t value)',
  },
  {
    numHex: '0x1068',
    numDec: 4200,
    name: 'IPO_SYSCALL_PORT_IN16',
    signature: 'uint16_t ipo_port_in16(uint16_t port)',
  },
  {
    numHex: '0x1069',
    numDec: 4201,
    name: 'IPO_SYSCALL_PORT_OUT16',
    signature: 'void ipo_port_out16(uint16_t port, uint16_t value)',
  },
  {
    numHex: '0x106A',
    numDec: 4202,
    name: 'IPO_SYSCALL_PORT_IN32',
    signature: 'uint32_t ipo_port_in32(uint16_t port)',
  },
  {
    numHex: '0x106B',
    numDec: 4203,
    name: 'IPO_SYSCALL_PORT_OUT32',
    signature: 'void ipo_port_out32(uint16_t port, uint32_t value)',
  },
  {
    numHex: '0x106C',
    numDec: 4204,
    name: 'IPO_SYSCALL_RTC_GET_DATE_FORMAT',
    signature: 'int ipo_rtc_get_date_format(char *out_buf, size_t cap)',
  },
  {
    numHex: '0x106D',
    numDec: 4205,
    name: 'IPO_SYSCALL_RTC_SET_DATE_FORMAT',
    signature: 'int ipo_rtc_set_date_format(const char *fmt)',
  },
  {
    numHex: '0x106E',
    numDec: 4206,
    name: 'IPO_SYSCALL_RTC_GET_DATE_STR',
    signature: 'int ipo_rtc_get_date_str(char *out_buf, size_t cap)',
  },
  {
    numHex: '0x106F',
    numDec: 4207,
    name: 'IPO_SYSCALL_RTC_GET_STATUS',
    signature: 'int ipo_rtc_get_status(char *out_buf, size_t cap)',
  },
  {
    numHex: '0x1070',
    numDec: 4208,
    name: 'IPO_SYSCALL_WM_CREATE_WINDOW',
    signature: 'wm_window_t *wm_create_window(const wm_window_options_t *opts)',
  },
  {
    numHex: '0x1071',
    numDec: 4209,
    name: 'IPO_SYSCALL_WM_DESTROY_WINDOW',
    signature: 'void wm_destroy_window(wm_window_t *win)',
  },
  {
    numHex: '0x1072',
    numDec: 4210,
    name: 'IPO_SYSCALL_WM_SESSION_START',
    signature: 'void wm_session_start(void)',
  },
  {
    numHex: '0x1073',
    numDec: 4211,
    name: 'IPO_SYSCALL_WM_SESSION_STOP',
    signature: 'void wm_session_stop(void)',
  },
  {
    numHex: '0x1074',
    numDec: 4212,
    name: 'IPO_SYSCALL_WM_SESSION_ACTIVE',
    signature: 'bool wm_session_active(void)',
  },
  {
    numHex: '0x1075',
    numDec: 4213,
    name: 'IPO_SYSCALL_WM_GET_COUNT',
    signature: 'int wm_get_window_count(void)',
  },
  {
    numHex: '0x1076',
    numDec: 4214,
    name: 'IPO_SYSCALL_WM_GET_FOCUSED',
    signature: 'wm_window_t *wm_get_focused(void)',
  },
  {
    numHex: '0x1077',
    numDec: 4215,
    name: 'IPO_SYSCALL_WM_SET_FOCUS',
    signature: 'void wm_set_focus(wm_window_t *win)',
  },
  {
    numHex: '0x1078',
    numDec: 4216,
    name: 'IPO_SYSCALL_WM_FOCUS_NEXT',
    signature: 'void wm_focus_next(void)',
  },
  {
    numHex: '0x1079',
    numDec: 4217,
    name: 'IPO_SYSCALL_WM_FOCUS_PREV',
    signature: 'void wm_focus_prev(void)',
  },
  {
    numHex: '0x107A',
    numDec: 4218,
    name: 'IPO_SYSCALL_WM_INVALIDATE',
    signature: 'void wm_invalidate(wm_window_t *win)',
  },
  {
    numHex: '0x107B',
    numDec: 4219,
    name: 'IPO_SYSCALL_WM_IS_VALID',
    signature: 'bool wm_is_window_valid(wm_window_t *win)',
  },
  {
    numHex: '0x107C',
    numDec: 4220,
    name: 'IPO_SYSCALL_GETPID',
    signature: 'int ipo_getpid(void)',
  },
  {
    numHex: '0x107D',
    numDec: 4221,
    name: 'IPO_SYSCALL_WM_TOGGLE_MAXIMIZE',
    signature: 'void wm_toggle_maximize(wm_window_t *win)',
  },
  {
    numHex: '0x107E',
    numDec: 4222,
    name: 'IPO_SYSCALL_WM_RESIZE',
    signature: 'bool wm_resize(wm_window_t *win, uint16_t nw, uint16_t nh)',
  },
  {
    numHex: '0x107F',
    numDec: 4223,
    name: 'IPO_SYSCALL_WM_GET_LIST',
    signature: 'wm_window_t *wm_get_window_list(void)',
  },
  {
    numHex: '0x1080',
    numDec: 4224,
    name: 'IPO_SYSCALL_PROCESS_SWITCH_FG',
    signature: 'int ipo_process_switch_fg(uint32_t pid)',
  },
  {
    numHex: '0x1081',
    numDec: 4225,
    name: 'IPO_SYSCALL_WM_INIT',
    signature: 'void wm_init(void)',
  },
  {
    numHex: '0x1082',
    numDec: 4226,
    name: 'IPO_SYSCALL_WM_INVALIDATE_ALL',
    signature: 'void wm_invalidate_all(void)',
  },
  {
    numHex: '0x1083',
    numDec: 4227,
    name: 'IPO_SYSCALL_WM_SET_FULLSCREEN',
    signature: 'void wm_set_fullscreen(wm_window_t *win, bool enable)',
  },
  {
    numHex: '0x1084',
    numDec: 4228,
    name: 'IPO_SYSCALL_WM_MINIMIZE',
    signature: 'void wm_minimize(wm_window_t *win)',
  },
  {
    numHex: '0x1085',
    numDec: 4229,
    name: 'IPO_SYSCALL_WM_RESTORE',
    signature: 'void wm_restore(wm_window_t *win)',
  },
  {
    numHex: '0x1086',
    numDec: 4230,
    name: 'IPO_SYSCALL_WM_MOVE',
    signature: 'void wm_move(wm_window_t *win, int16_t x, int16_t y)',
  },
  {
    numHex: '0x1087',
    numDec: 4231,
    name: 'IPO_SYSCALL_WM_SET_TITLE',
    signature: 'void wm_set_title(wm_window_t *win, const char *title)',
  },
  {
    numHex: '0x1088',
    numDec: 4232,
    name: 'IPO_SYSCALL_WM_SET_SHAPE',
    signature: 'void wm_set_shape(wm_window_t *win, const uint8_t *mask, uint16_t width, uint16_t height)',
  },
  {
    numHex: '0x1089',
    numDec: 4233,
    name: 'IPO_SYSCALL_WM_POLL_EVENT',
    signature: 'bool wm_poll_event(wm_window_t *win, wm_event_t *out)',
  },
  {
    numHex: '0x108B',
    numDec: 4235,
    name: 'IPO_SYSCALL_WM_COMPOSITOR_TICK',
    signature: 'void wm_compositor_tick(void)',
  },
  {
    numHex: '0x108D',
    numDec: 4237,
    name: 'IPO_SYSCALL_WM_GET_COUNT_PID',
    signature: 'int wm_get_window_count_for_pid(uint32_t pid)',
  },
  {
    numHex: '0x108E',
    numDec: 4238,
    name: 'IPO_SYSCALL_WM_HAS_WINDOWS_PID',
    signature: 'bool wm_has_windows_for_pid(uint32_t pid)',
  },
  {
    numHex: '0x108F',
    numDec: 4239,
    name: 'IPO_SYSCALL_WM_FOCUS_PID',
    signature: 'void wm_focus_window_for_pid(uint32_t pid)',
  },
  {
    numHex: '0x1090',
    numDec: 4240,
    name: 'IPO_SYSCALL_NET_DNS_RESOLVE',
    signature: 'bool dns_resolve(const char *hostname, ip4_addr_t *out_ip, uint32_t timeout_ms)',
  },
  {
    numHex: '0x1091',
    numDec: 4241,
    name: 'IPO_SYSCALL_NET_ICMP_SEND',
    signature: 'int icmp_send_echo(ip4_addr_t dst_ip, uint16_t id, uint16_t seq, uint8_t ttl, const void *payload, uint16_t len)',
  },
  {
    numHex: '0x1092',
    numDec: 4242,
    name: 'IPO_SYSCALL_NET_ICMP_POLL',
    signature: 'bool icmp_poll_reply(uint16_t id, uint16_t seq, icmp_echo_reply_t *out_reply, uint32_t timeout_ms)',
  },
  {
    numHex: '0x1093',
    numDec: 4243,
    name: 'IPO_SYSCALL_NET_SOCKET',
    signature: 'int socket(int domain, int type, int protocol)',
  },
  {
    numHex: '0x1094',
    numDec: 4244,
    name: 'IPO_SYSCALL_NET_BIND',
    signature: 'int bind(int sockfd, const struct sockaddr *addr, socklen_t addrlen)',
  },
  {
    numHex: '0x1095',
    numDec: 4245,
    name: 'IPO_SYSCALL_NET_LISTEN',
    signature: 'int listen(int sockfd, int backlog)',
  },
  {
    numHex: '0x1096',
    numDec: 4246,
    name: 'IPO_SYSCALL_NET_ACCEPT',
    signature: 'int accept_timeout(int sockfd, struct sockaddr *addr, socklen_t *addrlen, uint32_t timeout_ms)',
  },
  {
    numHex: '0x1097',
    numDec: 4247,
    name: 'IPO_SYSCALL_NET_CONNECT',
    signature: 'int connect(int sockfd, const struct sockaddr *addr, socklen_t addrlen)',
  },
  {
    numHex: '0x1098',
    numDec: 4248,
    name: 'IPO_SYSCALL_NET_SEND',
    signature: 'ssize_t send(int sockfd, const void *buf, size_t len, int flags)',
  },
  {
    numHex: '0x1099',
    numDec: 4249,
    name: 'IPO_SYSCALL_NET_RECV',
    signature: 'ssize_t recv(int sockfd, void *buf, size_t len, int flags)',
  },
  {
    numHex: '0x109A',
    numDec: 4250,
    name: 'IPO_SYSCALL_NET_CLOSE',
    signature: 'int socket_close(int sockfd)',
  },
  {
    numHex: '0x109B',
    numDec: 4251,
    name: 'IPO_SYSCALL_NET_CONNECT_ENDPOINT',
    signature: 'int connect_endpoint(int sockfd, const char *host_or_ip, uint16_t port)',
  },
  {
    numHex: '0x109C',
    numDec: 4252,
    name: 'IPO_SYSCALL_NET_POLL',
    signature: 'void net_poll(void)',
  },
  {
    numHex: '0x109D',
    numDec: 4253,
    name: 'IPO_SYSCALL_NET_GET_INTERFACE',
    signature: 'net_if_t *net_get_interface(void)',
  },
  {
    numHex: '0x109E',
    numDec: 4254,
    name: 'IPO_SYSCALL_NET_INIT',
    signature: 'bool net_init(const net_config_t *config)',
  },
  {
    numHex: '0x109F',
    numDec: 4255,
    name: 'IPO_SYSCALL_NET_SET_IP',
    signature: 'void net_set_ip(ip4_addr_t ip, ip4_addr_t netmask, ip4_addr_t gateway, ip4_addr_t dns)',
  },
  {
    numHex: '0x10A0',
    numDec: 4256,
    name: 'IPO_SYSCALL_KBD_GET_SCANCODE',
    signature: 'uint8_t ipo_kbd_get_scancode(void)',
  },
  {
    numHex: '0x10A1',
    numDec: 4257,
    name: 'IPO_SYSCALL_KBD_WAIT_SCANCODE',
    signature: 'uint8_t ipo_kbd_wait_scancode(void)',
  },
  {
    numHex: '0x10A2',
    numDec: 4258,
    name: 'IPO_SYSCALL_KBD_SET_APP_MODE',
    signature: 'void ipo_kbd_set_app_mode(bool enabled)',
  },
  {
    numHex: '0x10A3',
    numDec: 4259,
    name: 'IPO_SYSCALL_KBD_FLUSH',
    signature: 'void ipo_kbd_flush(void)',
  },
  {
    numHex: '0x10A4',
    numDec: 4260,
    name: 'IPO_SYSCALL_KBD_GET_MODIFIERS',
    signature: 'uint32_t ipo_kbd_get_modifiers(void)',
  },
  {
    numHex: '0x10A5',
    numDec: 4261,
    name: 'IPO_SYSCALL_KBD_POLL',
    signature: 'void ipo_kbd_poll(void)',
  },
  {
    numHex: '0x10A6',
    numDec: 4262,
    name: 'IPO_SYSCALL_KBD_GET_KEY_STRING',
    signature: 'int ipo_kbd_get_key_string(uint8_t scancode, char *buf, uint32_t max_len)',
  },
  {
    numHex: '0x10B0',
    numDec: 4272,
    name: 'IPO_SYSCALL_MOUSE_GET_STATE',
    signature: 'void ipo_mouse_get_state(mouse_state_t *state)',
  },
  {
    numHex: '0x10B1',
    numDec: 4273,
    name: 'IPO_SYSCALL_MOUSE_GET_MOTION',
    signature: 'int ipo_mouse_get_motion(int64_t *dx, int64_t *dy)',
  },
  {
    numHex: '0x10C0',
    numDec: 4288,
    name: 'IPO_SYSCALL_VGA_SET_CURSOR',
    signature: 'void ipo_vga_set_cursor(uint16_t pos)',
  },
  {
    numHex: '0x10C1',
    numDec: 4289,
    name: 'IPO_SYSCALL_VGA_GET_CURSOR',
    signature: 'uint16_t ipo_vga_get_cursor(void)',
  },
  {
    numHex: '0x10C2',
    numDec: 4290,
    name: 'IPO_SYSCALL_VGA_SHOW_CURSOR',
    signature: 'void ipo_vga_show_cursor(void)',
  },
  {
    numHex: '0x10C3',
    numDec: 4291,
    name: 'IPO_SYSCALL_VGA_HIDE_CURSOR',
    signature: 'void ipo_vga_hide_cursor(void)',
  },
  {
    numHex: '0x10C4',
    numDec: 4292,
    name: 'IPO_SYSCALL_VGA_SET_PALETTE',
    signature: 'void ipo_vga_set_palette(uint8_t index, uint8_t r, uint8_t g, uint8_t b)',
  },
  {
    numHex: '0x10C5',
    numDec: 4293,
    name: 'IPO_SYSCALL_VGA_SET_OVERLAY_FLAGS',
    signature: 'void ipo_vga_set_overlay_flags(uint32_t flags)',
  },
  {
    numHex: '0x10C6',
    numDec: 4294,
    name: 'IPO_SYSCALL_VGA_GET_OVERLAY_FLAGS',
    signature: 'uint32_t ipo_vga_get_overlay_flags(void)',
  },
  {
    numHex: '0x10C7',
    numDec: 4295,
    name: 'IPO_SYSCALL_VGA_GET_TEXT_INFO',
    signature: 'int ipo_vga_get_text_info(uint16_t *cols, uint16_t *rows, uint32_t *vram_addr)',
  },
  {
    numHex: '0x10D0',
    numDec: 4304,
    name: 'IPO_SYSCALL_AUDIO_INIT',
    signature: 'bool ipo_audio_init(void)',
  },
  {
    numHex: '0x10D1',
    numDec: 4305,
    name: 'IPO_SYSCALL_AUDIO_TICK',
    signature: 'void ipo_audio_tick(void)',
  },
  {
    numHex: '0x10D2',
    numDec: 4306,
    name: 'IPO_SYSCALL_AUDIO_STOP_ALL',
    signature: 'void ipo_audio_stop_all(void)',
  },
  {
    numHex: '0x10D3',
    numDec: 4307,
    name: 'IPO_SYSCALL_AUDIO_STREAM_CREATE',
    signature: 'audio_stream_t *ipo_audio_stream_create(int format, int channels, uint32_t sample_rate, const void *data, size_t size)',
  },
  {
    numHex: '0x10D4',
    numDec: 4308,
    name: 'IPO_SYSCALL_AUDIO_STREAM_CREATE_RING',
    signature: 'audio_stream_t *ipo_audio_stream_create_ring(int format, int channels, uint32_t sample_rate, const void *data, size_t size, size_t ring_size)',
  },
  {
    numHex: '0x10D5',
    numDec: 4309,
    name: 'IPO_SYSCALL_AUDIO_STREAM_DESTROY',
    signature: 'void ipo_audio_stream_destroy(audio_stream_t *stream)',
  },
  {
    numHex: '0x10D6',
    numDec: 4310,
    name: 'IPO_SYSCALL_AUDIO_STREAM_PLAY',
    signature: 'void ipo_audio_stream_play(audio_stream_t *stream)',
  },
  {
    numHex: '0x10D7',
    numDec: 4311,
    name: 'IPO_SYSCALL_AUDIO_STREAM_PAUSE',
    signature: 'void ipo_audio_stream_pause(audio_stream_t *stream)',
  },
  {
    numHex: '0x10D8',
    numDec: 4312,
    name: 'IPO_SYSCALL_AUDIO_STREAM_STOP',
    signature: 'void ipo_audio_stream_stop(audio_stream_t *stream)',
  },
  {
    numHex: '0x10D9',
    numDec: 4313,
    name: 'IPO_SYSCALL_AUDIO_STREAM_SEEK',
    signature: 'void ipo_audio_stream_seek(audio_stream_t *stream, double fraction)',
  },
  {
    numHex: '0x10DA',
    numDec: 4314,
    name: 'IPO_SYSCALL_AUDIO_STREAM_SET_VOL',
    signature: 'void ipo_audio_stream_set_volume(audio_stream_t *stream, float volume)',
  },
  {
    numHex: '0x10DB',
    numDec: 4315,
    name: 'IPO_SYSCALL_AUDIO_STREAM_PROGRESS',
    signature: 'void ipo_audio_stream_progress(audio_stream_t *stream, double *out_progress)',
  },
  {
    numHex: '0x10DC',
    numDec: 4316,
    name: 'IPO_SYSCALL_AUDIO_STREAM_UPDATE',
    signature: 'void ipo_audio_stream_update_buffered(audio_stream_t *stream, size_t new_size, bool loop)',
  },
  {
    numHex: '0x10DD',
    numDec: 4317,
    name: 'IPO_SYSCALL_AUDIO_SET_FP_CONFIG',
    signature: 'bool audio_set_fp_config(const audio_fp_config_t *cfg)',
  },
  {
    numHex: '0x10DE',
    numDec: 4318,
    name: 'IPO_SYSCALL_AUDIO_GET_FP_CONFIG',
    signature: 'bool audio_get_fp_config(audio_fp_config_t *out_cfg)',
  },
  {
    numHex: '0x10DF',
    numDec: 4319,
    name: 'IPO_SYSCALL_AUDIO_GET_STATS',
    signature: 'bool audio_get_stats(audio_stats_t *out_stats)',
  },
  {
    numHex: '0x10E0',
    numDec: 4320,
    name: 'IPO_SYSCALL_BINFMT_REGISTER',
    signature: 'int ipo_binfmt_register(const char *name, const void *magic, uint32_t magic_len, uint32_t offset, const char *runner_path)',
  },
  {
    numHex: '0x10E1',
    numDec: 4321,
    name: 'IPO_SYSCALL_BINFMT_UNREGISTER',
    signature: 'int ipo_binfmt_unregister(const char *name)',
  },
  {
    numHex: '0x10E2',
    numDec: 4322,
    name: 'IPO_SYSCALL_BINFMT_LIST',
    signature: 'int ipo_binfmt_list(void)',
  },
  {
    numHex: '0x10F0',
    numDec: 4336,
    name: 'IPO_SYSCALL_IPC_CREATE',
    signature: 'int ipo_ipc_create(const char *name, uint32_t public_rights)',
  },
  {
    numHex: '0x10F1',
    numDec: 4337,
    name: 'IPO_SYSCALL_IPC_OPEN',
    signature: 'int ipo_ipc_open(const char *name, uint32_t rights)',
  },
  {
    numHex: '0x10F2',
    numDec: 4338,
    name: 'IPO_SYSCALL_IPC_CLOSE',
    signature: 'int ipo_ipc_close(int endpoint)',
  },
  {
    numHex: '0x10F3',
    numDec: 4339,
    name: 'IPO_SYSCALL_IPC_DESTROY',
    signature: 'int ipo_ipc_destroy(int endpoint)',
  },
  {
    numHex: '0x10F4',
    numDec: 4340,
    name: 'IPO_SYSCALL_IPC_SEND',
    signature: 'int ipo_ipc_send(int endpoint, const void *message, uint32_t length, uint32_t flags)',
  },
  {
    numHex: '0x10F5',
    numDec: 4341,
    name: 'IPO_SYSCALL_IPC_RECEIVE',
    signature: 'int ipo_ipc_receive(int endpoint, void *buffer, uint32_t capacity, uint32_t *sender_pid, uint32_t *msg_len, uint32_t flags)',
  },
  {
    numHex: '0x10F6',
    numDec: 4342,
    name: 'IPO_SYSCALL_IPC_PIPE_CREATE',
    signature: 'int ipo_ipc_pipe_create(const char *name, uint32_t public_rights, int *pipe_handle)',
  },
  {
    numHex: '0x10F7',
    numDec: 4343,
    name: 'IPO_SYSCALL_IPC_PIPE_OPEN',
    signature: 'int ipo_ipc_pipe_open(const char *name, uint32_t rights)',
  },
  {
    numHex: '0x10F8',
    numDec: 4344,
    name: 'IPO_SYSCALL_IPC_PIPE_CLOSE',
    signature: 'int ipo_ipc_pipe_close(int pipe_handle, uint32_t rights)',
  },
  {
    numHex: '0x10F9',
    numDec: 4345,
    name: 'IPO_SYSCALL_IPC_PIPE_DESTROY',
    signature: 'int ipo_ipc_pipe_destroy(int pipe_handle)',
  },
  {
    numHex: '0x10FA',
    numDec: 4346,
    name: 'IPO_SYSCALL_IPC_PIPE_READ',
    signature: 'int ipo_ipc_pipe_read(int pipe_handle, void *buffer, uint32_t capacity, uint32_t flags)',
  },
  {
    numHex: '0x10FB',
    numDec: 4347,
    name: 'IPO_SYSCALL_IPC_PIPE_WRITE',
    signature: 'int ipo_ipc_pipe_write(int pipe_handle, const void *buffer, uint32_t length, uint32_t flags)',
  },
  {
    numHex: '0x10FC',
    numDec: 4348,
    name: 'IPO_SYSCALL_IPC_NOTIFY_SEND',
    signature: 'int ipo_ipc_notify_send(uint32_t recipient_pid, uint32_t event, uint32_t value)',
  },
  {
    numHex: '0x10FD',
    numDec: 4349,
    name: 'IPO_SYSCALL_IPC_NOTIFY_WAIT',
    signature: 'int ipo_ipc_notify_wait(ipo_ipc_notification_t *notification, uint32_t flags)',
  },
  {
    numHex: '0x10FE',
    numDec: 4350,
    name: 'IPO_SYSCALL_IPC_PIPE_POLL',
    signature: 'int ipo_ipc_pipe_poll(int pipe_handle)',
  },
  {
    numHex: '0x1100',
    numDec: 4352,
    name: 'IPO_SYSCALL_SHM_CREATE',
    signature: 'int ipo_shm_create(const char *name, uint32_t size, uint32_t public_rights)',
  },
  {
    numHex: '0x1101',
    numDec: 4353,
    name: 'IPO_SYSCALL_SHM_OPEN',
    signature: 'int ipo_shm_open(const char *name, uint32_t rights)',
  },
  {
    numHex: '0x1102',
    numDec: 4354,
    name: 'IPO_SYSCALL_SHM_ATTACH',
    signature: 'int ipo_shm_attach(int handle, void **address, uint32_t *size)',
  },
  {
    numHex: '0x1103',
    numDec: 4355,
    name: 'IPO_SYSCALL_SHM_DETACH',
    signature: 'int ipo_shm_detach(int handle)',
  },
  {
    numHex: '0x1104',
    numDec: 4356,
    name: 'IPO_SYSCALL_SHM_DESTROY',
    signature: 'int ipo_shm_destroy(int handle)',
  },
  {
    numHex: '0x1110',
    numDec: 4368,
    name: 'IPO_SYSCALL_SIGACTION',
    signature: 'int sigaction(int signum, const struct sigaction *act, struct sigaction *oldact)',
  },
  {
    numHex: '0x1111',
    numDec: 4369,
    name: 'IPO_SYSCALL_SIGPROCMASK',
    signature: 'int sigprocmask(int how, const sigset_t *set, sigset_t *oldset)',
  },
  {
    numHex: '0x1112',
    numDec: 4370,
    name: 'IPO_SYSCALL_KILL',
    signature: 'int kill(pid_t pid, int sig)',
  },
  {
    numHex: '0x1113',
    numDec: 4371,
    name: 'IPO_SYSCALL_SIGALTSTACK',
    signature: 'int sigaltstack(const stack_t *ss, stack_t *old_ss)',
  },
  {
    numHex: '0x1120',
    numDec: 4384,
    name: 'IPO_SYSCALL_THREAD_CREATE',
    signature: 'int ipo_thread_create(void *(*entry)(void *), void *arg, uint32_t *out_tid)',
  },
  {
    numHex: '0x1121',
    numDec: 4385,
    name: 'IPO_SYSCALL_THREAD_EXIT',
    signature: 'void ipo_thread_exit(uintptr_t retval)',
  },
  {
    numHex: '0x1122',
    numDec: 4386,
    name: 'IPO_SYSCALL_THREAD_JOIN',
    signature: 'int ipo_thread_join(uint32_t tid, uintptr_t *out_retval)',
  },
  {
    numHex: '0x1123',
    numDec: 4387,
    name: 'IPO_SYSCALL_THREAD_SELF',
    signature: 'uint32_t ipo_thread_self(void)',
  },
  {
    numHex: '0x1130',
    numDec: 4400,
    name: 'IPO_SYSCALL_THREAD_SYNC',
    signature: 'int ipo_sync_call(const void *object, uint32_t type, uint32_t op, uint32_t val)',
  },
  {
    numHex: '0x1140',
    numDec: 4416,
    name: 'IPO_SYSCALL_INPUT_POLL_KEY_EXT',
    signature: 'int ipo_input_poll_key_ext(ipo_key_event_t *out_ev)',
  },
  {
    numHex: '0x1141',
    numDec: 4417,
    name: 'IPO_SYSCALL_INPUT_GET_KEY_STATE',
    signature: 'bool ipo_input_get_key_state(uint32_t keycode)',
  },
  {
    numHex: '0x1142',
    numDec: 4418,
    name: 'IPO_SYSCALL_INPUT_GET_MODIFIERS',
    signature: 'uint32_t ipo_sys_input_get_modifiers(void)',
  },
  {
    numHex: '0x1143',
    numDec: 4419,
    name: 'IPO_SYSCALL_SHORTCUT_REGISTER',
    signature: 'uint32_t ipo_shortcut_register(const ipo_shortcut_spec_t *spec)',
  },
  {
    numHex: '0x1144',
    numDec: 4420,
    name: 'IPO_SYSCALL_SHORTCUT_UNREGISTER',
    signature: 'int ipo_shortcut_unregister(uint32_t shortcut_id)',
  },
  {
    numHex: '0x1145',
    numDec: 4421,
    name: 'IPO_SYSCALL_SHORTCUT_POLL',
    signature: 'int ipo_shortcut_poll(ipo_shortcut_event_t *out_ev)',
  },
  {
    numHex: '0x1146',
    numDec: 4422,
    name: 'IPO_SYSCALL_INPUT_DEV_REGISTER',
    signature: 'uint32_t ipo_input_dev_register(const ipo_input_dev_desc_t *desc)',
  },
  {
    numHex: '0x1147',
    numDec: 4423,
    name: 'IPO_SYSCALL_INPUT_DEV_UNREGISTER',
    signature: 'int ipo_input_dev_unregister(uint32_t dev_id)',
  },
  {
    numHex: '0x1148',
    numDec: 4424,
    name: 'IPO_SYSCALL_INPUT_DEV_EMIT',
    signature: 'int ipo_input_dev_emit(uint32_t dev_id, const ipo_input_event_t *ev)',
  },
  {
    numHex: '0x1149',
    numDec: 4425,
    name: 'IPO_SYSCALL_INPUT_DEV_LIST',
    signature: 'uint32_t ipo_input_dev_list(ipo_input_dev_info_t *out_arr, uint32_t max_count)',
  },
  {
    numHex: '0x114A',
    numDec: 4426,
    name: 'IPO_SYSCALL_INPUT_DEV_POLL_EVENT',
    signature: 'int ipo_input_dev_poll_event(uint32_t dev_filter_id, ipo_input_event_t *out_ev)',
  },
  {
    numHex: '0x114B',
    numDec: 4427,
    name: 'IPO_SYSCALL_INPUT_DEV_GET_STATE',
    signature: 'int ipo_input_dev_get_state(uint32_t dev_id, uint16_t type, uint32_t code, int32_t *out_val)',
  },
  {
    numHex: '0x114C',
    numDec: 4428,
    name: 'IPO_SYSCALL_MOUSE_INJECT',
    signature: 'int ipo_sys_mouse_inject(int32_t x_or_dx, int32_t y_or_dy, int32_t dz, uint32_t buttons, bool abs)',
  },
  {
    numHex: '0x114D',
    numDec: 4429,
    name: 'IPO_SYSCALL_INPUT_SET_HOTKEY_MODE',
    signature: 'int ipo_sys_input_set_hotkey_mode(uint32_t mode_flags)',
  },
  {
    numHex: '0x114E',
    numDec: 4430,
    name: 'IPO_SYSCALL_INPUT_GET_HOTKEY_MODE',
    signature: 'uint32_t ipo_sys_input_get_hotkey_mode(void)',
  },
  {
    numHex: '0x1150',
    numDec: 4432,
    name: 'IPO_SYSCALL_PS2_HOOK_REGISTER',
    signature: 'uint32_t ipo_ps2_hook_register(uint32_t chan_mask, uint32_t flags)',
  },
  {
    numHex: '0x1151',
    numDec: 4433,
    name: 'IPO_SYSCALL_PS2_HOOK_UNREGISTER',
    signature: 'int ipo_ps2_hook_unregister(uint32_t handle)',
  },
  {
    numHex: '0x1152',
    numDec: 4434,
    name: 'IPO_SYSCALL_PS2_HOOK_POLL',
    signature: 'uint32_t ipo_ps2_hook_poll(uint32_t handle, ipo_ps2_byte_event_t *out_events, uint32_t max_count)',
  },
  {
    numHex: '0x1153',
    numDec: 4435,
    name: 'IPO_SYSCALL_PS2_TRANSACT',
    signature: 'int ipo_ps2_transact(const ipo_ps2_transact_req_t *req)',
  },
  {
    numHex: '0x1160',
    numDec: 4448,
    name: 'IPO_SYSCALL_IRQ_SUBSCRIBE',
    signature: 'uint32_t ipo_irq_subscribe(uint8_t irq)',
  },
  {
    numHex: '0x1161',
    numDec: 4449,
    name: 'IPO_SYSCALL_IRQ_UNSUBSCRIBE',
    signature: 'int ipo_irq_unsubscribe(uint32_t handle)',
  },
  {
    numHex: '0x1162',
    numDec: 4450,
    name: 'IPO_SYSCALL_IRQ_POLL',
    signature: 'uint32_t ipo_irq_poll(uint32_t handle, uint32_t *out_total, uint64_t *out_last_ms)',
  },
  {
    numHex: '0x1163',
    numDec: 4451,
    name: 'IPO_SYSCALL_IRQ_GET_COUNT',
    signature: 'uint32_t ipo_irq_get_count(uint8_t irq)',
  },
  {
    numHex: '0x1164',
    numDec: 4452,
    name: 'IPO_SYSCALL_IRQ_REGISTER_CB',
    signature: 'uint32_t ipo_irq_register_cb(uint8_t irq, ipo_irq_cb_t fn, void *ctx)',
  },
  {
    numHex: '0x1165',
    numDec: 4453,
    name: 'IPO_SYSCALL_IRQ_UNREGISTER_CB',
    signature: 'int ipo_irq_unregister_cb(uint32_t handle)',
  },
  {
    numHex: '0x1170',
    numDec: 4464,
    name: 'IPO_SYSCALL_HW_MAP_MMIO',
    signature: 'void *ipo_hw_map_mmio(uint32_t phys_addr, uint32_t size, uint32_t flags)',
  },
  {
    numHex: '0x1171',
    numDec: 4465,
    name: 'IPO_SYSCALL_HW_UNMAP_MMIO',
    signature: 'int ipo_hw_unmap_mmio(void *virt_addr, uint32_t size)',
  },
  {
    numHex: '0x1172',
    numDec: 4466,
    name: 'IPO_SYSCALL_HW_ALLOC_DMA',
    signature: 'void *ipo_hw_alloc_dma(uint32_t size, uint32_t alignment, uint32_t *out_phys)',
  },
  {
    numHex: '0x1173',
    numDec: 4467,
    name: 'IPO_SYSCALL_HW_FREE_DMA',
    signature: 'int ipo_hw_free_dma(void *virt_addr)',
  },
  {
    numHex: '0x1174',
    numDec: 4468,
    name: 'IPO_SYSCALL_HW_VIRT_TO_PHYS',
    signature: 'uint32_t ipo_hw_virt_to_phys(const void *virt_addr)',
  },
  {
    numHex: '0x1178',
    numDec: 4472,
    name: 'IPO_SYSCALL_PCI_GET_COUNT',
    signature: 'uint32_t ipo_sys_pci_get_count(void)',
  },
  {
    numHex: '0x1179',
    numDec: 4473,
    name: 'IPO_SYSCALL_PCI_GET_DEVICE',
    signature: 'int ipo_pci_get_device(uint32_t index, ipo_pci_dev_info_t *out_info)',
  },
  {
    numHex: '0x117A',
    numDec: 4474,
    name: 'IPO_SYSCALL_PCI_CONFIG_READ',
    signature: 'uint32_t ipo_pci_config_read(uint8_t bus, uint8_t slot, uint8_t func, uint8_t offset, uint8_t width)',
  },
  {
    numHex: '0x117B',
    numDec: 4475,
    name: 'IPO_SYSCALL_PCI_CONFIG_WRITE',
    signature: 'int ipo_pci_config_write(uint8_t bus, uint8_t slot, uint8_t func, uint8_t offset, uint8_t width, uint32_t value)',
  },
  {
    numHex: '0x117C',
    numDec: 4476,
    name: 'IPO_SYSCALL_PCI_ENABLE_BUS_MASTER',
    signature: 'int ipo_pci_enable_bus_master(uint8_t bus, uint8_t slot, uint8_t func)',
  },
  {
    numHex: '0x1180',
    numDec: 4480,
    name: 'IPO_SYSCALL_DEV_GET_COUNT',
    signature: 'uint32_t ipo_sys_device_get_count(void)',
  },
  {
    numHex: '0x1181',
    numDec: 4481,
    name: 'IPO_SYSCALL_DEV_GET_INFO',
    signature: 'int ipo_device_get_info(uint32_t index, ipo_device_info_t *out_info)',
  },
  {
    numHex: '0x1182',
    numDec: 4482,
    name: 'IPO_SYSCALL_DEV_REGISTER',
    signature: 'uint32_t ipo_device_register(const ipo_device_info_t *info)',
  },
  {
    numHex: '0x1183',
    numDec: 4483,
    name: 'IPO_SYSCALL_DEV_UNREGISTER',
    signature: 'int ipo_device_unregister(uint32_t dev_id)',
  },
  {
    numHex: '0x1190',
    numDec: 4496,
    name: 'IPO_SYSCALL_WM_SET_CURSOR_VISIBLE',
    signature: 'void wm_set_cursor_visible(wm_window_t *win, bool visible)',
  },
  {
    numHex: '0x1191',
    numDec: 4497,
    name: 'IPO_SYSCALL_WM_GET_CURSOR_VISIBLE',
    signature: 'bool wm_get_cursor_visible(const wm_window_t *win)',
  },
  {
    numHex: '0x1192',
    numDec: 4498,
    name: 'IPO_SYSCALL_WM_GET_SCREEN_BOUNDS',
    signature: 'void wm_get_screen_bounds(int *out_w, int *out_h)',
  },
  {
    numHex: '0x1193',
    numDec: 4499,
    name: 'IPO_SYSCALL_WM_SET_CURSOR_SCALE',
    signature: 'bool wm_set_cursor_scale(int width, int height)',
  },
  {
    numHex: '0x1194',
    numDec: 4500,
    name: 'IPO_SYSCALL_WM_GET_CURSOR_SCALE',
    signature: 'void wm_get_cursor_scale(int *out_width, int *out_height)',
  },
  {
    numHex: '0x11A0',
    numDec: 4512,
    name: 'IPO_SYSCALL_KMOD_LOAD',
    signature: 'int ipo_kmod_load(const char *path, uint32_t *out_mod_id)',
  },
  {
    numHex: '0x11A1',
    numDec: 4513,
    name: 'IPO_SYSCALL_KMOD_UNLOAD',
    signature: 'int ipo_kmod_unload(const char *name)',
  },
  {
    numHex: '0x11A2',
    numDec: 4514,
    name: 'IPO_SYSCALL_KMOD_COUNT',
    signature: 'uint32_t ipo_kmod_count(void)',
  },
  {
    numHex: '0x11A3',
    numDec: 4515,
    name: 'IPO_SYSCALL_KMOD_LOAD_MEM',
    signature: 'int ipo_kmod_load_mem(const char *name, const void *buf, size_t size, uint32_t *out_mod_id)',
  },
  {
    numHex: '0x11A4',
    numDec: 4516,
    name: 'IPO_SYSCALL_EXT_REGISTER',
    signature: 'uint32_t ipo_ext_register(const ipo_ext_desc_t *desc, uint32_t owner_pid)',
  },
  {
    numHex: '0x11A5',
    numDec: 4517,
    name: 'IPO_SYSCALL_EXT_UNREGISTER',
    signature: 'int ipo_ext_unregister(uint32_t ext_id, uint32_t caller_pid)',
  },
  {
    numHex: '0x11A6',
    numDec: 4518,
    name: 'IPO_SYSCALL_EXT_CALL',
    signature: 'int ipo_ext_call(const char *name, uint32_t op, uintptr_t a0, uintptr_t a1, uintptr_t a2, uintptr_t a3)',
  },
  {
    numHex: '0x11A7',
    numDec: 4519,
    name: 'IPO_SYSCALL_EXT_LIST',
    signature: 'uint32_t ipo_ext_list(ipo_ext_info_t *out_arr, uint32_t max_count)',
  },
  {
    numHex: '0x11A8',
    numDec: 4520,
    name: 'IPO_SYSCALL_CHAN_LIST',
    signature: 'uint32_t ipo_chan_list(ipo_chan_info_t *out_arr, uint32_t max_count)',
  },
  {
    numHex: '0x11A9',
    numDec: 4521,
    name: 'IPO_SYSCALL_CHAN_TX',
    signature: 'int ipo_chan_transmit(uint32_t chan_id, const void *frame, uint32_t len)',
  },
  {
    numHex: '0x11AA',
    numDec: 4522,
    name: 'IPO_SYSCALL_CHAN_RX',
    signature: 'int ipo_chan_poll_sub(uint32_t sub_id, void *buf, uint32_t max_len)',
  },
  {
    numHex: '0x11AB',
    numDec: 4523,
    name: 'IPO_SYSCALL_CHAN_SUB',
    signature: 'uint32_t ipo_chan_subscribe(uint32_t chan_id, uint16_t ethertype_filter, ipo_chan_rx_cb_t cb, void *ctx, uint32_t owner_pid)',
  },
  {
    numHex: '0x11AC',
    numDec: 4524,
    name: 'IPO_SYSCALL_CHAN_UNSUB',
    signature: 'int ipo_chan_unsubscribe(uint32_t sub_id, uint32_t caller_pid)',
  },
  {
    numHex: '0x11AD',
    numDec: 4525,
    name: 'IPO_SYSCALL_EXT_UPDATE',
    signature: 'int ipo_ext_update(uint32_t ext_id, const ipo_ext_desc_t *new_desc, uint32_t caller_pid)',
  },
  {
    numHex: '0x11B0',
    numDec: 4528,
    name: 'IPO_SYSCALL_SMP_GET_COUNT',
    signature: 'uint32_t ipo_smp_get_count(uint32_t *out_online_count)',
  },
  {
    numHex: '0x11B1',
    numDec: 4529,
    name: 'IPO_SYSCALL_SMP_GET_INFO',
    signature: 'int ipo_smp_get_info(uint32_t cpu_id, cpu_info_t *out_info)',
  },
  {
    numHex: '0x11B2',
    numDec: 4530,
    name: 'IPO_SYSCALL_SMP_SUBMIT',
    signature: 'int ipo_smp_submit(uint32_t target_cpu, smp_work_fn_t fn, uintptr_t arg, uint32_t *out_task_id)',
  },
  {
    numHex: '0x11B3',
    numDec: 4531,
    name: 'IPO_SYSCALL_SMP_WAIT',
    signature: 'int ipo_smp_wait(uint32_t task_id, uint32_t timeout_ms, smp_task_result_t *out_res)',
  },
  {
    numHex: '0x11B4',
    numDec: 4532,
    name: 'IPO_SYSCALL_SMP_CURRENT',
    signature: 'uint32_t ipo_smp_current(uint32_t *out_lapic_id)',
  },
  {
    numHex: '0x11C0',
    numDec: 4544,
    name: 'IPO_SYSCALL_DYNMOD_AUTH',
    signature: 'int dynmod_authorize(uint32_t pid, uint32_t token)',
  },
  {
    numHex: '0x11C1',
    numDec: 4545,
    name: 'IPO_SYSCALL_DYNMOD_RESOLVE',
    signature: 'int dynmod_resolve_symbol(const char *name, ipo_vaddr_t *out_addr)',
  },
  {
    numHex: '0x11C2',
    numDec: 4546,
    name: 'IPO_SYSCALL_DYNMOD_READ',
    signature: 'int dynmod_read_mem(ipo_vaddr_t addr, void *out_buf, size_t size)',
  },
  {
    numHex: '0x11C3',
    numDec: 4547,
    name: 'IPO_SYSCALL_DYNMOD_WRITE_VAR',
    signature: 'int dynmod_write_var(ipo_vaddr_t addr, const void *in_buf, size_t size, uint32_t *out_patch_id)',
  },
  {
    numHex: '0x11C4',
    numDec: 4548,
    name: 'IPO_SYSCALL_DYNMOD_HOOK_FUNC',
    signature: 'int dynmod_hook_function(ipo_vaddr_t target_fn, ipo_vaddr_t replacement_fn, uint32_t *out_patch_id)',
  },
  {
    numHex: '0x11C5',
    numDec: 4549,
    name: 'IPO_SYSCALL_DYNMOD_HOOK_SYSCALL',
    signature: 'int dynmod_hook_syscall(uint32_t num, ipo_syscall_handler_t new_handler, ipo_syscall_handler_t *out_old, uint32_t *out_patch_id)',
  },
  {
    numHex: '0x11C6',
    numDec: 4550,
    name: 'IPO_SYSCALL_DYNMOD_RESTORE',
    signature: 'int dynmod_restore(uint32_t patch_id)',
  },
  {
    numHex: '0x11C7',
    numDec: 4551,
    name: 'IPO_SYSCALL_DYNMOD_LIST',
    signature: 'uint32_t dynmod_list(ipo_dynmod_info_t *out_arr, uint32_t max_count)',
  },
  {
    numHex: '0x11C8',
    numDec: 4552,
    name: 'IPO_SYSCALL_DYNMOD_COMPUTE_DEMO',
    signature: 'uint32_t dynmod_target_compute(uint32_t x, uint32_t y)',
  },
  {
    numHex: '0x11D0',
    numDec: 4560,
    name: 'IPO_SYSCALL_AUDIO_API_VERSION',
    signature: 'uint32_t ipo_audio_api_version(void)',
  },
  {
    numHex: '0x11D1',
    numDec: 4561,
    name: 'IPO_SYSCALL_AUDIO_GET_DEV_COUNT',
    signature: 'int ipo_audio_get_device_count(void)',
  },
  {
    numHex: '0x11D2',
    numDec: 4562,
    name: 'IPO_SYSCALL_AUDIO_GET_DEV_INFO',
    signature: 'int ipo_audio_get_device_info(uint32_t device_id, ipo_audio_device_info_t *out_info)',
  },
  {
    numHex: '0x11D3',
    numDec: 4563,
    name: 'IPO_SYSCALL_AUDIO_OPEN',
    signature: 'int ipo_audio_open(const ipo_audio_open_params_t *params, ipo_audio_handle_t *out_handle)',
  },
  {
    numHex: '0x11D4',
    numDec: 4564,
    name: 'IPO_SYSCALL_AUDIO_CLOSE',
    signature: 'int ipo_audio_close(ipo_audio_handle_t handle)',
  },
  {
    numHex: '0x11D5',
    numDec: 4565,
    name: 'IPO_SYSCALL_AUDIO_WRITE',
    signature: 'int ipo_audio_write(ipo_audio_handle_t handle, const void *pcm_data, size_t byte_count)',
  },
  {
    numHex: '0x11D6',
    numDec: 4566,
    name: 'IPO_SYSCALL_AUDIO_READ',
    signature: 'int ipo_audio_read(ipo_audio_handle_t handle, void *out_buf, size_t max_bytes)',
  },
  {
    numHex: '0x11D7',
    numDec: 4567,
    name: 'IPO_SYSCALL_AUDIO_HANDLE_PAUSE',
    signature: 'int ipo_audio_pause(ipo_audio_handle_t handle, bool paused)',
  },
  {
    numHex: '0x11D8',
    numDec: 4568,
    name: 'IPO_SYSCALL_AUDIO_HANDLE_SET_VOL',
    signature: 'int ipo_audio_set_volume(ipo_audio_handle_t handle, float volume)',
  },
  {
    numHex: '0x11D9',
    numDec: 4569,
    name: 'IPO_SYSCALL_AUDIO_HANDLE_CLOCK',
    signature: 'int ipo_audio_get_clock(ipo_audio_handle_t handle, ipo_audio_clock_t *out_clock)',
  },
  {
    numHex: '0x11DA',
    numDec: 4570,
    name: 'IPO_SYSCALL_AUDIO_STREAM_CLOCK',
    signature: 'int ipo_audio_get_stream_clock(audio_stream_t *stream, ipo_audio_clock_t *out_clock)',
  },
  {
    numHex: '0x11DB',
    numDec: 4571,
    name: 'IPO_SYSCALL_AUDIO_SET_MASTER_VOL',
    signature: 'int ipo_audio_set_master_volume(uint8_t left_0_255, uint8_t right_0_255)',
  },
  {
    numHex: '0x11DC',
    numDec: 4572,
    name: 'IPO_SYSCALL_AUDIO_GET_MASTER_VOL',
    signature: 'int ipo_audio_get_master_volume(uint8_t *out_left, uint8_t *out_right)',
  },
  {
    numHex: '0x11E0',
    numDec: 4576,
    name: 'IPO_SYSCALL_GFX_API_VERSION',
    signature: 'uint32_t ipo_gfx_api_version(void)',
  },
  {
    numHex: '0x11E1',
    numDec: 4577,
    name: 'IPO_SYSCALL_GFX_GET_CAPS',
    signature: 'int ipo_gfx_get_caps(ipo_gfx_caps_t *out_caps)',
  },
  {
    numHex: '0x11E2',
    numDec: 4578,
    name: 'IPO_SYSCALL_GFX_ENUM_MODES',
    signature: 'int ipo_gfx_enum_modes(uint32_t index, ipo_gfx_mode_info_t *out_mode)',
  },
  {
    numHex: '0x11E3',
    numDec: 4579,
    name: 'IPO_SYSCALL_GFX_SET_MODE',
    signature: 'int ipo_gfx_set_mode(uint32_t width, uint32_t height, uint32_t bpp)',
  },
  {
    numHex: '0x11E4',
    numDec: 4580,
    name: 'IPO_SYSCALL_GFX_GET_MODE',
    signature: 'int ipo_gfx_get_mode(ipo_gfx_mode_info_t *out_mode)',
  },
  {
    numHex: '0x11E5',
    numDec: 4581,
    name: 'IPO_SYSCALL_GFX_SELECT_FORMAT',
    signature: 'int ipo_gfx_select_best_formats(const ipo_color_select_req_t *req, ipo_pixel_format_t *out_ren, ipo_pixel_format_t *out_hw)',
  },
  {
    numHex: '0x11E6',
    numDec: 4582,
    name: 'IPO_SYSCALL_GFX_PRESENT_WINDOW',
    signature: 'int ipo_gfx_present_window(wm_window_t *win, const ipo_gfx_surface_desc_t *surf)',
  },
  {
    numHex: '0x11E7',
    numDec: 4583,
    name: 'IPO_SYSCALL_GFX_PRESENT_SCREEN',
    signature: 'int ipo_gfx_present_screen(const ipo_gfx_surface_desc_t *surf)',
  },
  {
    numHex: '0x11E8',
    numDec: 4584,
    name: 'IPO_SYSCALL_GFX_GET_STATS',
    signature: 'int ipo_gfx_get_stats(ipo_gfx_stats_t *out_stats)',
  },
  {
    numHex: '0x11E9',
    numDec: 4585,
    name: 'IPO_SYSCALL_GFX_GET_PALETTE32',
    signature: 'int ipo_gfx_sync_palette_32(uint32_t *out_xrgb256)',
  },
  {
    numHex: '0x11EA',
    numDec: 4586,
    name: 'IPO_SYSCALL_GFX_BGA_OP',
    signature: 'uint32_t ipo_gfx_bga_op(uint32_t op, void *opt_out)',
  },
  {
    numHex: '0x11F0',
    numDec: 4592,
    name: 'IPO_SYSCALL_GPU_GET_INFO',
    signature: 'int ipo_sys_gpu_get_info(ipo_gpu_info_t *out_info)',
  },
  {
    numHex: '0x11F1',
    numDec: 4593,
    name: 'IPO_SYSCALL_GPU_SET_MODE',
    signature: 'int ipo_sys_gpu_set_mode(uint32_t force_cpu)',
  },
  {
    numHex: '0x11F2',
    numDec: 4594,
    name: 'IPO_SYSCALL_GPU_CTX_CREATE',
    signature: 'int ipo_sys_gpu_ctx_create(uint32_t *out_ctx_id, const char *debug_name)',
  },
  {
    numHex: '0x11F3',
    numDec: 4595,
    name: 'IPO_SYSCALL_GPU_CTX_DESTROY',
    signature: 'int ipo_sys_gpu_ctx_destroy(uint32_t ctx_id)',
  },
  {
    numHex: '0x11F4',
    numDec: 4596,
    name: 'IPO_SYSCALL_GPU_RES_CREATE',
    signature: 'int ipo_sys_gpu_res_create(uint32_t ctx_id, const ipo_gpu_res_desc_t *desc, uint32_t *out_res_id)',
  },
  {
    numHex: '0x11F5',
    numDec: 4597,
    name: 'IPO_SYSCALL_GPU_RES_UPLOAD',
    signature: 'int ipo_sys_gpu_res_upload(const ipo_gpu_upload_desc_t *upload_desc)',
  },
  {
    numHex: '0x11F6',
    numDec: 4598,
    name: 'IPO_SYSCALL_GPU_RES_DESTROY',
    signature: 'int ipo_sys_gpu_res_destroy(uint32_t res_id)',
  },
  {
    numHex: '0x11F7',
    numDec: 4599,
    name: 'IPO_SYSCALL_GPU_SUBMIT_BATCH',
    signature: 'int ipo_sys_gpu_submit_batch(const ipo_gpu_batch_desc_t *batch_desc)',
  },
  {
    numHex: '0x1200',
    numDec: 4608,
    name: 'IPO_SYSCALL_THREAD_DETACH',
    signature: 'int ipo_thread_detach(uint32_t thread_id)',
  },
  {
    numHex: '0x1201',
    numDec: 4609,
    name: 'IPO_SYSCALL_THREAD_SET_TLS',
    signature: 'int ipo_thread_set_tls(uintptr_t tls_base)',
  },
  {
    numHex: '0x1202',
    numDec: 4610,
    name: 'IPO_SYSCALL_THREAD_GET_TLS',
    signature: 'uintptr_t ipo_thread_get_tls(void)',
  },
  {
    numHex: '0x1203',
    numDec: 4611,
    name: 'IPO_SYSCALL_CLOCK_GETTIME',
    signature: 'int ipo_clock_gettime(uint32_t clock_id, ipo_timespec_t *out_ts)',
  },
  {
    numHex: '0x1204',
    numDec: 4612,
    name: 'IPO_SYSCALL_NANOSLEEP',
    signature: 'int ipo_nanosleep(const ipo_timespec_t *req, ipo_timespec_t *rem)',
  },
  {
    numHex: '0x1205',
    numDec: 4613,
    name: 'IPO_SYSCALL_FUTEX',
    signature: 'int ipo_futex(volatile uint32_t *uaddr, uint32_t op, uint32_t val, uint32_t timeout_or_ts)',
  },
  {
    numHex: '0x1206',
    numDec: 4614,
    name: 'IPO_SYSCALL_MMAP',
    signature: 'void *ipo_mmap(void *hint, uint32_t len, uint32_t prot, uint32_t flags)',
  },
  {
    numHex: '0x1207',
    numDec: 4615,
    name: 'IPO_SYSCALL_MUNMAP',
    signature: 'int ipo_munmap(void *addr, uint32_t len)',
  },
  {
    numHex: '0x1208',
    numDec: 4616,
    name: 'IPO_SYSCALL_MPROTECT',
    signature: 'int ipo_mprotect(void *addr, uint32_t len, uint32_t prot)',
  },
  {
    numHex: '0xFFFF',
    numDec: 65535,
    name: 'IPO_SYSCALL_EXIT',
    signature: 'void ipo_exit(int status)',
  }
];
