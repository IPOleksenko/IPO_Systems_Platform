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
    title: 'gl_cube.c (TinyGL 3D Rendering on IPO_OS)',
    code: `#include <GL/gl.h>
#include <GL/glu.h>
#include <GL/ipo_gl.h>
#include <wm.h>

void draw_cube(float angle) {
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    glLoadIdentity();
    glTranslatef(0.0f, 0.0f, -5.0f);
    glRotatef(angle, 1.0f, 1.0f, 0.0f);

    glBegin(GL_QUADS);
    // Front face (Red)
    glColor3f(1.0f, 0.0f, 0.0f);
    glVertex3f(-1.0f, -1.0f,  1.0f);
    glVertex3f( 1.0f, -1.0f,  1.0f);
    glVertex3f( 1.0f,  1.0f,  1.0f);
    glVertex3f(-1.0f,  1.0f,  1.0f);
    // Back face (Green)
    glColor3f(0.0f, 1.0f, 0.0f);
    glVertex3f(-1.0f, -1.0f, -1.0f);
    glVertex3f(-1.0f,  1.0f, -1.0f);
    glVertex3f( 1.0f,  1.0f, -1.0f);
    glVertex3f( 1.0f, -1.0f, -1.0f);
    // Top face (Blue)
    glColor3f(0.0f, 0.0f, 1.0f);
    glVertex3f(-1.0f,  1.0f, -1.0f);
    glVertex3f(-1.0f,  1.0f,  1.0f);
    glVertex3f( 1.0f,  1.0f,  1.0f);
    glVertex3f( 1.0f,  1.0f, -1.0f);
    glEnd();

    ipo_gl_swap_buffers();
}
`
  },

  'wm-gui-window': {
    id: 'wm-gui-window',
    lang: 'c',
    title: 'wm_app.c (Creating GUI Window with Callbacks)',
    code: `#include <wm.h>
#include <stdio.h>

static void my_draw_cb(wm_window_t *win) {
    // Fill client area with light blue
    wm_buf_fill_rect(win->framebuf, win->w, win->h, 0, 0, win->w, win->h, 9);
    // Draw decorative border
    wm_buf_draw_rect(win->framebuf, win->w, win->h, 2, 2, win->w - 4, win->h - 4, 15);
    // Draw text inside window
    wm_buf_draw_string(win->framebuf, win->w, win->h, 10, 15, "IPO_OS GUI Window", 15);
    wm_buf_draw_string(win->framebuf, win->w, win->h, 10, 30, "Move with Mouse drag!", 14);
}

static void my_event_cb(wm_window_t *win, uint32_t event, uint32_t data) {
    if (event == WM_EVENT_CLICK) {
        printf("Window clicked!\n");
    } else if (event == WM_EVENT_CLOSE) {
        printf("Window closed!\n");
    }
}

int main(int argc, char **argv) {
    wm_window_options_t opts = WM_WINDOW_OPTIONS_DEFAULT;
    opts.x = 30;
    opts.y = 25;
    opts.w = 160;
    opts.h = 80;
    opts.title = "Sample Window";
    opts.draw_cb = my_draw_cb;
    opts.event_cb = my_event_cb;

    wm_window_t *win = wm_create_window(&opts);
    if (!win) {
        printf("Failed to create WM window\n");
        return 1;
    }
    // Return immediately: compositor async task keeps window alive on desktop
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
echo 'int main() { printf("Built inside IPO_OS!\n"); return 0; }' > prog.c

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
run edit & player & hosting_server

# Run multiple GUI/3D applications concurrently on the same desktop:
run gl_cube && gl_gears && fps_meter

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
python3 tools/disk_editor.py -i build/disks/disk.img touch /autorun "startwm\nrun gl_gears\n"

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
make boot         # Builds boot.bin bootloader (Stage 1 + Stage 2 + E820)
make image        # Builds bootable IPO_OS.img and ensures virtual disk images exist
make disks        # Prepares build/disks/disk.img and build/disks/disk.iso

# Host TAP networking configuration (direct L2 communication, host 192.168.7.1):
make setup-tap

# Launch in QEMU:
make run NET_MODE=tap AUDIODEV=pa
make run NET_MODE=user DRIVE_TYPE=ide

# Cleanups:
make clean        # Removes build directory (except disks)
make clean-lib    # Cleans kernel library artifacts
make clean-disks  # Removes build/disks directory

# === IPO_OS_Software (Userland Ecosystem) ===
# Build all userland libraries, apps, compilers, and font tables:
make -C ../IPO_OS_Software all
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

# 3. Inside IPO_OS shell: verify network configuration
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
    code: `# Execute standalone Boot ROM with embedded firmware and IPO_OS disk:
qemu-system-i386 \\
    -bios build/bootrom.bin \\
    -m 2048 \\
    -drive format=raw,file=build/IPO_OS.img,if=ide,index=0 \\
    -drive format=raw,file=build/disks/disk.img,if=ide,index=1 \\
    -device rtl8139,netdev=net0 \\
    -netdev user,id=net0,net=192.168.7.0/24,host=192.168.7.1,dhcpstart=192.168.7.2 \\
    -device sb16 \\
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

# 4. Build unified ROM image (default 4MB, embedding firmware payload)
make FIRMWARE=../IPO_Firmware/build/.bin/firmware.bin FLASH_SIZE=4M

# 5. Flash physical chip with verification
flashrom -p ch341a_spi -w build/bootrom.bin
`
  },

  'syscall-c-wrapper': {
    id: 'syscall-c-wrapper',
    lang: 'c',
    title: 'applications/lib/libc/sys.c (Syscall Invoker)',
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
        : "memory"
    );
    return ret;
}
`
  },

  'app-linker-script': {
    id: 'app-linker-script',
    lang: 'c',
    title: 'applications/app.ld (Application Linker Script)',
    code: `ENTRY(_start)

PHDRS
{
    text PT_LOAD;
    data PT_LOAD;
}

SECTIONS
{
    . = 0x800000; /* Applications loaded at 8 MB physical address */

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

    .eh_frame_hdr : ALIGN(4)
    {
        *(.eh_frame_hdr)
    } :text

    .eh_frame : ALIGN(4)
    {
        KEEP(*(.eh_frame))
        *(.eh_frame.*)
    } :text

    .gcc_except_table : ALIGN(4)
    {
        *(.gcc_except_table*)
    } :text

    . = ALIGN(4);

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

    .data : ALIGN(4)
    {
        *(.data*)
    } :data

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
    title: 'applications/entry.s (Entrypoint Stub)',
    code: `.global _start
.extern main

.section .entry, "ax"
_start:
    jmp main
`
  },

  'kernel-linker-script': {
    id: 'kernel-linker-script',
    lang: 'c',
    title: 'src/kernel/linker.ld (Kernel Linker Script)',
    code: `ENTRY(_start)

SECTIONS
{
    . = 0x10000; /* Kernel loaded at physical address 64 KB (0x10000) */

    .text :
    {
        *(.text*)
    }

    .rodata :
    {
        *(.rodata*)
    }

    .data :
    {
        *(.data*)
    }

    .bss :
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

CFLAGS  := -m32 -O2 \
           -ffreestanding \
           -fno-pic -fno-pie \
           -fno-builtin \
           -nostdlib -nostartfiles \
           -DIPO_APP \
           -I/path/to/IPO_OS/applications/include

LDFLAGS := -Wl,-T,app.ld -nostdlib -nostartfiles

all: my_app.bin

entry.o: entry.s
	$(CC) $(CFLAGS) -c entry.s -o entry.o

main.o: main.c
	$(CC) $(CFLAGS) -c main.c -o main.o

my_app.bin: entry.o main.o
	$(CC) $(CFLAGS) $(LDFLAGS) entry.o main.o -o my_app.elf
	$(OBJCOPY) --set-section-flags .bss=alloc,load,contents \
		-j .text -j .rodata -j .data -j .bss -O binary my_app.elf my_app.bin
	@rm my_app.elf
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
    totalSize: '64 bytes (Header of 512-byte block)',
    fields: [
      { offset: '0x00', size: '8 bytes', type: 'char[8]', name: 'magic' },
      { offset: '0x08', size: '8 bytes', type: 'uint64_t', name: 'fs_size_blocks' },
      { offset: '0x10', size: '4 bytes', type: 'uint32_t', name: 'block_size' },
      { offset: '0x14', size: '4 bytes', type: 'uint32_t', name: 'flags' },
      { offset: '0x18', size: '8 bytes', type: 'uint64_t', name: 'inode_count' },
      { offset: '0x20', size: '8 bytes', type: 'uint64_t', name: 'inode_bitmap_start' },
      { offset: '0x28', size: '8 bytes', type: 'uint64_t', name: 'block_bitmap_start' },
      { offset: '0x30', size: '8 bytes', type: 'uint64_t', name: 'inode_table_start' },
      { offset: '0x38', size: '8 bytes', type: 'uint64_t', name: 'data_blocks_start' }
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
      { offset: '0x78', size: '8 bytes', type: 'uint8_t[8]', name: '_pad' }
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
    totalSize: '512 bytes (68 B header + flexible members[] + CRC32)',
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
    totalSize: '64 bytes (8 entries per 512-byte sector, 64 entries total)',
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
    totalSize: '192 bytes (0xC0 on-disk raw) / Dynamic pointers in RAM',
    fields: [
      { offset: '0x00', size: '4 bytes', type: 'uint32_t', name: 'magic' },
      { offset: '0x04', size: '2 bytes', type: 'uint16_t', name: 'abi_version' },
      { offset: '0x06', size: '2 bytes', type: 'uint16_t', name: 'flags' },
      { offset: '0x08', size: '32 B / char*', name: 'name', type: 'char[32] / char*' },
      { offset: '0x28', size: '32 B / char*', name: 'author', type: 'char[32] / char*' },
      { offset: '0x48', size: '16 B / char*', name: 'version', type: 'char[16] / char*' },
      { offset: '0x58', size: '64 B / char*', name: 'description', type: 'char[64] / char*' },
      { offset: '0x98', size: '4 bytes', type: 'uint32_t', name: 'init_offset' },
      { offset: '0x9C', size: '4 bytes', type: 'uint32_t', name: 'cleanup_offset' },
      { offset: '0xA0', size: '12 bytes', type: 'uint32_t[3]', name: 'text/data/bss_size' },
      { offset: '0xAC', size: '8 bytes', type: 'uint32_t[2]', name: 'sym_tab_offset/count' },
      { offset: '0xB4', size: '8 bytes', type: 'uint32_t[2]', name: 'reloc_offset/count' },
      { offset: '0xBC', size: '4 bytes', type: 'uint32_t', name: 'checksum' }
    ]
  },
  {
    id: 'cpu_info',
    totalSize: '24 bytes',
    fields: [
      { offset: '0x00', size: '4 bytes', type: 'uint32_t', name: 'cpu_id' },
      { offset: '0x04', size: '4 bytes', type: 'uint32_t', name: 'lapic_id' },
      { offset: '0x08', size: '1 byte', type: 'bool', name: 'is_bsp' },
      { offset: '0x09', size: '1 byte', type: 'volatile bool', name: 'is_online' },
      { offset: '0x0C', size: '4 bytes', type: 'uint32_t', name: 'stack_base' },
      { offset: '0x10', size: '4 bytes', type: 'uint32_t', name: 'stack_top' },
      { offset: '0x14', size: '4 bytes', type: 'volatile uint32_t', name: 'ticks' }
    ]
  },
  {
    id: 'process_pcb',
    totalSize: '372 bytes (0x174)',
    fields: [
      { offset: '0x00', size: '4 bytes', type: 'uint32_t', name: 'pid' },
      { offset: '0x04', size: '4 bytes', type: 'void*', name: 'binary_base' },
      { offset: '0x08', size: '4 bytes', type: 'uint32_t', name: 'binary_size' },
      { offset: '0x0C', size: '4 bytes', type: 'uint32_t', name: 'entry_point' },
      { offset: '0x10', size: '4 bytes', type: 'void*', name: 'binary_storage' },
      { offset: '0x14', size: '4 bytes', type: 'uint32_t', name: 'data_offset' },
      { offset: '0x18', size: '4 bytes', type: 'uint32_t', name: 'data_size' },
      { offset: '0x1C', size: '1 byte', type: 'bool', name: 'code_mapped' },
      { offset: '0x20', size: '4 bytes', type: 'void*', name: 'stack_base' },
      { offset: '0x24', size: '4 bytes', type: 'uint32_t', name: 'stack_ptr' },
      { offset: '0x28', size: '4 bytes', type: 'uint32_t', name: 'stack_start' },
      { offset: '0x2C', size: '4 bytes', type: 'uint32_t', name: 'stack_size' },
      { offset: '0x30', size: '4 bytes', type: 'int', name: 'argc' },
      { offset: '0x34', size: '4 bytes', type: 'uint32_t', name: 'argv_addr' },
      { offset: '0x38', size: '4 bytes', type: 'char**', name: 'argv_kernel' },
      { offset: '0x3C', size: '4 bytes', type: 'int', name: 'exit_code' },
      { offset: '0x40', size: '64 bytes', type: 'process_return_value_t', name: 'return_val' },
      { offset: '0x80', size: '1 byte', type: 'bool', name: 'return_val_explicit' },
      { offset: '0x81', size: '1 byte', type: 'uint8_t', name: 'is_running' },
      { offset: '0x82', size: '1 byte', type: 'bool', name: 'waiting_for_input' },
      { offset: '0x83', size: '1 byte', type: 'bool', name: 'wants_graphics' },
      { offset: '0x84', size: '4 bytes', type: 'uint32_t', name: 'gfx_overlay_flags' },
      { offset: '0x88', size: '1 byte', type: 'bool', name: 'is_wm_app' },
      { offset: '0x8C', size: '4 bytes', type: 'uint32_t', name: 'async_task_count' },
      { offset: '0x90', size: '4 bytes', type: 'uint32_t', name: 'user_heap_base' },
      { offset: '0x94', size: '4 bytes', type: 'uint32_t', name: 'user_heap_break' },
      { offset: '0x98', size: '4 bytes', type: 'uint32_t', name: 'user_heap_limit' },
      { offset: '0x9C', size: '4 bytes', type: 'int32_t', name: 'user_heap_slot' },
      { offset: '0xA0', size: '128 bytes', type: 'struct ipo_inode', name: 'exec_inode' },
      { offset: '0x120', size: '1 byte', type: 'bool', name: 'demand_loading' },
      { offset: '0x124', size: '4 bytes', type: 'uint32_t', name: 'demand_file_offset' },
      { offset: '0x128', size: '4 bytes', type: 'uint32_t', name: 'demand_mem_offset' },
      { offset: '0x12C', size: '4 bytes', type: 'uint32_t', name: 'demand_loaded_bytes' },
      { offset: '0x130', size: '4 bytes', type: 'uint32_t', name: 'demand_total_bytes' },
      { offset: '0x134', size: '4 bytes', type: 'uint16_t*', name: 'text_vram_backup' },
      { offset: '0x138', size: '4 bytes', type: 'uint8_t*', name: 'gfx_vram_backup' },
      { offset: '0x13C', size: '4 bytes', type: 'uint8_t*', name: 'gfx_palette_backup' },
      { offset: '0x140', size: '2 bytes', type: 'uint16_t', name: 'text_cursor_pos' },
      { offset: '0x142', size: '1 byte', type: 'bool', name: 'text_cursor_visible' },
      { offset: '0x143', size: '1 byte', type: 'bool', name: 'completed_and_acknowledged' },
      { offset: '0x144', size: '4 bytes', type: 'uint16_t*', name: 'scroll_top_buffer' },
      { offset: '0x148', size: '4 bytes', type: 'uint16_t*', name: 'scroll_bottom_buffer' },
      { offset: '0x14C', size: '4 bytes', type: 'int', name: 'scroll_top_count' },
      { offset: '0x150', size: '4 bytes', type: 'int', name: 'scroll_bottom_count' },
      { offset: '0x154', size: '4 bytes', type: 'int', name: 'window_id' },
      { offset: '0x158', size: '1 byte', type: 'bool', name: 'text_screen_shared' },
      { offset: '0x15C', size: '4 bytes', type: 'char*', name: 'text_output_buf' },
      { offset: '0x160', size: '4 bytes', type: 'uint32_t', name: 'text_output_len' },
      { offset: '0x164', size: '4 bytes', type: 'uint32_t', name: 'text_output_cap' },
      { offset: '0x168', size: '4 bytes', type: 'char*', name: 'name' },
      { offset: '0x16C', size: '4 bytes', type: 'char*', name: 'return_format' },
      { offset: '0x170', size: '4 bytes', type: 'struct process*', name: 'next' }
    ]
  },
  {
    id: 'device_node',
    totalSize: '148 bytes (0x94) with dynamic strings & self-expanding BAR array (src/include/kernel/device.h)',
    fields: [
      { offset: '0x00', size: '4 bytes', type: 'uint32_t', name: 'id' },
      { offset: '0x04', size: '4 bytes', type: 'uint32_t', name: 'parent_id' },
      { offset: '0x08', size: '4 bytes', type: 'uint32_t', name: 'capabilities' },
      { offset: '0x0C', size: '4 bytes', type: 'device_type_t', name: 'type' },
      { offset: '0x10', size: '4 bytes', type: 'device_state_t', name: 'state' },
      { offset: '0x14', size: '12 bytes', type: 'char* + len/cap', name: 'name' },
      { offset: '0x20', size: '36 bytes', type: 'char* + len/cap', name: 'vendor / model / description' },
      { offset: '0x44', size: '52 bytes', type: 'device_resources_t', name: 'res' },
      { offset: '0x78', size: '16 bytes', type: 'char* + void*', name: 'driver_name / driver_ptr' },
      { offset: '0x88', size: '12 bytes', type: 'device_ops_t* + next', name: 'ops / priv_data / next' }
    ]
  },
  {
    id: 'kmalloc_stats',
    totalSize: '28 bytes',
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
    totalSize: '8 bytes',
    fields: [
      { offset: '0x00', size: '2 bytes', type: 'uint16_t', name: 'base_lo' },
      { offset: '0x02', size: '2 bytes', type: 'uint16_t', name: 'selector' },
      { offset: '0x04', size: '1 byte', type: 'uint8_t', name: 'zero' },
      { offset: '0x05', size: '1 byte', type: 'uint8_t', name: 'flags' },
      { offset: '0x06', size: '2 bytes', type: 'uint16_t', name: 'base_hi' }
    ]
  },
  {
    id: 'bootrom_post_codes',
    totalSize: '8-bit Diagnostic Port 0x80',
    fields: [
      { offset: '0x10', size: '1 byte', type: 'Progress', name: 'POST_RESET_VECTOR' },
      { offset: '0x11', size: '1 byte', type: 'Progress', name: 'POST_ROM_INIT_ENTRY' },
      { offset: '0x12', size: '1 byte', type: 'Progress', name: 'POST_CAR_START' },
      { offset: '0x13', size: '1 byte', type: 'Progress', name: 'POST_CAR_READY' },
      { offset: '0x15', size: '1 byte', type: 'Progress', name: 'POST_CHIPSET_DETECTED' },
      { offset: '0x16', size: '1 byte', type: 'Progress', name: 'POST_MRC_START' },
      { offset: '0x17', size: '1 byte', type: 'Progress', name: 'POST_DRAM_TEST_PASS' },
      { offset: '0x18', size: '1 byte', type: 'Progress', name: 'POST_CAR_TEARDOWN' },
      { offset: '0x1C', size: '1 byte', type: 'Progress', name: 'POST_PAM_LOCKED' },
      { offset: '0x1D', size: '1 byte', type: 'Progress', name: 'POST_MAGIC_VALID' },
      { offset: '0x1E', size: '1 byte', type: 'Progress', name: 'POST_HANDOVER' },
      { offset: '0x2E', size: '1 byte', type: 'Error', name: 'ERR_NO_MTRR' },
      { offset: '0x3E', size: '1 byte', type: 'Error', name: 'ERR_UNKNOWN_CHIPSET' },
      { offset: '0x4E', size: '1 byte', type: 'Error', name: 'ERR_DRAM_FAIL' },
      { offset: '0x7E', size: '1 byte', type: 'Error', name: 'ERR_MAGIC_MISMATCH' }
    ]
  },
  {
    id: 'firmware_post_codes',
    totalSize: '8-bit Diagnostic Port 0x80',
    fields: [
      { offset: '0x20', size: '1 byte', type: 'Progress', name: 'FW_ENTRY' },
      { offset: '0x21', size: '1 byte', type: 'Progress', name: 'FW_PCI_ENUM_DONE' },
      { offset: '0x22', size: '1 byte', type: 'Progress', name: 'FW_IVT_INSTALLED' },
      { offset: '0x23', size: '1 byte', type: 'Progress', name: 'FW_ACPI_INSTALLED' },
      { offset: '0x24', size: '1 byte', type: 'Progress', name: 'FW_VIDEO_READY' },
      { offset: '0x25', size: '1 byte', type: 'Progress', name: 'FW_A20_ACTIVE' },
      { offset: '0x27', size: '1 byte', type: 'Progress', name: 'FW_PS2_READY' },
      { offset: '0x28', size: '1 byte', type: 'Progress', name: 'FW_STORAGE_PROBE' },
      { offset: '0x30', size: '1 byte', type: 'Progress', name: 'FW_SCAN_BOOTABLE' },
      { offset: '0x31', size: '1 byte', type: 'Progress', name: 'FW_MBR_VALIDATED' },
      { offset: '0xF0', size: '1 byte', type: 'Success', name: 'FW_HANDOVER_OS' },
      { offset: '0xEE', size: '1 byte', type: 'Error', name: 'FW_ERR_NO_BOOT' }
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
    name: 'IPO_SYSCALL_WM_DISPATCH_KEY',
    signature: 'bool wm_dispatch_key(uint8_t scancode)',
  },
  {
    numHex: '0x108A',
    numDec: 4234,
    name: 'IPO_SYSCALL_WM_COMPOSE',
    signature: 'void wm_compose(uint8_t *backbuf)',
  },
  {
    numHex: '0x108B',
    numDec: 4235,
    name: 'IPO_SYSCALL_WM_COMPOSITOR_TICK',
    signature: 'void wm_compositor_tick(void)',
  },
  {
    numHex: '0x108C',
    numDec: 4236,
    name: 'IPO_SYSCALL_WM_SESSION_RUN',
    signature: 'void wm_session_run(void)',
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
    numHex: '0xFFFF',
    numDec: 65535,
    name: 'IPO_SYSCALL_EXIT',
    signature: 'void ipo_exit(int status)',
  }
];
