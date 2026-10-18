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
  descriptionEn: string;
  descriptionRu: string;
}

export interface StructTable {
  id: string;
  titleEn: string;
  titleRu: string;
  totalSize: string;
  fields: StructTableField[];
}

export interface SyscallDoc {
  numHex: string;
  numDec: number;
  name: string;
  signature: string;
  argsEn: string[];
  argsRu: string[];
  returnEn: string;
  returnRu: string;
  descriptionEn: string;
  descriptionRu: string;
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
; Loaded at 0x800000 by process manager
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
run setfont /fonts/terminus.fnt ; startx
`
  },

  'disk-editor-cmds': {
    id: 'disk-editor-cmds',
    lang: 'bash',
    title: 'tools/disk_editor.py Complete Command Reference',
    code: `# Inspect disk image contents (root directory)
python3 tools/disk_editor.py -i build/disk.img ls /

# Copy host compiled executable into IPO_FS /applications folder
python3 tools/disk_editor.py -i build/disk.img put ./build/applications/doom/doom.bin /applications/doom

# Create directory inside filesystem
python3 tools/disk_editor.py -i build/disk.img mkdir /home/user

# Write text file into image
python3 tools/disk_editor.py -i build/disk.img touch /autorun "startx\nrun gl_gears\n"

# View file content
python3 tools/disk_editor.py -i build/disk.img cat /autorun

# Delete file or directory
python3 tools/disk_editor.py -i build/disk.img rm /old_app
`
  },

  'makefile-all-targets': {
    id: 'makefile-all-targets',
    lang: 'bash',
    title: 'Makefile Target Reference (IPO_OS)',
    code: `# Full build, disk/live-image generation, and run in QEMU:
make all

# Incremental module builds:
make lib          # Builds libc.a, libm.a, libstdc++.a, libk.a
make kernel       # Builds kernel.bin + two-pass generate_ksyms.py symbol table
make boot         # Builds boot.bin bootloader (Stage 1 + Stage 2 + E820)
make applications # Compiles user applications in applications/
make toolchain    # Packages in-OS TinyCC (TCC) compiler & headers
make disks        # Formats 128 MB disk.img via OS and loads applications
make live-image   # Builds unified bootable 128 MB Live USB image (IPO_OS.img)
make image        # Builds IPO_OS.img, disks, and unified live-image

# Host TAP networking configuration (exposes all 65535 ports):
make setup-tap

# Launch in QEMU with specific parameters:
make run NET_MODE=tap AUDIODEV=pa
make run NET_MODE=user DRIVE_TYPE=ide

# Cleanups:
make clean
make clean-lib
make clean-applications
make clean-disks
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
    -drive format=raw,file=build/disk.img,if=ide,index=1 \\
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

# 4. Build unified ROM image (default 4MB, or specify FLASH_SIZE)
make FIRMWARE=path/to/firmware.bin FLASH_SIZE=4M

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
    titleEn: 'IPO_FS Superblock Structure (LBA 2048)',
    titleRu: 'Структура суперблока IPO_FS (LBA 2048)',
    totalSize: '64 bytes (Header of 512-byte block)',
    fields: [
      { offset: '0x00', size: '8 bytes', type: 'char[8]', name: 'magic', descriptionEn: 'Magic signature ("IPO_FS\0\0")', descriptionRu: 'Сигнатура файловой системы ("IPO_FS\0\0")' },
      { offset: '0x08', size: '8 bytes', type: 'uint64_t', name: 'fs_size_blocks', descriptionEn: 'Total 512-byte blocks in storage pool', descriptionRu: 'Общее число блоков по 512 байт в пуле' },
      { offset: '0x10', size: '4 bytes', type: 'uint32_t', name: 'block_size', descriptionEn: 'Block size in bytes (always 512)', descriptionRu: 'Размер блока в байтах (всегда 512)' },
      { offset: '0x14', size: '4 bytes', type: 'uint32_t', name: 'flags', descriptionEn: 'Feature flags (Bit 0: Linked Extents)', descriptionRu: 'Флаги возможностей (Бит 0: Связанные экстенты)' },
      { offset: '0x18', size: '8 bytes', type: 'uint64_t', name: 'inode_count', descriptionEn: 'Total allocated/available inodes', descriptionRu: 'Общее число индексных дескрипторов' },
      { offset: '0x20', size: '8 bytes', type: 'uint64_t', name: 'inode_bitmap_start', descriptionEn: 'Starting block of inode allocation bitmap', descriptionRu: 'Начальный блок битовой карты дескрипторов' },
      { offset: '0x28', size: '8 bytes', type: 'uint64_t', name: 'block_bitmap_start', descriptionEn: 'Starting block of data block bitmap', descriptionRu: 'Начальный блок битовой карты блоков' },
      { offset: '0x30', size: '8 bytes', type: 'uint64_t', name: 'inode_table_start', descriptionEn: 'Starting block of Inode Table', descriptionRu: 'Начальный блок таблицы Inodes' },
      { offset: '0x38', size: '8 bytes', type: 'uint64_t', name: 'data_blocks_start', descriptionEn: 'Starting block of data blocks pool', descriptionRu: 'Начальный блок пула блоков данных' }
    ]
  },
  {
    id: 'ipo_inode',
    titleEn: 'IPO_FS Inode Structure (128 bytes, 4 per block)',
    titleRu: 'Структура дескриптора IPO_FS Inode (128 байт, 4 на блок)',
    totalSize: '128 bytes',
    fields: [
      { offset: '0x00', size: '4 bytes', type: 'uint32_t', name: 'mode', descriptionEn: 'File type (0x1=Dir, 0x2=File, 0x80000000=Protected)', descriptionRu: 'Тип (0x1=Каталог, 0x2=Файл, 0x80000000=Защищен)' },
      { offset: '0x04', size: '4 bytes', type: 'uint32_t', name: 'links_count', descriptionEn: 'Number of active hard links', descriptionRu: 'Число жестких ссылок на файл' },
      { offset: '0x08', size: '8 bytes', type: 'uint64_t', name: 'size', descriptionEn: 'Exact 64-bit file size in bytes', descriptionRu: 'Точный размер файла в байтах (64 бита)' },
      { offset: '0x10', size: '96 bytes', type: 'struct ipo_extent[4]', name: 'extents', descriptionEn: '4 primary contiguous extent descriptors (24 B each)', descriptionRu: '4 первичных непрерывных экстента (по 24 байта)' },
      { offset: '0x70', size: '8 bytes', type: 'uint64_t', name: 'next_extent_node', descriptionEn: 'Physical block of chained extent node (0 if none)', descriptionRu: 'Блок следующего узла экстентов (0 если нет)' },
      { offset: '0x78', size: '8 bytes', type: 'uint8_t[8]', name: '_pad', descriptionEn: 'Padding to exactly 128 bytes alignment', descriptionRu: 'Выравнивание до ровно 128 байт' }
    ]
  },
  {
    id: 'ipo_extent',
    titleEn: 'IPO_FS Extent Descriptor (24 bytes)',
    titleRu: 'Дескриптор экстента IPO_FS (24 байта)',
    totalSize: '24 bytes',
    fields: [
      { offset: '0x00', size: '8 bytes', type: 'uint64_t', name: 'logical_block', descriptionEn: 'Starting logical block inside file', descriptionRu: 'Начальный логический блок внутри файла' },
      { offset: '0x08', size: '8 bytes', type: 'uint64_t', name: 'physical_block', descriptionEn: 'Starting physical LBA block in storage pool', descriptionRu: 'Начальный физический LBA блок в пуле хранилища' },
      { offset: '0x10', size: '4 bytes', type: 'uint32_t', name: 'block_count', descriptionEn: 'Number of contiguous 512-byte blocks', descriptionRu: 'Число непрерывных 512-байтных блоков' },
      { offset: '0x14', size: '4 bytes', type: 'uint32_t', name: 'flags', descriptionEn: 'Extent feature flags', descriptionRu: 'Флаги экстента' }
    ]
  },
  {
    id: 'storage_pool_raw_sb',
    titleEn: 'Storage Pool Superblock (storage_pool_raw_sb_t, LBA 2030 & 2039)',
    titleRu: 'Суперблок пула хранилища (storage_pool_raw_sb_t, LBA 2030 и 2039)',
    totalSize: '512 bytes (68 B header + flexible members[] + CRC32)',
    fields: [
      { offset: '0x00', size: '4 bytes', type: 'uint32_t', name: 'magic', descriptionEn: 'Pool magic signature (0x504F4F4C "POOL")', descriptionRu: 'Магическая сигнатура пула (0x504F4F4C "POOL")' },
      { offset: '0x04', size: '4 bytes', type: 'uint32_t', name: 'version', descriptionEn: 'Superblock format version (2)', descriptionRu: 'Версия формата суперблока (2)' },
      { offset: '0x08', size: '16 bytes', type: 'uint8_t[16]', name: 'pool_uuid', descriptionEn: '128-bit Storage Pool UUID (e.g. "IPO_STORAGE_POOL")', descriptionRu: '128-битный UUID пула хранилища (например, "IPO_STORAGE_POOL")' },
      { offset: '0x18', size: '16 bytes', type: 'uint8_t[16]', name: 'local_member_uuid', descriptionEn: '128-bit UUID of the local drive member', descriptionRu: '128-битный UUID локального диска-участника' },
      { offset: '0x28', size: '4 bytes', type: 'uint32_t', name: 'member_index', descriptionEn: 'Index of this drive in the spanned pool', descriptionRu: 'Индекс данного диска в объединенном пуле' },
      { offset: '0x2C', size: '4 bytes', type: 'uint32_t', name: 'member_count', descriptionEn: 'Total number of drives in the storage pool', descriptionRu: 'Общее количество дисков в пуле хранилища' },
      { offset: '0x30', size: '8 bytes', type: 'uint64_t', name: 'total_capacity_sectors', descriptionEn: 'Combined capacity across all member drives in sectors', descriptionRu: 'Суммарная ёмкость всех дисков пула в секторах' },
      { offset: '0x38', size: '4 bytes', type: 'uint32_t', name: 'chunk_size_sectors', descriptionEn: 'Allocation chunk granularity (64 sectors = 32 KB)', descriptionRu: 'Размер чанка распределения (64 сектора = 32 КБ)' },
      { offset: '0x3C', size: '4 bytes', type: 'uint32_t', name: 'generation', descriptionEn: 'Monotonic metadata generation counter', descriptionRu: 'Монотонный счетчик поколений метаданных' },
      { offset: '0x40', size: '4 bytes', type: 'uint32_t', name: 'state', descriptionEn: 'Pool state (0=ONLINE, 1=DEGRADED, 2=CORRUPT)', descriptionRu: 'Состояние пула (0=ONLINE, 1=DEGRADED, 2=CORRUPT)' },
      { offset: '0x44', size: 'N × 48 B', type: 'storage_pool_raw_member_t[]', name: 'members', descriptionEn: 'Flexible on-disk array of member descriptors (48 B each)', descriptionRu: 'Гибкий массив дескрипторов дисков-участников (по 48 байт)' },
      { offset: '0x1FC', size: '4 bytes', type: 'uint32_t', name: 'crc32', descriptionEn: 'IEEE 802.3 CRC32 checksum of bytes 0x00..0x1FB', descriptionRu: 'Контрольная сумма CRC32 первых 508 байт сектора' }
    ]
  },
  {
    id: 'storage_raw_disk_tx_entry',
    titleEn: 'Storage Pool WAL Journal Entry (storage_raw_disk_tx_entry_t, LBA 2031–2038)',
    titleRu: 'Запись журнала транзакций WAL (storage_raw_disk_tx_entry_t, LBA 2031–2038)',
    totalSize: '64 bytes (8 entries per 512-byte sector, 64 entries total)',
    fields: [
      { offset: '0x00', size: '4 bytes', type: 'uint32_t', name: 'magic', descriptionEn: 'Journal entry signature (0x54584E4C "TXNL")', descriptionRu: 'Сигнатура записи журнала (0x54584E4C "TXNL")' },
      { offset: '0x04', size: '4 bytes', type: 'uint32_t', name: 'tx_id', descriptionEn: 'Monotonic transaction identifier', descriptionRu: 'Монотонный идентификатор транзакции' },
      { offset: '0x08', size: '2 bytes', type: 'uint16_t', name: 'op', descriptionEn: 'Operation type (0=READ, 1=WRITE, 2=FLUSH, 3=CHECK)', descriptionRu: 'Тип операции (0=READ, 1=WRITE, 2=FLUSH, 3=CHECK)' },
      { offset: '0x0A', size: '2 bytes', type: 'uint16_t', name: 'state', descriptionEn: 'Transaction state (0=INIT, 1=PENDING, 2=COMMITTED, 3=FAILED)', descriptionRu: 'Статус транзакции (0=INIT, 1=PENDING, 2=COMMITTED, 3=FAILED)' },
      { offset: '0x0C', size: '8 bytes', type: 'uint64_t', name: 'lba', descriptionEn: 'Target logical block address in storage pool', descriptionRu: 'Целевой логический сектор LBA в пуле хранилища' },
      { offset: '0x14', size: '4 bytes', type: 'uint32_t', name: 'count', descriptionEn: 'Number of sectors affected by transaction', descriptionRu: 'Количество секторов в транзакции' },
      { offset: '0x18', size: '4 bytes', type: 'uint32_t', name: 'timestamp', descriptionEn: 'System uptime timestamp in milliseconds', descriptionRu: 'Отметка системного времени в миллисекундах' },
      { offset: '0x1C', size: '4 bytes', type: 'uint32_t', name: 'data_crc', descriptionEn: 'CRC32 checksum of the written sector payload', descriptionRu: 'Контрольная сумма CRC32 записанных данных' },
      { offset: '0x20', size: '4 bytes', type: 'uint32_t', name: 'entry_crc', descriptionEn: 'CRC32 checksum of the journal entry header', descriptionRu: 'Контрольная сумма CRC32 заголовка транзакции' },
      { offset: '0x24', size: '28 bytes', type: 'uint8_t[28]', name: 'reserved', descriptionEn: 'On-disk alignment padding (dynamic in storage_disk_tx_entry_t)', descriptionRu: 'Выравнивание на диске до 64 байт (динамическое в памяти)' }
    ]
  },
  {
    id: 'kmod_header',
    titleEn: 'Relocatable Kernel Module Header (kmod_raw_header_t / kmod_header_t)',
    titleRu: 'Заголовок загружаемого модуля ядра (kmod_raw_header_t / kmod_header_t)',
    totalSize: '192 bytes (0xC0 on-disk raw) / Dynamic pointers in RAM',
    fields: [
      { offset: '0x00', size: '4 bytes', type: 'uint32_t', name: 'magic', descriptionEn: 'Module magic signature (0x444D4B49 "IKMD")', descriptionRu: 'Магическая сигнатура модуля (0x444D4B49 "IKMD")' },
      { offset: '0x04', size: '2 bytes', type: 'uint16_t', name: 'abi_version', descriptionEn: 'Kernel Module ABI version (0x0100 = v1.0)', descriptionRu: 'Версия ABI модулей ядра (0x0100 = v1.0)' },
      { offset: '0x06', size: '2 bytes', type: 'uint16_t', name: 'flags', descriptionEn: 'Module flags (BUILTIN, LOADED, ACTIVE)', descriptionRu: 'Флаги модуля (BUILTIN, LOADED, ACTIVE)' },
      { offset: '0x08', size: '32 B / char*', name: 'name', type: 'char[32] / char*', descriptionEn: 'Module identifier (dynamic char* in kmod_header_t)', descriptionRu: 'Имя модуля (динамический char* в памяти)' },
      { offset: '0x28', size: '32 B / char*', name: 'author', type: 'char[32] / char*', descriptionEn: 'Module author string (dynamic char* in kmod_header_t)', descriptionRu: 'Автор модуля (динамический char* в памяти)' },
      { offset: '0x48', size: '16 B / char*', name: 'version', type: 'char[16] / char*', descriptionEn: 'Semantic version string (dynamic char* in kmod_header_t)', descriptionRu: 'Версия модуля (динамический char* в памяти)' },
      { offset: '0x58', size: '64 B / char*', name: 'description', type: 'char[64] / char*', descriptionEn: 'Module description (dynamic char* in kmod_header_t)', descriptionRu: 'Описание модуля (динамический char* в памяти)' },
      { offset: '0x98', size: '4 bytes', type: 'uint32_t', name: 'init_offset', descriptionEn: 'Byte offset of init() entrypoint from .text start', descriptionRu: 'Смещение точки входа init() от начала секции кода' },
      { offset: '0x9C', size: '4 bytes', type: 'uint32_t', name: 'cleanup_offset', descriptionEn: 'Byte offset of cleanup() from .text start', descriptionRu: 'Смещение функции выгрузки cleanup() от начала кода' },
      { offset: '0xA0', size: '12 bytes', type: 'uint32_t[3]', name: 'text/data/bss_size', descriptionEn: 'Sizes of .text, .data, and .bss sections in bytes', descriptionRu: 'Размеры секций .text, .data и .bss в байтах' },
      { offset: '0xAC', size: '8 bytes', type: 'uint32_t[2]', name: 'sym_tab_offset/count', descriptionEn: 'Offset and count of external symbol table entries', descriptionRu: 'Смещение и число записей таблицы внешних символов' },
      { offset: '0xB4', size: '8 bytes', type: 'uint32_t[2]', name: 'reloc_offset/count', descriptionEn: 'Offset and count of ABS32/REL32 relocation records', descriptionRu: 'Смещение и число записей релокаций (ABS32 / REL32)' },
      { offset: '0xBC', size: '4 bytes', type: 'uint32_t', name: 'checksum', descriptionEn: 'CRC32 checksum of the module payload', descriptionRu: 'Контрольная сумма CRC32 полезной нагрузки модуля' }
    ]
  },
  {
    id: 'cpu_info',
    titleEn: 'Per-CPU SMP Descriptor (cpu_info_t)',
    titleRu: 'Дескриптор процессорного ядра SMP (cpu_info_t)',
    totalSize: '24 bytes',
    fields: [
      { offset: '0x00', size: '4 bytes', type: 'uint32_t', name: 'cpu_id', descriptionEn: 'Logical processor core ID (0 = BSP, 1..N = AP)', descriptionRu: 'Логический номер ядра процессора (0 = BSP, 1..N = AP)' },
      { offset: '0x04', size: '4 bytes', type: 'uint32_t', name: 'lapic_id', descriptionEn: 'Hardware Local APIC physical ID', descriptionRu: 'Аппаратный идентификатор Local APIC' },
      { offset: '0x08', size: '1 byte', type: 'bool', name: 'is_bsp', descriptionEn: 'True if Bootstrap Processor (Core 0)', descriptionRu: 'Флаг первичного загрузочного процессора (BSP)' },
      { offset: '0x09', size: '1 byte', type: 'volatile bool', name: 'is_online', descriptionEn: 'Set to true once AP finishes trampoline boot', descriptionRu: 'Флаг готовности ядра после прохождения трамплина 0x8000' },
      { offset: '0x0C', size: '4 bytes', type: 'uint32_t', name: 'stack_base', descriptionEn: 'Allocated 16 KB per-CPU kernel stack base', descriptionRu: 'Базовый адрес индивидуального 16 КБ стека ядра' },
      { offset: '0x10', size: '4 bytes', type: 'uint32_t', name: 'stack_top', descriptionEn: 'Initial ESP top of stack passed to AP trampoline', descriptionRu: 'Вершина стека ESP, передаваемая в трамплин AP' },
      { offset: '0x14', size: '4 bytes', type: 'volatile uint32_t', name: 'ticks', descriptionEn: 'Per-CPU activity & task execution counter', descriptionRu: 'Счетчик активности и выполненных задач ядра' }
    ]
  },
  {
    id: 'process_pcb',
    titleEn: 'Process Descriptor Structure (process_t)',
    titleRu: 'Структура дескриптора процесса (process_t)',
    totalSize: '208 bytes (0xD0)',
    fields: [
      { offset: '0x00', size: '4 bytes', type: 'uint32_t', name: 'pid', descriptionEn: 'Unique process ID (allocated dynamically starting from 1)', descriptionRu: 'Уникальный номер процесса (выделяется динамически от 1)' },
      { offset: '0x04', size: '4 bytes', type: 'void*', name: 'binary_base', descriptionEn: 'Base address of loaded executable image (0x800000)', descriptionRu: 'Базовый адрес загруженного исполняемого образа (0x800000)' },
      { offset: '0x08', size: '4 bytes', type: 'uint32_t', name: 'binary_size', descriptionEn: '4 KB page-aligned binary memory size in bytes', descriptionRu: 'Выровненный по 4 КБ размер образа в памяти (включая .bss)' },
      { offset: '0x0C', size: '4 bytes', type: 'uint32_t', name: 'entry_point', descriptionEn: 'Absolute execution entry point (ELF e_entry or 0x800000)', descriptionRu: 'Абсолютный адрес точки входа (e_entry из ELF или 0x800000)' },
      { offset: '0x10', size: '4 bytes', type: 'void*', name: 'binary_storage', descriptionEn: 'Dedicated backup storage buffer when swapped out', descriptionRu: 'Выделенный буфер хранения образа при свопе в фон' },
      { offset: '0x14', size: '4 bytes', type: 'uint32_t', name: 'data_offset', descriptionEn: 'Offset where writable data/bss begins in image', descriptionRu: 'Смещение начала сегмента данных/bss в бинарнике' },
      { offset: '0x18', size: '4 bytes', type: 'uint32_t', name: 'data_size', descriptionEn: 'Size of writable data/bss segment in bytes', descriptionRu: 'Размер сегмента данных/bss в байтах' },
      { offset: '0x1C', size: '1 byte', type: 'bool', name: 'code_mapped', descriptionEn: 'True if code segment has been loaded into 0x800000', descriptionRu: 'Флаг загрузки сегмента кода по адресу 0x800000' },
      { offset: '0x20', size: '4 bytes', type: 'void*', name: 'stack_base', descriptionEn: 'Allocated process stack buffer', descriptionRu: 'Выделенный буфер стека процесса' },
      { offset: '0x24', size: '4 bytes', type: 'uint32_t', name: 'stack_ptr', descriptionEn: 'Saved ESP stack pointer during multitasking', descriptionRu: 'Сохранённый указатель стека ESP при многозадачности' },
      { offset: '0x28', size: '4 bytes', type: 'uint32_t', name: 'stack_start', descriptionEn: 'Start address of stack region', descriptionRu: 'Начальный адрес области стека' },
      { offset: '0x2C', size: '4 bytes', type: 'uint32_t', name: 'stack_size', descriptionEn: 'Stack capacity in bytes (256 KB initial)', descriptionRu: 'Размер выделенного стека в байтах (256 КБ базово)' },
      { offset: '0x30', size: '4 bytes', type: 'int', name: 'argc', descriptionEn: 'Argument count passed to main()', descriptionRu: 'Количество аргументов командной строки' },
      { offset: '0x34', size: '4 bytes', type: 'uint32_t', name: 'argv_addr', descriptionEn: 'Address of argv pointers array in process space', descriptionRu: 'Адрес массива аргументов argv в пространстве процесса' },
      { offset: '0x38', size: '4 bytes', type: 'char**', name: 'argv_kernel', descriptionEn: 'Copy of argv array in kernel space for debugging', descriptionRu: 'Копия массива argv в пространстве ядра' },
      { offset: '0x3C', size: '4 bytes', type: 'int', name: 'exit_code', descriptionEn: 'Termination return code', descriptionRu: 'Код возврата завершившегося процесса' },
      { offset: '0x40', size: '64 bytes', type: 'process_return_value_t', name: 'return_val', descriptionEn: 'Full typed return value (type, int, raw_eax/edx, dynamic strings, struct buffer)', descriptionRu: 'Типизированное возвращаемое значение (тип, int, raw_eax/edx, динамические строки, буфер)' },
      { offset: '0x80', size: '1 byte', type: 'bool', name: 'return_val_explicit', descriptionEn: 'True if process explicitly set custom return value via syscall', descriptionRu: 'Флаг явной установки возвращаемого значения системным вызовом' },
      { offset: '0x81', size: '1 byte', type: 'uint8_t', name: 'is_running', descriptionEn: 'Active execution state flag', descriptionRu: 'Флаг активности процесса (1=выполняется)' },
      { offset: '0x82', size: '1 byte', type: 'bool', name: 'waiting_for_input', descriptionEn: 'Blocked waiting for keyboard / terminal input', descriptionRu: 'Флаг ожидания пользовательского ввода с клавиатуры' },
      { offset: '0x83', size: '1 byte', type: 'bool', name: 'wants_graphics', descriptionEn: 'Requested VGA Mode 13h (320x200x256)', descriptionRu: 'Флаг запроса графического режима VGA (Mode 13h)' },
      { offset: '0x84', size: '1 byte', type: 'bool', name: 'is_wm_app', descriptionEn: 'Created a Window Manager desktop window', descriptionRu: 'Процесс зарегистрировал окно в оконном менеджере' },
      { offset: '0x88', size: '4 bytes', type: 'uint32_t', name: 'async_task_count', descriptionEn: 'Count of active background async tasks', descriptionRu: 'Количество активных асинхронных фоновых задач' },
      { offset: '0x8C', size: '4 bytes', type: 'uint32_t', name: 'user_heap_break', descriptionEn: 'Per-process sbrk break address boundary', descriptionRu: 'Граница динамической кучи процесса (sbrk)' },
      { offset: '0x90', size: '4 bytes', type: 'uint16_t*', name: 'text_vram_backup', descriptionEn: '80x25 text mode buffer backup for workspace switching', descriptionRu: 'Резервная копия текстового экрана 80x25 при переключении воркспейсов' },
      { offset: '0x94', size: '4 bytes', type: 'uint8_t*', name: 'gfx_vram_backup', descriptionEn: '320x200 graphics VRAM backup when swapped to background', descriptionRu: 'Резервная копия графического экрана Mode 13h' },
      { offset: '0x98', size: '4 bytes', type: 'uint8_t*', name: 'gfx_palette_backup', descriptionEn: '256-color VGA DAC palette backup (768 bytes)', descriptionRu: 'Резервная копия 256-цветной палитры VGA DAC (768 байт)' },
      { offset: '0x9C', size: '2 bytes', type: 'uint16_t', name: 'text_cursor_pos', descriptionEn: 'Saved cursor coordinate in text mode', descriptionRu: 'Сохранённая позиция курсора в текстовом режиме' },
      { offset: '0x9E', size: '1 byte', type: 'bool', name: 'text_cursor_visible', descriptionEn: 'Saved cursor visibility flag', descriptionRu: 'Флаг видимости текстового курсора' },
      { offset: '0x9F', size: '1 byte', type: 'bool', name: 'completed_and_acknowledged', descriptionEn: 'Process completed and acknowledged by parent', descriptionRu: 'Флаг завершения и подтверждения родителем' },
      { offset: '0xA0', size: '4 bytes', type: 'uint16_t*', name: 'scroll_top_buffer', descriptionEn: 'Workspace top scrollback line buffer', descriptionRu: 'Буфер верхнего скроллбэка воркспейса' },
      { offset: '0xA4', size: '4 bytes', type: 'uint16_t*', name: 'scroll_bottom_buffer', descriptionEn: 'Workspace bottom scrollback line buffer', descriptionRu: 'Буфер нижнего скроллбэка воркспейса' },
      { offset: '0xA8', size: '4 bytes', type: 'int', name: 'scroll_top_count', descriptionEn: 'Count of lines in top scrollback buffer', descriptionRu: 'Число строк в верхнем буфере скролла' },
      { offset: '0xAC', size: '4 bytes', type: 'int', name: 'scroll_bottom_count', descriptionEn: 'Count of lines in bottom scrollback buffer', descriptionRu: 'Число строк в нижнем буфере скролла' },
      { offset: '0xB0', size: '4 bytes', type: 'int', name: 'window_id', descriptionEn: 'Workspace window group identifier in batch mode', descriptionRu: 'Идентификатор окна в оконном менеджере' },
      { offset: '0xB4', size: '1 byte', type: 'bool', name: 'text_screen_shared', descriptionEn: 'True if VRAM buffers are shared with co-process', descriptionRu: 'Флаг совместного использования буфера экрана' },
      { offset: '0xB8', size: '4 bytes', type: 'char*', name: 'text_output_buf', descriptionEn: 'Dynamically expanding captured stdout buffer', descriptionRu: 'Динамический буфер перехваченного текстового вывода' },
      { offset: '0xBC', size: '4 bytes', type: 'uint32_t', name: 'text_output_len', descriptionEn: 'Length of captured stdout text in bytes', descriptionRu: 'Текущая длина перехваченного вывода в байтах' },
      { offset: '0xC0', size: '4 bytes', type: 'uint32_t', name: 'text_output_cap', descriptionEn: 'Allocated capacity of text_output_buf', descriptionRu: 'Выделенная ёмкость буфера text_output_buf' },
      { offset: '0xC4', size: '4 bytes', type: 'char*', name: 'name', descriptionEn: 'Dynamically allocated process name string', descriptionRu: 'Динамически выделенная строка имени процесса' },
      { offset: '0xC8', size: '4 bytes', type: 'char*', name: 'return_format', descriptionEn: 'Auto-detected format descriptor from DWARF debug symbols', descriptionRu: 'Автоматически распознанный дескриптор формата из символов DWARF' },
      { offset: '0xCC', size: '4 bytes', type: 'struct process*', name: 'next', descriptionEn: 'Pointer to next PCB in active kernel list', descriptionRu: 'Указатель на следующий процесс в списке ядра' }
    ]
  },
  {
    id: 'device_node',
    titleEn: 'Unified Hardware Device Node (device_node_t)',
    titleRu: 'Узел единого реестра аппаратных устройств (device_node_t)',
    totalSize: '148 bytes (0x94) with dynamic strings & self-expanding BAR array (src/include/kernel/device.h)',
    fields: [
      { offset: '0x00', size: '4 bytes', type: 'uint32_t', name: 'id', descriptionEn: 'Unique system-wide device ID', descriptionRu: 'Уникальный общесистемный идентификатор устройства' },
      { offset: '0x04', size: '4 bytes', type: 'uint32_t', name: 'parent_id', descriptionEn: 'Parent bus/controller device ID (0 if root)', descriptionRu: 'ID родительской шины/контроллера (0 если корень)' },
      { offset: '0x08', size: '4 bytes', type: 'uint32_t', name: 'capabilities', descriptionEn: 'Capability bitmask (READONLY, REMOVABLE, HOTPLUGGABLE, DMA, VIRTUAL)', descriptionRu: 'Битовая маска возможностей (READONLY, REMOVABLE, HOTPLUG, DMA, VIRTUAL)' },
      { offset: '0x0C', size: '4 bytes', type: 'device_type_t', name: 'type', descriptionEn: 'Category (CPU, MEMORY, PCI, STORAGE, NETWORK, INPUT, AUDIO, VIDEO, SYSTEM, USB)', descriptionRu: 'Категория (CPU, MEMORY, PCI, STORAGE, NETWORK, INPUT, AUDIO, VIDEO, SYSTEM, USB)' },
      { offset: '0x10', size: '4 bytes', type: 'device_state_t', name: 'state', descriptionEn: 'Operational state (DISCOVERED, DRIVER_ATTACHED, INITIALIZED, ACTIVE, DISABLED, ERROR)', descriptionRu: 'Состояние (DISCOVERED, DRIVER_ATTACHED, INITIALIZED, ACTIVE, DISABLED, ERROR)' },
      { offset: '0x14', size: '12 bytes', type: 'char* + len/cap', name: 'name', descriptionEn: 'Dynamic canonical identifier (e.g. "cpu0", "pci00:03.0", "ata0")', descriptionRu: 'Динамический канонический идентификатор ("cpu0", "pci00:03.0", "ata0")' },
      { offset: '0x20', size: '36 bytes', type: 'char* + len/cap', name: 'vendor / model / description', descriptionEn: 'Dynamically allocated vendor, model, and functional description strings', descriptionRu: 'Динамические строки производителя, модели и описания устройства' },
      { offset: '0x44', size: '52 bytes', type: 'device_resources_t', name: 'res', descriptionEn: 'Bus coordinates, PCI IDs, dynamic uint32_t* bar[], I/O base, MMIO base, IRQ, size_bytes', descriptionRu: 'Ресурсы устройства: шина, PCI ID, динамический массив BAR, порты I/O, MMIO, IRQ, объём' },
      { offset: '0x78', size: '16 bytes', type: 'char* + void*', name: 'driver_name / driver_ptr', descriptionEn: 'Attached driver name and pointer to driver_t', descriptionRu: 'Имя привязанного драйвера и указатель на структуру driver_t' },
      { offset: '0x88', size: '12 bytes', type: 'device_ops_t* + next', name: 'ops / priv_data / next', descriptionEn: 'Standard VFS-like device I/O operations (open/close/read/write/ioctl) and list link', descriptionRu: 'Таблица операций ввода-вывода (open/close/read/write/ioctl) и ссылка списка' }
    ]
  },
  {
    id: 'kmalloc_stats',
    titleEn: 'Kernel Heap Allocator Statistics (kmalloc_stats_t)',
    titleRu: 'Статистика кучи ядра (kmalloc_stats_t)',
    totalSize: '28 bytes',
    fields: [
      { offset: '0x00', size: '4 bytes', type: 'size_t', name: 'heap_total', descriptionEn: 'Total kernel heap capacity in bytes (64 MB / 0x04000000)', descriptionRu: 'Полный объём кучи ядра в байтах (64 МБ / 0x04000000)' },
      { offset: '0x04', size: '4 bytes', type: 'size_t', name: 'heap_used', descriptionEn: 'Bytes consumed by high-watermark with headers', descriptionRu: 'Байт занято до текущей границы (включая заголовки)' },
      { offset: '0x08', size: '4 bytes', type: 'size_t', name: 'alloc_bytes', descriptionEn: 'User bytes currently allocated', descriptionRu: 'Полезные байты в активных аллокациях' },
      { offset: '0x0C', size: '4 bytes', type: 'size_t', name: 'free_bytes', descriptionEn: 'Bytes available in free blocks pool', descriptionRu: 'Байты, доступные в освобождённых блоках' },
      { offset: '0x10', size: '4 bytes', type: 'size_t', name: 'alloc_blocks', descriptionEn: 'Count of active allocated blocks', descriptionRu: 'Количество активных занятых блоков' },
      { offset: '0x14', size: '4 bytes', type: 'size_t', name: 'free_blocks', descriptionEn: 'Count of coalesced free blocks', descriptionRu: 'Количество свободных блоков' },
      { offset: '0x18', size: '4 bytes', type: 'size_t', name: 'block_header', descriptionEn: 'Size of boundary-tag header (16 bytes)', descriptionRu: 'Размер заголовка блока (16 байт)' }
    ]
  },
  {
    id: 'ata_device',
    titleEn: 'ATA Storage Device Information (ata_device_t)',
    titleRu: 'Информация об устройстве ATA (ata_device_t)',
    totalSize: '44 bytes (0x2C)',
    fields: [
      { offset: '0x00', size: '1 byte', type: 'uint8_t', name: 'present', descriptionEn: '1 if device detected, 0 if absent', descriptionRu: '1 если устройство обнаружено, 0 если отсутствует' },
      { offset: '0x01', size: '1 byte', type: 'uint8_t', name: 'channel', descriptionEn: 'IDE Channel (0 = Primary, 1 = Secondary)', descriptionRu: 'Канал IDE (0 = Primary, 1 = Secondary)' },
      { offset: '0x02', size: '1 byte', type: 'uint8_t', name: 'drive', descriptionEn: 'Drive position (0 = Master, 1 = Slave)', descriptionRu: 'Позиция накопителя (0 = Master, 1 = Slave)' },
      { offset: '0x04', size: '4 bytes', type: 'ata_device_type_t', name: 'type', descriptionEn: 'Device type (0=NONE, 1=PATA, 2=PATAPI)', descriptionRu: 'Тип устройства (0=NONE, 1=PATA, 2=PATAPI)' },
      { offset: '0x08', size: '2 bytes', type: 'uint16_t', name: 'cylinders', descriptionEn: 'Drive cylinders count from IDENTIFY', descriptionRu: 'Количество цилиндров накопителя из ответа IDENTIFY' },
      { offset: '0x0A', size: '2 bytes', type: 'uint16_t', name: 'heads', descriptionEn: 'Drive heads count from IDENTIFY', descriptionRu: 'Количество магнитных головок из ответа IDENTIFY' },
      { offset: '0x0C', size: '2 bytes', type: 'uint16_t', name: 'sectors', descriptionEn: 'Sectors per track from IDENTIFY', descriptionRu: 'Количество секторов на дорожку из IDENTIFY' },
      { offset: '0x0E', size: '2 bytes', type: 'uint16_t', name: 'io_base', descriptionEn: 'Primary I/O base port (e.g. 0x1F0, 0x170)', descriptionRu: 'Базовый порт ввода-вывода (например, 0x1F0, 0x170)' },
      { offset: '0x10', size: '2 bytes', type: 'uint16_t', name: 'ctrl_base', descriptionEn: 'Control port base (e.g. 0x3F6, 0x376)', descriptionRu: 'Базовый порт управления (например, 0x3F6, 0x376)' },
      { offset: '0x12', size: '1 byte', type: 'uint8_t', name: 'irq', descriptionEn: 'Hardware IRQ line (14 for Primary, 15 for Secondary)', descriptionRu: 'Линия аппаратного прерывания IRQ (14 для Primary, 15 для Secondary)' },
      { offset: '0x14', size: '4 bytes', type: 'uint32_t', name: 'sector_size', descriptionEn: 'Sector size in bytes (typically 512)', descriptionRu: 'Размер сектора в байтах (обычно 512)' },
      { offset: '0x18', size: '8 bytes', type: 'uint64_t', name: 'capacity_sectors', descriptionEn: 'Total capacity in 512-byte sectors (LBA28/LBA48)', descriptionRu: 'Полная ёмкость в секторах по 512 байт (LBA28/LBA48)' },
      { offset: '0x20', size: '4 bytes', type: 'char*', name: 'model', descriptionEn: 'Dynamically allocated NUL-terminated ATA model string', descriptionRu: 'Динамически выделенная ASCII-строка модели накопителя' },
      { offset: '0x24', size: '4 bytes', type: 'char*', name: 'serial', descriptionEn: 'Dynamically allocated NUL-terminated ATA serial string', descriptionRu: 'Динамически выделенная строка серийного номера устройства' },
      { offset: '0x28', size: '4 bytes', type: 'char*', name: 'firmware', descriptionEn: 'Dynamically allocated NUL-terminated ATA firmware revision string', descriptionRu: 'Динамически выделенная строка ревизии прошивки ATA' }
    ]
  },
  {
    id: 'ipo_idt_entry',
    titleEn: 'x86 Interrupt Descriptor Gate (ipo_idt_entry_t)',
    titleRu: 'Дескриптор шлюза прерывания x86 (ipo_idt_entry_t)',
    totalSize: '8 bytes',
    fields: [
      { offset: '0x00', size: '2 bytes', type: 'uint16_t', name: 'base_lo', descriptionEn: 'Lower 16 bits of ISR entrypoint address', descriptionRu: 'Младшие 16 бит адреса точки входа обработчика ISR' },
      { offset: '0x02', size: '2 bytes', type: 'uint16_t', name: 'selector', descriptionEn: 'Kernel code segment selector (0x08)', descriptionRu: 'Селектор сегмента кода ядра (0x08)' },
      { offset: '0x04', size: '1 byte', type: 'uint8_t', name: 'zero', descriptionEn: 'Reserved zero byte', descriptionRu: 'Зарезервированный нулевой байт' },
      { offset: '0x05', size: '1 byte', type: 'uint8_t', name: 'flags', descriptionEn: 'Gate attributes (0x8E=Interrupt, 0xEE=Syscall/User)', descriptionRu: 'Атрибуты шлюза (0x8E=Прерывание, 0xEE=Системный вызов)' },
      { offset: '0x06', size: '2 bytes', type: 'uint16_t', name: 'base_hi', descriptionEn: 'Upper 16 bits of ISR entrypoint address', descriptionRu: 'Старшие 16 бит адреса точки входа обработчика ISR' }
    ]
  },
  {
    id: 'bootrom_post_codes',
    titleEn: 'Port 0x80 POST Diagnostic Codes (IPO_Boot_ROM)',
    titleRu: 'Коды диагностики POST порта 0x80 (IPO_Boot_ROM)',
    totalSize: '8-bit Diagnostic Port 0x80',
    fields: [
      { offset: '0x10', size: '1 byte', type: 'Progress', name: 'POST_RESET_VECTOR', descriptionEn: 'CPU reset vector reached (0xFFFFFFF0)', descriptionRu: 'Достигнут вектор аппаратного сброса (0xFFFFFFF0)' },
      { offset: '0x11', size: '1 byte', type: 'Progress', name: 'POST_ROM_INIT_ENTRY', descriptionEn: 'Entered Boot_ROM init code (0xF000:8000)', descriptionRu: 'Вход в инициализационный код (0xF000:8000)' },
      { offset: '0x12', size: '1 byte', type: 'Progress', name: 'POST_CAR_START', descriptionEn: 'MTRR Cache-as-RAM setup started', descriptionRu: 'Начало настройки Cache-as-RAM через MTRRs' },
      { offset: '0x13', size: '1 byte', type: 'Progress', name: 'POST_CAR_READY', descriptionEn: 'CAR stack operational at 0x7000:8000', descriptionRu: 'Стек CAR готов к работе в 0x7000:8000' },
      { offset: '0x15', size: '1 byte', type: 'Progress', name: 'POST_CHIPSET_DETECTED', descriptionEn: 'Chipset detected (i440FX or Q35)', descriptionRu: 'Чипсет успешно определен (i440FX или Q35)' },
      { offset: '0x16', size: '1 byte', type: 'Progress', name: 'POST_MRC_START', descriptionEn: 'Memory Reference Code DRAM training started', descriptionRu: 'Старт MRC: тренировка контроллера DRAM' },
      { offset: '0x17', size: '1 byte', type: 'Progress', name: 'POST_DRAM_TEST_PASS', descriptionEn: 'DRAM pattern test passed (0x55AA55AA / 0xAA55AA55)', descriptionRu: 'Тест памяти DRAM шаблоном 0x55AA55AA пройден' },
      { offset: '0x18', size: '1 byte', type: 'Progress', name: 'POST_CAR_TEARDOWN', descriptionEn: 'CAR teardown complete, stack relocated to DRAM', descriptionRu: 'Сброс CAR завершен, стек перенесен в DRAM' },
      { offset: '0x1C', size: '1 byte', type: 'Progress', name: 'POST_PAM_LOCKED', descriptionEn: 'PAM locked read-only (RE=1, WE=0)', descriptionRu: 'Регистры PAM заблокированы в режим Read-Only' },
      { offset: '0x1D', size: '1 byte', type: 'Progress', name: 'POST_MAGIC_VALID', descriptionEn: 'Firmware header magic validated (0x464F5049)', descriptionRu: 'Магическая сигнатура прошивки IPOF подтверждена' },
      { offset: '0x1E', size: '1 byte', type: 'Progress', name: 'POST_HANDOVER', descriptionEn: 'Far jump to Firmware payload (0xF000:0004)', descriptionRu: 'Дальний переход на прошивку (0xF000:0004)' },
      { offset: '0x2E', size: '1 byte', type: 'Error', name: 'ERR_NO_MTRR', descriptionEn: 'CPU lacks MTRR support or CAR setup failed', descriptionRu: 'ОШИБКА: процессор без MTRR или сбой CAR' },
      { offset: '0x3E', size: '1 byte', type: 'Error', name: 'ERR_UNKNOWN_CHIPSET', descriptionEn: 'Unsupported PCI Host Bridge ID', descriptionRu: 'ОШИБКА: неизвестный ID чипсета PCI' },
      { offset: '0x4E', size: '1 byte', type: 'Error', name: 'ERR_DRAM_FAIL', descriptionEn: 'DRAM pattern memory test failed', descriptionRu: 'ОШИБКА: сбой проверки битовых ячеек DRAM' },
      { offset: '0x7E', size: '1 byte', type: 'Error', name: 'ERR_MAGIC_MISMATCH', descriptionEn: 'Firmware signature mismatch (IPOF expected)', descriptionRu: 'ОШИБКА: не найдена сигнатура IPOF' }
    ]
  },
  {
    id: 'firmware_post_codes',
    titleEn: 'Port 0x80 POST Diagnostic Codes (IPO_Firmware)',
    titleRu: 'Коды диагностики POST порта 0x80 (IPO_Firmware)',
    totalSize: '8-bit Diagnostic Port 0x80',
    fields: [
      { offset: '0x20', size: '1 byte', type: 'Progress', name: 'FW_ENTRY', descriptionEn: 'Firmware entry point reached (0xF000:0004)', descriptionRu: 'Точка входа прошивки достигнута (0xF000:0004)' },
      { offset: '0x21', size: '1 byte', type: 'Progress', name: 'FW_PCI_ENUM_DONE', descriptionEn: 'PCI bus enumeration completed', descriptionRu: 'Сканирование шины PCI успешно завершено' },
      { offset: '0x22', size: '1 byte', type: 'Progress', name: 'FW_IVT_INSTALLED', descriptionEn: 'Real-mode IVT registered (INT 10h–1Ah)', descriptionRu: 'Таблица векторов IVT установлена в память' },
      { offset: '0x23', size: '1 byte', type: 'Progress', name: 'FW_ACPI_INSTALLED', descriptionEn: 'ACPI 1.0 tables installed in EBDA (0x9FC00)', descriptionRu: 'Таблицы ACPI 1.0 сформированы в EBDA' },
      { offset: '0x24', size: '1 byte', type: 'Progress', name: 'FW_VIDEO_READY', descriptionEn: 'Video subsystem initialized (VBIOS or Mode 03h)', descriptionRu: 'Видеоподсистема настроена (VBIOS или Mode 03h)' },
      { offset: '0x25', size: '1 byte', type: 'Progress', name: 'FW_A20_ACTIVE', descriptionEn: 'Fast A20 Gate activated and verified', descriptionRu: 'Вентиль Fast A20 открыт и проверен' },
      { offset: '0x27', size: '1 byte', type: 'Progress', name: 'FW_PS2_READY', descriptionEn: '8042 PS/2 controller initialized', descriptionRu: 'Контроллер клавиатуры 8042 настроен' },
      { offset: '0x28', size: '1 byte', type: 'Progress', name: 'FW_STORAGE_PROBE', descriptionEn: 'Storage controllers probing (ATA, AHCI, NVMe, USB)', descriptionRu: 'Инициализация дисковых шин (ATA, AHCI, NVMe, USB)' },
      { offset: '0x30', size: '1 byte', type: 'Progress', name: 'FW_SCAN_BOOTABLE', descriptionEn: 'Scanning drives for bootable media (0x80..0x82)', descriptionRu: 'Поиск загрузочного накопителя (0x80..0x82)' },
      { offset: '0x31', size: '1 byte', type: 'Progress', name: 'FW_MBR_VALIDATED', descriptionEn: 'Valid MBR 0xAA55 loaded at 0x0000:7C00', descriptionRu: 'Сектор MBR с сигнатурой 0xAA55 успешно загружен' },
      { offset: '0xF0', size: '1 byte', type: 'Success', name: 'FW_HANDOVER_OS', descriptionEn: 'Jumping to MBR (0x0000:7C00) — OS Handover', descriptionRu: 'Передача управления ОС (0x0000:7C00)' },
      { offset: '0xEE', size: '1 byte', type: 'Error', name: 'FW_ERR_NO_BOOT', descriptionEn: 'No bootable media found on any controller', descriptionRu: 'ОШИБКА: ни один накопитель не содержит MBR' }
    ]
  }
];

export const sharedSyscallsList: SyscallDoc[] = [
  {
    numHex: '0x0001',
    numDec: 1,
    name: 'IPO_SYSCALL_REGISTER',
    signature: 'int ipo_register_syscall(uint32_t num, ipo_syscall_handler_t handler)',
    argsEn: ['args[0]: Vector index (0x0000..0xFFFF)', 'args[1]: Handler function pointer'],
    argsRu: ['args[0]: Номер вектора (0x0000..0xFFFF)', 'args[1]: Указатель на функцию обработчика'],
    returnEn: '0 on success, negative error code on failure',
    returnRu: '0 при успехе, отрицательный код при ошибке',
    descriptionEn: 'Dynamically registers a custom system call handler into the kernel dispatch table.',
    descriptionRu: 'Динамически регистрирует пользовательский обработчик системного вызова в таблице ядра.'
  },
  {
    numHex: '0x0002',
    numDec: 2,
    name: 'IPO_SYSCALL_CALL',
    signature: 'int ipo_syscall(uint32_t num, uint32_t argc, uint32_t *argv)',
    argsEn: ['args[0]: Target syscall number', 'args[1]: Argument count', 'args[2]: Pointer to uint32_t argv array'],
    argsRu: ['args[0]: Номер системного вызова', 'args[1]: Количество аргументов', 'args[2]: Указатель на массив аргументов uint32_t argv[]'],
    returnEn: 'Return value of dispatched syscall',
    returnRu: 'Значение, возвращенное обработчиком вызова',
    descriptionEn: 'Indirect invocation mechanism to dispatch a syscall through kernel dispatcher.',
    descriptionRu: 'Механизм косвенного вызова системной функции через диспетчер ядра.'
  },
  {
    numHex: '0x1001',
    numDec: 4097,
    name: 'IPO_SYSCALL_PRINT',
    signature: 'int ipo_print(const char *text)',
    argsEn: ['args[0]: Pointer to null-terminated ASCII/UTF-8 string'],
    argsRu: ['args[0]: Указатель на строку с завершающим нулем'],
    returnEn: 'Number of printed characters, or negative error code',
    returnRu: 'Число напечатанных символов или отрицательный код ошибки',
    descriptionEn: 'Outputs text to active VGA console and mirrors to COM1 serial.',
    descriptionRu: 'Печатает нуль-терминированный текст в активную VGA-консоль и дублирует в порт COM1.'
  },
  {
    numHex: '0x1002',
    numDec: 4098,
    name: 'IPO_SYSCALL_WRITE',
    signature: 'int ipo_write(int fd, const void *buf, uint32_t count, uint32_t offset)',
    argsEn: ['args[0]: File descriptor (1=stdout, 2=stderr)', 'args[1]: Buffer pointer', 'args[2]: Byte count', 'args[3]: Byte offset'],
    argsRu: ['args[0]: Файловый дескриптор (1=stdout, 2=stderr)', 'args[1]: Указатель на буфер', 'args[2]: Число байт', 'args[3]: Смещение в байтах'],
    returnEn: 'Bytes written, or negative on failure',
    returnRu: 'Количество записанных байт или отрицательное число при ошибке',
    descriptionEn: 'Writes raw byte stream into an open file descriptor or console.',
    descriptionRu: 'Записывает поток байт в открытый дескриптор или консоль.'
  },
  {
    numHex: '0x1010',
    numDec: 4112,
    name: 'IPO_SYSCALL_FS_CREATE',
    signature: 'int ipo_create(const char *path, uint8_t type)',
    argsEn: ['args[0]: Canonical path string', 'args[1]: Type (0x1=Dir, 0x2=File)'],
    argsRu: ['args[0]: Канонический путь к файлу', 'args[1]: Тип (0x1=Каталог, 0x2=Файл)'],
    returnEn: '0 on success, negative error code otherwise',
    returnRu: '0 при успехе, иначе отрицательный код ошибки',
    descriptionEn: 'Creates a new empty file or directory in IPO_FS.',
    descriptionRu: 'Создает новый файл или директорию в файловой системе IPO_FS.'
  },
  {
    numHex: '0x1011',
    numDec: 4113,
    name: 'IPO_SYSCALL_FS_OPEN',
    signature: 'int ipo_open(const char *path)',
    argsEn: ['args[0]: Path to target file'],
    argsRu: ['args[0]: Путь к целевому файлу'],
    returnEn: 'Allocated file descriptor index (>= 0), or negative on error',
    returnRu: 'Индекс выделенного дескриптора (>= 0) или ошибка (< 0)',
    descriptionEn: 'Opens an existing inode and allocates a process file descriptor.',
    descriptionRu: 'Открывает существующий дескриптор inode и выделяет дескриптор процесса.'
  },
  {
    numHex: '0x1012',
    numDec: 4114,
    name: 'IPO_SYSCALL_FS_READ',
    signature: 'int ipo_read(int fd, void *buf, uint32_t count, uint32_t offset)',
    argsEn: ['args[0]: File descriptor', 'args[1]: Buffer pointer', 'args[2]: Count', 'args[3]: File offset'],
    argsRu: ['args[0]: Дескриптор', 'args[1]: Буфер приемника', 'args[2]: Число байт', 'args[3]: Смещение в файле'],
    returnEn: 'Bytes read into buffer, or negative error',
    returnRu: 'Количество прочитанных байт или отрицательный код ошибки',
    descriptionEn: 'Reads data from storage extents into memory buffer.',
    descriptionRu: 'Считывает данные из экстентов диска в буфер оперативной памяти.'
  },
  {
    numHex: '0x1013',
    numDec: 4115,
    name: 'IPO_SYSCALL_FS_WRITE',
    signature: 'int ipo_write(int fd, const void *buf, uint32_t count, uint32_t offset)',
    argsEn: ['args[0]: File descriptor', 'args[1]: Source buffer pointer', 'args[2]: Byte count', 'args[3]: File offset'],
    argsRu: ['args[0]: Файловый дескриптор', 'args[1]: Указатель на буфер источника', 'args[2]: Число байт', 'args[3]: Смещение в файле'],
    returnEn: 'Bytes written to storage, or negative error code',
    returnRu: 'Количество записанных байт или код ошибки',
    descriptionEn: 'Writes data into file extents, allocating new blocks from bitmap as needed.',
    descriptionRu: 'Записывает данные в экстенты файла, при необходимости выделяя новые блоки из битовой карты.'
  },
  {
    numHex: '0x1014',
    numDec: 4116,
    name: 'IPO_SYSCALL_FS_DELETE',
    signature: 'int ipo_delete(const char *path)',
    argsEn: ['args[0]: Canonical path to file or empty directory'],
    argsRu: ['args[0]: Канонический путь к файлу или пустому каталогу'],
    returnEn: '0 on success, negative error code on failure',
    returnRu: '0 при успехе, отрицательный код ошибки при сбое',
    descriptionEn: 'Deletes file or directory, frees extents in bitmap and clears inode.',
    descriptionRu: 'Удаляет файл или директорию, освобождает экстенты в битовой карте и очищает inode.'
  },
  {
    numHex: '0x1015',
    numDec: 4117,
    name: 'IPO_SYSCALL_FS_STAT',
    signature: 'int ipo_stat(const char *path, struct ipo_inode *st)',
    argsEn: ['args[0]: Path string', 'args[1]: Destination struct ipo_inode pointer'],
    argsRu: ['args[0]: Строка пути', 'args[1]: Указатель на структуру struct ipo_inode'],
    returnEn: '0 on success, negative error code otherwise',
    returnRu: '0 при успехе, иначе отрицательный код ошибки',
    descriptionEn: 'Retrieves metadata of specified path: size, extents, links, protection flags.',
    descriptionRu: 'Возвращает метаданные файла: размер, экстенты, ссылки, флаги защиты.'
  },
  {
    numHex: '0x1016',
    numDec: 4118,
    name: 'IPO_SYSCALL_FS_LIST',
    signature: 'int ipo_list_dir(const char *path, char *buf, int size)',
    argsEn: ['args[0]: Directory path', 'args[1]: Destination buffer pointer', 'args[2]: Buffer capacity in bytes'],
    argsRu: ['args[0]: Путь к каталогу', 'args[1]: Буфер для результата', 'args[2]: Вместимость буфера в байтах'],
    returnEn: 'Number of directory entries, or negative on error',
    returnRu: 'Количество записей каталога или код ошибки',
    descriptionEn: 'Enumerates directory contents into formatted buffer.',
    descriptionRu: 'Перечисляет содержимое каталога в форматированный буфер.'
  },
  {
    numHex: '0x1017',
    numDec: 4119,
    name: 'IPO_SYSCALL_FS_RENAME',
    signature: 'int ipo_rename(const char *src, const char *dst)',
    argsEn: ['args[0]: Source path', 'args[1]: Destination path'],
    argsRu: ['args[0]: Исходный путь', 'args[1]: Новый путь назначения'],
    returnEn: '0 on success, negative on error',
    returnRu: '0 при успехе, код ошибки при сбое',
    descriptionEn: 'Renames or moves a file or directory within IPO_FS.',
    descriptionRu: 'Переименовывает или перемещает файл/каталог в пределах файловой системы IPO_FS.'
  },
  {
    numHex: '0x1018',
    numDec: 4120,
    name: 'IPO_SYSCALL_FS_CLOSE',
    signature: 'int ipo_close(int fd)',
    argsEn: ['args[0]: File descriptor to release'],
    argsRu: ['args[0]: Освобождаемый файловый дескриптор'],
    returnEn: '0 on success, negative error code on failure',
    returnRu: '0 при успехе, отрицательный код при ошибке',
    descriptionEn: 'Closes file descriptor and flushes modified inode metadata.',
    descriptionRu: 'Закрывает дескриптор и сбрасывает метаданные inode на диск.'
  },
  {
    numHex: '0x1019',
    numDec: 4121,
    name: 'IPO_SYSCALL_FS_SEEK',
    signature: 'int ipo_seek(int fd, int32_t offset, int whence)',
    argsEn: ['args[0]: File descriptor', 'args[1]: Byte offset delta', 'args[2]: Whence (0=SEEK_SET, 1=SEEK_CUR, 2=SEEK_END)'],
    argsRu: ['args[0]: Файловый дескриптор', 'args[1]: Дельта смещения', 'args[2]: База (0=SEEK_SET, 1=SEEK_CUR, 2=SEEK_END)'],
    returnEn: 'New absolute byte position, or negative on failure',
    returnRu: 'Новая абсолютная позиция в байтах или код ошибки',
    descriptionEn: 'Modifies file read/write cursor offset.',
    descriptionRu: 'Изменяет текущую позицию курсора чтения/записи файла.'
  },
  {
    numHex: '0x1020',
    numDec: 4128,
    name: 'IPO_SYSCALL_EXEC',
    signature: 'int ipo_exec(const char *path, int argc, char **argv)',
    argsEn: ['args[0]: Path to binary', 'args[1]: Argument count', 'args[2]: Arguments array'],
    argsRu: ['args[0]: Путь к бинарнику', 'args[1]: Количество аргументов', 'args[2]: Массив строк аргументов'],
    returnEn: 'PID of spawned process, or negative on error',
    returnRu: 'PID запущенного процесса или отрицательный код ошибки',
    descriptionEn: 'Loads executable binary at 0x800000 and dispatches new process.',
    descriptionRu: 'Загружает исполняемый файл по адресу 0x800000 и создает процесс.'
  },
  {
    numHex: '0x1021',
    numDec: 4129,
    name: 'IPO_SYSCALL_READ',
    signature: 'int ipo_read_line(char *buf, uint32_t max_len)',
    argsEn: ['args[0]: Destination buffer (or char** if dynamic)', 'args[1]: Maximum length (0 for dynamic alloc)'],
    argsRu: ['args[0]: Буфер приемника (или char** при динамическом выделении)', 'args[1]: Максимальная длина (0 для динамического буфера)'],
    returnEn: 'Length of input string, or negative on error',
    returnRu: 'Длина прочитанной строки или отрицательное число при ошибке',
    descriptionEn: 'Reads a line of user input from active terminal keyboard buffer.',
    descriptionRu: 'Считывает строку пользовательского ввода из буфера клавиатуры текущего терминала.'
  },
  {
    numHex: '0x1022',
    numDec: 4130,
    name: 'IPO_SYSCALL_TERMINAL_INPUT',
    signature: 'int ipo_terminal_input(const char *text, int auto_execute)',
    argsEn: ['args[0]: Text string', 'args[1]: Flag (1=execute Enter, 0=insert only)'],
    argsRu: ['args[0]: Текстовая строка', 'args[1]: Флаг (1=нажать Enter, 0=только вставить)'],
    returnEn: '0 on success, negative error code on failure',
    returnRu: '0 при успехе, отрицательный код при ошибке',
    descriptionEn: 'Injects keystroke text programmatically into terminal input buffer.',
    descriptionRu: 'Программно вставляет текст команд в буфер ввода терминала.'
  },
  {
    numHex: '0x1023',
    numDec: 4131,
    name: 'IPO_SYSCALL_PROCESS_YIELD',
    signature: 'int ipo_yield(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: '0 on success',
    returnRu: '0 при успехе',
    descriptionEn: 'Yields remainder of current CPU time slice to scheduler.',
    descriptionRu: 'Добровольно отдает остаток кванта времени процессора планировщику.'
  },
  {
    numHex: '0x1024',
    numDec: 4132,
    name: 'IPO_SYSCALL_PROCESS_IS_FOREGROUND',
    signature: 'int ipo_is_foreground(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: '1 if process owns terminal display, 0 if background',
    returnRu: '1 если процесс на переднем плане, 0 если в фоне',
    descriptionEn: 'Checks if calling task is currently running in the active foreground.',
    descriptionRu: 'Проверяет, выполняется ли процесс в активном окне терминала.'
  },
  {
    numHex: '0x1025',
    numDec: 4133,
    name: 'IPO_SYSCALL_GETCWD',
    signature: 'int ipo_getcwd(char *buf, uint32_t size)',
    argsEn: ['args[0]: Destination buffer', 'args[1]: Capacity in bytes'],
    argsRu: ['args[0]: Буфер для строки', 'args[1]: Вместимость в байтах'],
    returnEn: 'String length copied, or negative error code',
    returnRu: 'Длина скопированной строки или код ошибки',
    descriptionEn: 'Gets canonical absolute path of process current working directory.',
    descriptionRu: 'Возвращает канонический абсолютный путь текущей рабочей директории процесса.'
  },
  {
    numHex: '0x1026',
    numDec: 4134,
    name: 'IPO_SYSCALL_CHDIR',
    signature: 'int ipo_chdir(const char *path)',
    argsEn: ['args[0]: Target directory path'],
    argsRu: ['args[0]: Целевой путь каталога'],
    returnEn: '0 on success, negative error code if path invalid',
    returnRu: '0 при успехе, отрицательный код если каталог не существует',
    descriptionEn: 'Changes current working directory of process.',
    descriptionRu: 'Изменяет текущую рабочую директорию процесса.'
  },
  {
    numHex: '0x1027',
    numDec: 4135,
    name: 'IPO_SYSCALL_GET_EXIT_CODE',
    signature: 'int ipo_get_exit_code(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: 'Exit code of last executed program',
    returnRu: 'Код возврата последнего запущенного процесса',
    descriptionEn: 'Returns exit code of last child process for shell piping and scripting.',
    descriptionRu: 'Возвращает код завершения последней программы для конвейеров shell.'
  },
  {
    numHex: '0x1028',
    numDec: 4136,
    name: 'IPO_SYSCALL_PROCESS_IS_BATCH_ACTIVE',
    signature: 'int ipo_is_batch_active(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: '1 if batch pipeline active, 0 otherwise',
    returnRu: '1 если активен batch-конвейер, иначе 0',
    descriptionEn: 'Queries whether multitasking batch mode (run & / &&) is running.',
    descriptionRu: 'Проверяет активность режима пакетного запуска (run & / &&).'
  },
  {
    numHex: '0x1029',
    numDec: 4137,
    name: 'IPO_SYSCALL_SET_RETURN_VALUE',
    signature: 'int ipo_set_return_value(int type, ...)',
    argsEn: ['args[0]: Return type (PROC_RET_INT, PROC_RET_STRING, PROC_RET_STRUCT, PROC_RET_POINTER)', 'args[1]: Value or pointer', 'args[2]: Size or type name (optional)', 'args[3]: Type name (optional)'],
    argsRu: ['args[0]: Тип возврата (PROC_RET_INT, PROC_RET_STRING, PROC_RET_STRUCT, PROC_RET_POINTER)', 'args[1]: Значение или указатель', 'args[2]: Размер или имя типа (опционально)', 'args[3]: Имя типа (опционально)'],
    returnEn: '0 on success, negative error code on failure',
    returnRu: '0 при успехе, отрицательный код ошибки при сбое',
    descriptionEn: 'Sets explicit typed return value for the current process to pass through pipelines.',
    descriptionRu: 'Явно устанавливает типизированное возвращаемое значение текущего процесса для конвейеров.'
  },
  {
    numHex: '0x102A',
    numDec: 4138,
    name: 'IPO_SYSCALL_GET_RETURN_VALUE',
    signature: 'int ipo_get_return_value(char *buf, uint32_t max_len)',
    argsEn: ['args[0]: Output buffer for formatted return string', 'args[1]: Maximum buffer capacity'],
    argsRu: ['args[0]: Буфер для отформатированной строки возврата', 'args[1]: Максимальная ёмкость буфера'],
    returnEn: 'Length of return string on success, negative error code on failure',
    returnRu: 'Длина строки возврата при успехе, отрицательный код ошибки при сбое',
    descriptionEn: 'Retrieves formatted return string of the last finished child process.',
    descriptionRu: 'Получает отформатированную строку возвращаемого значения последнего завершённого процесса.'
  },
  {
    numHex: '0x1030',
    numDec: 4144,
    name: 'IPO_SYSCALL_ASYNC_START',
    signature: 'int ipo_async_start(const char *task_name, uint32_t interval_ms, void (*task_fn)(void))',
    argsEn: ['args[0]: Task name', 'args[1]: Execution interval in milliseconds (0 selects the default interval)', 'args[2]: Function entry pointer'],
    argsRu: ['args[0]: Имя задачи', 'args[1]: Интервал выполнения в миллисекундах (0 выбирает значение по умолчанию)', 'args[2]: Указатель на функцию задачи'],
    returnEn: 'Task ID handle (>= 0), or negative on failure',
    returnRu: 'Идентификатор задачи (>= 0) или код ошибки',
    descriptionEn: 'Registers a recurring kernel task with a caller-selected name and interval.',
    descriptionRu: 'Регистрирует периодическую задачу ядра с именем и интервалом, заданными вызывающей стороной.'
  },
  {
    numHex: '0x1031',
    numDec: 4145,
    name: 'IPO_SYSCALL_ASYNC_STOP',
    signature: 'int ipo_async_stop(int task_id)',
    argsEn: ['args[0]: Task ID handle'],
    argsRu: ['args[0]: Идентификатор задачи'],
    returnEn: '0 on success, negative error code otherwise',
    returnRu: '0 при успехе, иначе код ошибки',
    descriptionEn: 'Stops and unregisters background async task.',
    descriptionRu: 'Останавливает и удаляет фоновую асинхронную задачу.'
  },
  {
    numHex: '0x1040',
    numDec: 4160,
    name: 'IPO_SYSCALL_STACK_GROW',
    signature: 'int ipo_stack_grow(uint32_t bytes)',
    argsEn: ['args[0]: Byte count to expand process stack limit'],
    argsRu: ['args[0]: Число байт для расширения границы стека'],
    returnEn: '0 on success, negative on out of memory',
    returnRu: '0 при успехе, отрицательный код при нехватке памяти',
    descriptionEn: 'Dynamically expands process stack allocation limit.',
    descriptionRu: 'Динамически расширяет границу выделения стека процесса.'
  },
  {
    numHex: '0x1041',
    numDec: 4161,
    name: 'IPO_SYSCALL_STACK_SHRINK',
    signature: 'int ipo_stack_shrink(uint32_t bytes)',
    argsEn: ['args[0]: Byte count to reduce stack limit'],
    argsRu: ['args[0]: Число байт для уменьшения границы стека'],
    returnEn: '0 on success, negative on error',
    returnRu: '0 при успехе, код ошибки при сбое',
    descriptionEn: 'Reclaims unused process stack memory.',
    descriptionRu: 'Возвращает неиспользуемую память стека процессу.'
  },
  {
    numHex: '0x1042',
    numDec: 4162,
    name: 'IPO_SYSCALL_VAR_SET',
    signature: 'int ipo_var_set(const char *name, const void *val, uint32_t sz)',
    argsEn: ['args[0]: Variable name', 'args[1]: Value pointer', 'args[2]: Value size in bytes'],
    argsRu: ['args[0]: Имя переменной', 'args[1]: Указатель на значение', 'args[2]: Размер значения в байтах'],
    returnEn: '0 on success, negative on error',
    returnRu: '0 при успехе, код ошибки при сбое',
    descriptionEn: 'Sets or creates persistent shared kernel system variable.',
    descriptionRu: 'Создает или обновляет разделяемую системную переменную в памяти ядра.'
  },
  {
    numHex: '0x1043',
    numDec: 4163,
    name: 'IPO_SYSCALL_VAR_GET',
    signature: 'int ipo_var_get(const char *name, void *buf, uint32_t sz)',
    argsEn: ['args[0]: Variable name', 'args[1]: Destination buffer', 'args[2]: Buffer capacity in bytes'],
    argsRu: ['args[0]: Имя переменной', 'args[1]: Буфер приемника', 'args[2]: Вместимость буфера в байтах'],
    returnEn: 'Bytes copied, or negative if variable not found',
    returnRu: 'Скопировано байт или отрицательный код (переменная не найдена)',
    descriptionEn: 'Retrieves value of named shared kernel variable.',
    descriptionRu: 'Считывает значение разделяемой системной переменной.'
  },
  {
    numHex: '0x1044',
    numDec: 4164,
    name: 'IPO_SYSCALL_VAR_DELETE',
    signature: 'int ipo_var_delete(const char *name)',
    argsEn: ['args[0]: Variable name string'],
    argsRu: ['args[0]: Имя переменной'],
    returnEn: '0 on success, negative on error',
    returnRu: '0 при успехе, код ошибки при сбое',
    descriptionEn: 'Deletes shared system variable and reclaims memory.',
    descriptionRu: 'Удаляет разделяемую переменную и освобождает память.'
  },
  {
    numHex: '0x1045',
    numDec: 4165,
    name: 'IPO_SYSCALL_SBRK',
    signature: 'void *ipo_sbrk(int32_t increment)',
    argsEn: ['args[0]: Byte increment (+/-) to move heap boundary'],
    argsRu: ['args[0]: Приращение границы кучи в байтах (+/-)'],
    returnEn: 'Previous heap break pointer, or (void*)-1 on out of memory',
    returnRu: 'Предыдущий адрес границы кучи или (void*)-1 при нехватке памяти',
    descriptionEn: 'Adjusts process data segment break for userspace malloc/free.',
    descriptionRu: 'Сдвигает границу сегмента данных процесса для работы malloc/free.'
  },
  {
    numHex: '0x1046',
    numDec: 4166,
    name: 'IPO_SYSCALL_TIME',
    signature: 'uint32_t ipo_time(uint32_t *tloc)',
    argsEn: ['args[0]: Optional pointer to store uptime (or NULL)'],
    argsRu: ['args[0]: Указатель для сохранения времени (или NULL)'],
    returnEn: 'System uptime in seconds',
    returnRu: 'Время работы системы в секундах',
    descriptionEn: 'Returns system uptime in seconds measured from kernel boot.',
    descriptionRu: 'Возвращает системный аптайм в секундах от старта ядра.'
  },
  {
    numHex: '0x1047',
    numDec: 4167,
    name: 'IPO_SYSCALL_FREE',
    signature: 'void ipo_kfree(void *ptr)',
    argsEn: ['args[0]: Buffer pointer to release'],
    argsRu: ['args[0]: Освобождаемый указатель буфера'],
    returnEn: '0 on success',
    returnRu: '0 при успехе',
    descriptionEn: 'Frees kernel-allocated memory buffer returned to userspace.',
    descriptionRu: 'Освобождает буфер ядра, переданный в пространство пользователя.'
  },
  {
    numHex: '0x1048',
    numDec: 4168,
    name: 'IPO_SYSCALL_MILLIS',
    signature: 'uint32_t timer_millis(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: 'System uptime in milliseconds',
    returnRu: 'Время работы системы в миллисекундах',
    descriptionEn: 'Returns millisecond-resolution system uptime.',
    descriptionRu: 'Возвращает время работы системы с точностью до миллисекунд.'
  },
  {
    numHex: '0x1049',
    numDec: 4169,
    name: 'IPO_SYSCALL_ELAPSED_MS',
    signature: 'uint32_t timer_elapsed_ms(uint32_t start_ms)',
    argsEn: ['args[0]: Starting timestamp from timer_millis()'],
    argsRu: ['args[0]: Начальная отметка времени из timer_millis()'],
    returnEn: 'Elapsed milliseconds since start_ms',
    returnRu: 'Число миллисекунд, прошедших с start_ms',
    descriptionEn: 'Returns elapsed time using wrap-safe millisecond arithmetic.',
    descriptionRu: 'Возвращает прошедшее время с учетом переполнения счетчика миллисекунд.'
  },
  {
    numHex: '0x104A',
    numDec: 4170,
    name: 'IPO_SYSCALL_TIMER_AFTER',
    signature: 'int timer_after(uint32_t start_ms, uint32_t delay_ms)',
    argsEn: ['args[0]: Starting timestamp', 'args[1]: Delay in milliseconds'],
    argsRu: ['args[0]: Начальная отметка времени', 'args[1]: Задержка в миллисекундах'],
    returnEn: '1 if delay has elapsed, otherwise 0',
    returnRu: '1, если задержка истекла, иначе 0',
    descriptionEn: 'Checks whether the requested interval elapsed since start_ms.',
    descriptionRu: 'Проверяет, истек ли заданный интервал с момента start_ms.'
  },
  {
    numHex: '0x1050',
    numDec: 4176,
    name: 'IPO_SYSCALL_KEYMAP_SET',
    signature: 'int ipo_keymap_set_with_font(const char *name, const void *entries, uint32_t count, const void *glyphs, uint32_t glyph_count)',
    argsEn: ['args[0]: Name', 'args[1]: Entries array', 'args[2]: Entry count', 'args[3]: Glyphs array', 'args[4]: Glyph count'],
    argsRu: ['args[0]: Имя', 'args[1]: Таблица записей', 'args[2]: Число записей', 'args[3]: Массив глифов', 'args[4]: Число глифов'],
    returnEn: '0 on success, negative on error',
    returnRu: '0 при успехе, код ошибки при сбое',
    descriptionEn: 'Registers dynamic keyboard layout with custom unicode glyphs.',
    descriptionRu: 'Регистрирует раскладку клавиатуры с поддержкой глифов шрифта.'
  },
  {
    numHex: '0x1051',
    numDec: 4177,
    name: 'IPO_SYSCALL_KEYMAP_GET',
    signature: 'int ipo_keymap_get(char *buf, uint32_t max_len)',
    argsEn: ['args[0]: Output buffer pointer', 'args[1]: Buffer capacity'],
    argsRu: ['args[0]: Буфер приемника', 'args[1]: Вместимость буфера'],
    returnEn: 'Name length, or negative on error',
    returnRu: 'Длина имени или отрицательный код',
    descriptionEn: 'Gets identifier of currently active keyboard layout.',
    descriptionRu: 'Возвращает название текущей активной раскладки клавиатуры.'
  },
  {
    numHex: '0x1052',
    numDec: 4178,
    name: 'IPO_SYSCALL_FONT_LOAD',
    signature: 'int ipo_font_load(const char *path)',
    argsEn: ['args[0]: Path to .fnt file (or NULL for default)'],
    argsRu: ['args[0]: Путь к файлу шрифта .fnt (или NULL)'],
    returnEn: '0 on success, negative on error',
    returnRu: '0 при успехе, код ошибки при сбое',
    descriptionEn: 'Loads custom bitmap font into VGA character generator.',
    descriptionRu: 'Загружает растровый шрифт в знакогенератор VGA.'
  },
  {
    numHex: '0x1053',
    numDec: 4179,
    name: 'IPO_SYSCALL_KEYMAP_DISABLE',
    signature: 'int ipo_keymap_disable(const char *name)',
    argsEn: ['args[0]: Keymap name string'],
    argsRu: ['args[0]: Имя раскладки'],
    returnEn: '0 on success, negative on error',
    returnRu: '0 при успехе, код ошибки при сбое',
    descriptionEn: 'Disables keymap from layout switching rotation.',
    descriptionRu: 'Отключает раскладку клавиатуры из ротации переключения.'
  },
  {
    numHex: '0x1054',
    numDec: 4180,
    name: 'IPO_SYSCALL_KEYMAP_ENABLE',
    signature: 'int ipo_keymap_enable(const char *name)',
    argsEn: ['args[0]: Keymap name string'],
    argsRu: ['args[0]: Имя раскладки'],
    returnEn: '0 on success, negative on error',
    returnRu: '0 при успехе, код ошибки при сбое',
    descriptionEn: 'Enables previously disabled layout in switching rotation.',
    descriptionRu: 'Включает отключенную раскладку клавиатуры обратно в ротацию.'
  },
  {
    numHex: '0x1055',
    numDec: 4181,
    name: 'IPO_SYSCALL_KEYMAP_REMOVE',
    signature: 'int ipo_keymap_remove(const char *name)',
    argsEn: ['args[0]: Keymap name string'],
    argsRu: ['args[0]: Имя раскладки'],
    returnEn: '0 on success, negative on error',
    returnRu: '0 при успехе, код ошибки при сбое',
    descriptionEn: 'Removes and unregisters keymap completely from kernel.',
    descriptionRu: 'Полностью удаляет раскладку клавиатуры из ядра.'
  },
  {
    numHex: '0x1056',
    numDec: 4182,
    name: 'IPO_SYSCALL_KEYMAP_TRANSLATE',
    signature: 'int ipo_keymap_translate(uint8_t scancode)',
    argsEn: ['args[0]: Raw PS/2 scancode byte'],
    argsRu: ['args[0]: Байт сканкода PS/2'],
    returnEn: 'Translated character codepoint, or 0 if unmapped',
    returnRu: 'Преобразованный символ или 0',
    descriptionEn: 'Translates hardware scancode via active keymap translation table.',
    descriptionRu: 'Преобразует аппаратный сканкод через таблицу активной раскладки.'
  },
  {
    numHex: '0x1057',
    numDec: 4183,
    name: 'IPO_SYSCALL_KEYMAP_IS_ACTIVE',
    signature: 'int ipo_keymap_is_active(const char *name)',
    argsEn: ['args[0]: Keymap name string'],
    argsRu: ['args[0]: Имя раскладки'],
    returnEn: '1 if active, 0 if inactive, negative on error',
    returnRu: '1 если активна, 0 если не активна, код ошибки (< 0)',
    descriptionEn: 'Checks if specified keymap is currently active.',
    descriptionRu: 'Проверяет, активна ли указанная раскладка в данный момент.'
  },
  {
    numHex: '0x1058',
    numDec: 4184,
    name: 'IPO_SYSCALL_KEYMAP_CYCLE_NEXT',
    signature: 'int ipo_keymap_cycle_next(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: 'Index of new active layout',
    returnRu: 'Индекс новой активной раскладки',
    descriptionEn: 'Cycles to next active keyboard layout and updates VGA language bar.',
    descriptionRu: 'Переключает ввод на следующую раскладку и обновляет языковую панель.'
  },
  {
    numHex: '0x1059',
    numDec: 4185,
    name: 'IPO_SYSCALL_KEYMAP_CYCLE_PREV',
    signature: 'int ipo_keymap_cycle_prev(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: 'Index of new active layout',
    returnRu: 'Индекс новой активной раскладки',
    descriptionEn: 'Cycles to previous active keyboard layout and updates VGA language bar.',
    descriptionRu: 'Переключает ввод на предыдущую раскладку и обновляет языковую панель.'
  },
  {
    numHex: '0x105A',
    numDec: 4186,
    name: 'IPO_SYSCALL_KEYMAP_GET_NAME',
    signature: 'int ipo_keymap_get_name(char *buf, uint32_t len)',
    argsEn: ['args[0]: Output buffer pointer', 'args[1]: Max length'],
    argsRu: ['args[0]: Буфер приемника', 'args[1]: Максимальная длина'],
    returnEn: 'Length of layout label string',
    returnRu: 'Длина строки метки раскладки',
    descriptionEn: 'Gets active layout abbreviation (EN, RU, UA, ZH).',
    descriptionRu: 'Возвращает короткое обозначение активной раскладки (EN, RU, UA, ZH).'
  },
  {
    numHex: '0x105B',
    numDec: 4187,
    name: 'IPO_SYSCALL_FONT_GET_INFO',
    signature: 'int ipo_font_get_info(char *name_buf, uint32_t max_name_len, uint32_t *out_glyph_count)',
    argsEn: ['args[0]: Name buffer', 'args[1]: Max name length', 'args[2]: Output pointer for glyph count'],
    argsRu: ['args[0]: Буфер для имени шрифта', 'args[1]: Макс. длина', 'args[2]: Указатель для числа глифов'],
    returnEn: '0 on success, negative error code otherwise',
    returnRu: '0 при успехе, иначе код ошибки',
    descriptionEn: 'Queries loaded font family name and count of registered glyphs.',
    descriptionRu: 'Запрашивает имя текущей гарнитуры шрифта и число глифов.'
  },
  {
    numHex: '0x105C',
    numDec: 4188,
    name: 'IPO_SYSCALL_VGA_GLYPH',
    signature: 'int ipo_vga_glyph(uint32_t codepoint)',
    argsEn: ['args[0]: Unicode codepoint (e.g. 0x041F)'],
    argsRu: ['args[0]: Кодовая точка Unicode (например, 0x041F)'],
    returnEn: '0 on success, negative if glyph missing',
    returnRu: '0 при успехе, отрицательный код если глиф отсутствует',
    descriptionEn: 'Renders custom unicode glyph to current screen cursor position.',
    descriptionRu: 'Отрисовывает глиф пользовательского шрифта на экран VGA.'
  },
  {
    numHex: '0x105D',
    numDec: 4189,
    name: 'IPO_SYSCALL_VGA_SET_MODE',
    signature: 'int ipo_vga_set_mode(uint32_t mode)',
    argsEn: ['args[0]: Video mode index (0x03=Text, 0x13=VGA 320x200, 0x118=VBE)'],
    argsRu: ['args[0]: Номер видеорежима (0x03=Текст, 0x13=VGA 320x200, 0x118=VBE)'],
    returnEn: '0 on success, negative on error',
    returnRu: '0 при успехе, код ошибки при сбое',
    descriptionEn: 'Switches display video mode and reconfigures DAC / Framebuffer.',
    descriptionRu: 'Переключает видеоадаптер в текстовый или графический режим.'
  },
  {
    numHex: '0x105E',
    numDec: 4190,
    name: 'IPO_SYSCALL_VGA_GET_MODE',
    signature: 'int ipo_vga_get_mode(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: 'Active video mode index (e.g. 0x03, 0x13)',
    returnRu: 'Номер активного видеорежима (0x03, 0x13)',
    descriptionEn: 'Queries currently active video display mode.',
    descriptionRu: 'Возвращает текущий режим работы видеоадаптера.'
  },
  {
    numHex: '0x105F',
    numDec: 4191,
    name: 'IPO_SYSCALL_SYSTEM_INTERRUPT',
    signature: 'int ipo_system_interrupt(uint32_t type, uint32_t arg)',
    argsEn: ['args[0]: Command (1=reboot, 2=shutdown, 3=dump)', 'args[1]: Reason parameter'],
    argsRu: ['args[0]: Команда (1=перезагрузка, 2=выключение, 3=дамп)', 'args[1]: Параметр/причина'],
    returnEn: '0 on success, or does not return',
    returnRu: '0 при успехе, либо не возвращает управление',
    descriptionEn: 'Performs hardware system control: 8042 reboot, ACPI shutdown, crash dump.',
    descriptionRu: 'Выполняет аппаратное управление системой: reboot 8042, ACPI shutdown, дамп паники.'
  },
  {
    numHex: '0x1060',
    numDec: 4192,
    name: 'IPO_SYSCALL_DRIVER_REGISTER',
    signature: 'int ipo_driver_register(void *drv)',
    argsEn: ['args[0]: Pointer to struct ipo_driver descriptor'],
    argsRu: ['args[0]: Указатель на дескриптор драйвера struct ipo_driver'],
    returnEn: 'Registration index (>= 0), or negative on error',
    returnRu: 'Индекс регистрации (>= 0) или отрицательный код',
    descriptionEn: 'Registers runtime device driver and connects its subsystem hooks.',
    descriptionRu: 'Регистрирует динамический драйвер устройства и подключает его к хукам ядра.'
  },
  {
    numHex: '0x1061',
    numDec: 4193,
    name: 'IPO_SYSCALL_DRIVER_UNREGISTER',
    signature: 'int ipo_driver_unregister(const char *name)',
    argsEn: ['args[0]: Driver name string'],
    argsRu: ['args[0]: Имя драйвера'],
    returnEn: '0 on success, negative error code otherwise',
    returnRu: '0 при успехе, иначе код ошибки',
    descriptionEn: 'Detaches hooks and unloads dynamic runtime driver.',
    descriptionRu: 'Отключает хуки и выгружает динамический драйвер из ядра.'
  },
  {
    numHex: '0x1062',
    numDec: 4194,
    name: 'IPO_SYSCALL_DRIVER_LIST',
    signature: 'int ipo_driver_list(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: 'Count of registered drivers',
    returnRu: 'Число зарегистрированных драйверов',
    descriptionEn: 'Lists all registered device drivers and active subsystem hooks.',
    descriptionRu: 'Выводит список зарегистрированных драйверов и активных хуков.'
  },
  {
    numHex: '0x1063',
    numDec: 4195,
    name: 'IPO_SYSCALL_DRIVER_SET_DESC',
    signature: 'int ipo_driver_set_description(const char *name, const char *desc)',
    argsEn: ['args[0]: Driver name', 'args[1]: Description string'],
    argsRu: ['args[0]: Имя драйвера', 'args[1]: Строка описания'],
    returnEn: '0 on success, negative on error',
    returnRu: '0 при успехе, код ошибки при сбое',
    descriptionEn: 'Sets descriptive text metadata for registered driver.',
    descriptionRu: 'Устанавливает текстовое описание для зарегистрированного драйвера.'
  },
  {
    numHex: '0x1064',
    numDec: 4196,
    name: 'IPO_SYSCALL_FS_STATVFS',
    signature: 'int ipo_statvfs(uint32_t out_stats[7])',
    argsEn: ['args[0]: Output array uint32_t[7] (bsize, frsize, blocks, bfree, bavail, files, ffree)'],
    argsRu: ['args[0]: Выходной массив uint32_t[7] (bsize, frsize, blocks, bfree, bavail, files, ffree)'],
    returnEn: '0 on success, non-zero on error',
    returnRu: '0 при успехе, ненулевой код при ошибке',
    descriptionEn: 'Queries mounted IPO_FS storage pool block and inode capacity statistics.',
    descriptionRu: 'Запрашивает статистику свободных/занятых блоков и дескрипторов inode смонтированного пула IPO_FS.'
  },
  {
    numHex: '0x1070',
    numDec: 4208,
    name: 'IPO_SYSCALL_WM_CREATE_WINDOW',
    signature: 'wm_window_t *wm_create_window(const wm_window_options_t *opts)',
    argsEn: ['args[0]: Pointer to wm_window_options_t configuration struct'],
    argsRu: ['args[0]: Указатель на структуру настроек окна wm_window_options_t'],
    returnEn: 'Pointer to allocated wm_window_t, or NULL on error',
    returnRu: 'Указатель на структуру окна wm_window_t или NULL',
    descriptionEn: 'Creates managed desktop window with titlebar, borders, framebuffer and event callbacks.',
    descriptionRu: 'Создает управляемое окно с заголовком, рамкой, буфером пикселей и колбэками событий.'
  },
  {
    numHex: '0x1071',
    numDec: 4209,
    name: 'IPO_SYSCALL_WM_DESTROY_WINDOW',
    signature: 'void wm_destroy_window(wm_window_t *win)',
    argsEn: ['args[0]: Window pointer'],
    argsRu: ['args[0]: Указатель на дескриптор окна'],
    returnEn: '0 on success',
    returnRu: '0 при успехе',
    descriptionEn: 'Closes and destroys window, releasing its framebuffer and compositor nodes.',
    descriptionRu: 'Закрывает и удаляет окно, освобождая его буфер пикселей и узел композитора.'
  },
  {
    numHex: '0x1072',
    numDec: 4210,
    name: 'IPO_SYSCALL_WM_SESSION_START',
    signature: 'void wm_session_start(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: '0 on success',
    returnRu: '0 при успехе',
    descriptionEn: 'Enters VGA Mode 13h, allocates a backbuffer, and starts the compositor session.',
    descriptionRu: 'Переходит в режим 320x200x256, выделяет backbuffer и запускает сессию композитора.'
  },
  {
    numHex: '0x1073',
    numDec: 4211,
    name: 'IPO_SYSCALL_WM_SESSION_STOP',
    signature: 'void wm_session_stop(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: '0 on success',
    returnRu: '0 при успехе',
    descriptionEn: 'Stops WM compositor task, destroys all open windows and restores text mode.',
    descriptionRu: 'Останавливает композитор, уничтожает окна и восстанавливает текстовый режим.'
  },
  {
    numHex: '0x1074',
    numDec: 4212,
    name: 'IPO_SYSCALL_WM_SESSION_ACTIVE',
    signature: 'bool wm_session_active(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: '1 if GUI session active, 0 if in text mode',
    returnRu: '1 если сессия GUI активна, 0 если текстовый режим',
    descriptionEn: 'Checks whether GUI Window Manager desktop session is running.',
    descriptionRu: 'Проверяет, активна ли в данный момент графическая сессия рабочего стола.'
  },
  {
    numHex: '0x1075',
    numDec: 4213,
    name: 'IPO_SYSCALL_WM_GET_COUNT',
    signature: 'int wm_get_window_count(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: 'Total open windows count',
    returnRu: 'Общее количество открытых окон',
    descriptionEn: 'Returns total number of active windows in compositor list.',
    descriptionRu: 'Возвращает общее количество открытых окон в списке композитора.'
  },
  {
    numHex: '0x1076',
    numDec: 4214,
    name: 'IPO_SYSCALL_WM_GET_FOCUSED',
    signature: 'wm_window_t *wm_get_focused(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: 'Pointer to focused window, or NULL',
    returnRu: 'Указатель на окно с активным фокусом или NULL',
    descriptionEn: 'Gets top-level window handle currently possessing user input focus.',
    descriptionRu: 'Возвращает дескриптор окна, обладающего активным фокусом ввода.'
  },
  {
    numHex: '0x1077',
    numDec: 4215,
    name: 'IPO_SYSCALL_WM_SET_FOCUS',
    signature: 'void wm_set_focus(wm_window_t *win)',
    argsEn: ['args[0]: Target window pointer'],
    argsRu: ['args[0]: Указатель на целевое окно'],
    returnEn: '0 on success',
    returnRu: '0 при успехе',
    descriptionEn: 'Raises window to top of z-order and sets input focus.',
    descriptionRu: 'Поднимает окно на вершину Z-order и передает ему фокус ввода.'
  },
  {
    numHex: '0x1078',
    numDec: 4216,
    name: 'IPO_SYSCALL_WM_FOCUS_NEXT',
    signature: 'void wm_focus_next(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: '0 on success',
    returnRu: '0 при успехе',
    descriptionEn: 'Cycles focus forward to next window in z-order (Alt+Tab behavior).',
    descriptionRu: 'Переключает фокус на следующее окно (поведение Alt+Tab).'
  },
  {
    numHex: '0x1079',
    numDec: 4217,
    name: 'IPO_SYSCALL_WM_FOCUS_PREV',
    signature: 'void wm_focus_prev(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: '0 on success',
    returnRu: '0 при успехе',
    descriptionEn: 'Cycles focus backward to previous window in z-order.',
    descriptionRu: 'Переключает фокус на предыдущее окно в списке.'
  },
  {
    numHex: '0x107A',
    numDec: 4218,
    name: 'IPO_SYSCALL_WM_INVALIDATE',
    signature: 'void wm_invalidate(wm_window_t *win)',
    argsEn: ['args[0]: Window pointer (or NULL for all windows)'],
    argsRu: ['args[0]: Указатель на окно (или NULL для всех)'],
    returnEn: '0 on success',
    returnRu: '0 при успехе',
    descriptionEn: 'Marks window dirty, triggering redraw in next compositor frame.',
    descriptionRu: 'Помечает окно измененным для перерисовки в следующем кадре.'
  },
  {
    numHex: '0x107B',
    numDec: 4219,
    name: 'IPO_SYSCALL_WM_IS_VALID',
    signature: 'bool wm_is_window_valid(wm_window_t *win)',
    argsEn: ['args[0]: Window pointer'],
    argsRu: ['args[0]: Указатель на окно'],
    returnEn: '1 if valid and active, 0 otherwise',
    returnRu: '1 если окно существует и валидно, иначе 0',
    descriptionEn: 'Checks whether window handle exists in active compositor list.',
    descriptionRu: 'Проверяет, существует ли указанный дескриптор окна в композиторе.'
  },
  {
    numHex: '0x107C',
    numDec: 4220,
    name: 'IPO_SYSCALL_GETPID',
    signature: 'int ipo_getpid(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: 'Current process ID (PID)',
    returnRu: 'Идентификатор текущего процесса (PID)',
    descriptionEn: 'Returns unique process ID (PID) of calling task.',
    descriptionRu: 'Возвращает уникальный идентификатор (PID) текущего выполняемого процесса.'
  },
  {
    numHex: '0x107D',
    numDec: 4221,
    name: 'IPO_SYSCALL_WM_TOGGLE_MAXIMIZE',
    signature: 'void wm_toggle_maximize(wm_window_t *win)',
    argsEn: ['args[0]: Window pointer'],
    argsRu: ['args[0]: Указатель на окно'],
    returnEn: '0 on success',
    returnRu: '0 при успехе',
    descriptionEn: 'Toggles window between fullscreen maximized and floating geometry.',
    descriptionRu: 'Переключает окно между развернутым на весь экран и оконным режимом.'
  },
  {
    numHex: '0x107E',
    numDec: 4222,
    name: 'IPO_SYSCALL_WM_RESIZE',
    signature: 'bool wm_resize(wm_window_t *win, uint16_t nw, uint16_t nh)',
    argsEn: ['args[0]: Window pointer', 'args[1]: New width', 'args[2]: New height'],
    argsRu: ['args[0]: Указатель на окно', 'args[1]: Новая ширина', 'args[2]: Новая высота'],
    returnEn: '1 on success, 0 on memory allocation failure',
    returnRu: '1 при успехе, 0 при нехватке памяти для буфера',
    descriptionEn: 'Resizes window dimensions and reallocates pixel framebuffer.',
    descriptionRu: 'Изменяет размеры окна и перевыделяет буфер пикселей.'
  },
  {
    numHex: '0x107F',
    numDec: 4223,
    name: 'IPO_SYSCALL_WM_GET_LIST',
    signature: 'wm_window_t *wm_get_window_list(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: 'Pointer to head of active window list',
    returnRu: 'Указатель на начало списка активных окон',
    descriptionEn: 'Returns pointer to head of active window list.',
    descriptionRu: 'Возвращает указатель на начало списка активных окон композитора.'
  },
  {
    numHex: '0x1080',
    numDec: 4224,
    name: 'IPO_SYSCALL_PROCESS_SWITCH_FG',
    signature: 'int ipo_process_switch_fg(uint32_t pid)',
    argsEn: ['args[0]: Target PID'],
    argsRu: ['args[0]: Целевой PID'],
    returnEn: '0 on success, negative if PID not found',
    returnRu: '0 при успехе, отрицательный код если PID не найден',
    descriptionEn: 'Switches foreground terminal screen buffer and focus to specified PID.',
    descriptionRu: 'Переключает передний план консоли и экранный буфер на указанный процесс.'
  },
  {
    numHex: '0x1081',
    numDec: 4225,
    name: 'IPO_SYSCALL_WM_INIT',
    signature: 'void wm_init(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Initializes the window list when it is empty.',
    descriptionRu: 'Инициализирует список окон, если он пуст.'
  },
  {
    numHex: '0x1082',
    numDec: 4226,
    name: 'IPO_SYSCALL_WM_INVALIDATE_ALL',
    signature: 'void wm_invalidate_all(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Marks every window as needing redraw.',
    descriptionRu: 'Помечает все окна для перерисовки.'
  },
  {
    numHex: '0x1083',
    numDec: 4227,
    name: 'IPO_SYSCALL_WM_SET_FULLSCREEN',
    signature: 'void wm_set_fullscreen(wm_window_t *win, bool enable)',
    argsEn: ['args[0]: Window pointer', 'args[1]: Enable fullscreen (non-zero/zero)'],
    argsRu: ['args[0]: Указатель на окно', 'args[1]: Включить полноэкранный режим (не ноль/ноль)'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Enables or disables fullscreen mode for a window.',
    descriptionRu: 'Включает или выключает полноэкранный режим окна.'
  },
  {
    numHex: '0x1084',
    numDec: 4228,
    name: 'IPO_SYSCALL_WM_MINIMIZE',
    signature: 'void wm_minimize(wm_window_t *win)',
    argsEn: ['args[0]: Window pointer'],
    argsRu: ['args[0]: Указатель на окно'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Minimizes a window.',
    descriptionRu: 'Сворачивает окно.'
  },
  {
    numHex: '0x1085',
    numDec: 4229,
    name: 'IPO_SYSCALL_WM_RESTORE',
    signature: 'void wm_restore(wm_window_t *win)',
    argsEn: ['args[0]: Window pointer'],
    argsRu: ['args[0]: Указатель на окно'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Restores a minimized window.',
    descriptionRu: 'Восстанавливает свернутое окно.'
  },
  {
    numHex: '0x1086',
    numDec: 4230,
    name: 'IPO_SYSCALL_WM_MOVE',
    signature: 'void wm_move(wm_window_t *win, int16_t x, int16_t y)',
    argsEn: ['args[0]: Window pointer', 'args[1]: New x coordinate', 'args[2]: New y coordinate'],
    argsRu: ['args[0]: Указатель на окно', 'args[1]: Новая координата x', 'args[2]: Новая координата y'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Moves a window to the specified position.',
    descriptionRu: 'Перемещает окно в указанную позицию.'
  },
  {
    numHex: '0x1087',
    numDec: 4231,
    name: 'IPO_SYSCALL_WM_SET_TITLE',
    signature: 'void wm_set_title(wm_window_t *win, const char *title)',
    argsEn: ['args[0]: Window pointer', 'args[1]: Null-terminated title string'],
    argsRu: ['args[0]: Указатель на окно', 'args[1]: Строка заголовка с завершающим нулем'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Sets a window title.',
    descriptionRu: 'Задает заголовок окна.'
  },
  {
    numHex: '0x1088',
    numDec: 4232,
    name: 'IPO_SYSCALL_WM_SET_SHAPE',
    signature: 'void wm_set_shape(wm_window_t *win, const uint8_t *mask, uint16_t width, uint16_t height)',
    argsEn: ['args[0]: Window pointer', 'args[1]: Shape mask', 'args[2]: Mask width', 'args[3]: Mask height'],
    argsRu: ['args[0]: Указатель на окно', 'args[1]: Маска формы', 'args[2]: Ширина маски', 'args[3]: Высота маски'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Sets the window shape mask and its dimensions.',
    descriptionRu: 'Задает маску формы окна и ее размеры.'
  },
  {
    numHex: '0x1089',
    numDec: 4233,
    name: 'IPO_SYSCALL_WM_DISPATCH_KEY',
    signature: 'bool wm_dispatch_key(uint8_t scancode)',
    argsEn: ['args[0]: Keyboard scancode'],
    argsRu: ['args[0]: Скан-код клавиши'],
    returnEn: '1 if handled, otherwise 0',
    returnRu: '1, если обработан, иначе 0',
    descriptionEn: 'Routes a keyboard scancode through the window manager.',
    descriptionRu: 'Передает скан-код клавиши диспетчеру окон.'
  },
  {
    numHex: '0x108A',
    numDec: 4234,
    name: 'IPO_SYSCALL_WM_COMPOSE',
    signature: 'void wm_compose(uint8_t *backbuf)',
    argsEn: ['args[0]: Destination backbuffer'],
    argsRu: ['args[0]: Целевой буфер кадра'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Composes windows and overlays into the supplied backbuffer.',
    descriptionRu: 'Композитит окна и экранные элементы в переданный буфер.'
  },
  {
    numHex: '0x108B',
    numDec: 4235,
    name: 'IPO_SYSCALL_WM_COMPOSITOR_TICK',
    signature: 'void wm_compositor_tick(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Runs one window compositor update.',
    descriptionRu: 'Выполняет один цикл обновления композитора окон.'
  },
  {
    numHex: '0x108C',
    numDec: 4236,
    name: 'IPO_SYSCALL_WM_SESSION_RUN',
    signature: 'void wm_session_run(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: 'Returns when the session ends',
    returnRu: 'Возвращает управление после завершения сессии',
    descriptionEn: 'Runs the blocking, animated window-manager session.',
    descriptionRu: 'Запускает блокирующую анимированную сессию оконного менеджера.'
  },
  {
    numHex: '0x108D',
    numDec: 4237,
    name: 'IPO_SYSCALL_WM_GET_COUNT_PID',
    signature: 'int wm_get_window_count_for_pid(uint32_t pid)',
    argsEn: ['args[0]: Process ID'],
    argsRu: ['args[0]: Идентификатор процесса'],
    returnEn: 'Number of windows owned by the process',
    returnRu: 'Число окон процесса',
    descriptionEn: 'Returns the number of windows owned by a process.',
    descriptionRu: 'Возвращает число окон, принадлежащих процессу.'
  },
  {
    numHex: '0x108E',
    numDec: 4238,
    name: 'IPO_SYSCALL_WM_HAS_WINDOWS_PID',
    signature: 'bool wm_has_windows_for_pid(uint32_t pid)',
    argsEn: ['args[0]: Process ID'],
    argsRu: ['args[0]: Идентификатор процесса'],
    returnEn: '1 if the process owns windows, otherwise 0',
    returnRu: '1, если у процесса есть окна, иначе 0',
    descriptionEn: 'Checks whether a process owns any windows.',
    descriptionRu: 'Проверяет, есть ли у процесса окна.'
  },
  {
    numHex: '0x108F',
    numDec: 4239,
    name: 'IPO_SYSCALL_WM_FOCUS_PID',
    signature: 'void wm_focus_window_for_pid(uint32_t pid)',
    argsEn: ['args[0]: Process ID'],
    argsRu: ['args[0]: Идентификатор процесса'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Focuses a window owned by the specified process.',
    descriptionRu: 'Передает фокус окну указанного процесса.'
  },
  {
    numHex: '0x1090',
    numDec: 4240,
    name: 'IPO_SYSCALL_NET_DNS_RESOLVE',
    signature: 'bool dns_resolve(const char *hostname, ip4_addr_t *out_ip, uint32_t timeout_ms)',
    argsEn: ['args[0]: Hostname', 'args[1]: Output IPv4 address', 'args[2]: Timeout in milliseconds'],
    argsRu: ['args[0]: Имя узла', 'args[1]: Выходной IPv4-адрес', 'args[2]: Тайм-аут в миллисекундах'],
    returnEn: '1 on success, otherwise 0',
    returnRu: '1 при успехе, иначе 0',
    descriptionEn: 'Resolves a hostname using the configured DNS server.',
    descriptionRu: 'Разрешает имя узла через настроенный DNS-сервер.'
  },
  {
    numHex: '0x1091',
    numDec: 4241,
    name: 'IPO_SYSCALL_NET_ICMP_SEND',
    signature: 'int icmp_send_echo(ip4_addr_t dst_ip, uint16_t id, uint16_t seq, uint8_t ttl, const void *payload, uint16_t len)',
    argsEn: ['args[0]: Destination IPv4 address', 'args[1]: Echo identifier', 'args[2]: Sequence number', 'args[3]: TTL', 'args[4]: Payload', 'args[5]: Payload length'],
    argsRu: ['args[0]: IPv4-адрес назначения', 'args[1]: Идентификатор echo', 'args[2]: Номер последовательности', 'args[3]: TTL', 'args[4]: Данные', 'args[5]: Длина данных'],
    returnEn: 'ICMP send result, or negative on error',
    returnRu: 'Результат отправки ICMP или отрицательное значение при ошибке',
    descriptionEn: 'Sends an ICMP echo request.',
    descriptionRu: 'Отправляет запрос ICMP echo.'
  },
  {
    numHex: '0x1092',
    numDec: 4242,
    name: 'IPO_SYSCALL_NET_ICMP_POLL',
    signature: 'bool icmp_poll_reply(uint16_t id, uint16_t seq, icmp_echo_reply_t *out_reply, uint32_t timeout_ms)',
    argsEn: ['args[0]: Echo identifier', 'args[1]: Sequence number', 'args[2]: Output reply structure', 'args[3]: Timeout in milliseconds'],
    argsRu: ['args[0]: Идентификатор echo', 'args[1]: Номер последовательности', 'args[2]: Структура для ответа', 'args[3]: Тайм-аут в миллисекундах'],
    returnEn: '1 if a matching reply is received, otherwise 0',
    returnRu: '1, если получен подходящий ответ, иначе 0',
    descriptionEn: 'Waits for an ICMP echo reply matching the identifier and sequence.',
    descriptionRu: 'Ожидает ICMP echo-ответ с соответствующими идентификатором и номером.'
  },
  {
    numHex: '0x1093',
    numDec: 4243,
    name: 'IPO_SYSCALL_NET_SOCKET',
    signature: 'int socket(int domain, int type, int protocol)',
    argsEn: ['args[0]: Address family', 'args[1]: Socket type', 'args[2]: Protocol'],
    argsRu: ['args[0]: Семейство адресов', 'args[1]: Тип сокета', 'args[2]: Протокол'],
    returnEn: 'Socket descriptor, or negative on error',
    returnRu: 'Дескриптор сокета или отрицательное значение при ошибке',
    descriptionEn: 'Creates a kernel-managed network socket.',
    descriptionRu: 'Создает сетевой сокет, управляемый ядром.'
  },
  {
    numHex: '0x1094',
    numDec: 4244,
    name: 'IPO_SYSCALL_NET_BIND',
    signature: 'int bind(int sockfd, const struct sockaddr *addr, socklen_t addrlen)',
    argsEn: ['args[0]: Socket descriptor', 'args[1]: Socket address', 'args[2]: Address structure size'],
    argsRu: ['args[0]: Дескриптор сокета', 'args[1]: Сетевой адрес', 'args[2]: Размер структуры адреса'],
    returnEn: '0 on success, negative on error',
    returnRu: '0 при успехе, отрицательное значение при ошибке',
    descriptionEn: 'Assigns a local address to a socket.',
    descriptionRu: 'Назначает локальный адрес сокету.'
  },
  {
    numHex: '0x1095',
    numDec: 4245,
    name: 'IPO_SYSCALL_NET_LISTEN',
    signature: 'int listen(int sockfd, int backlog)',
    argsEn: ['args[0]: Socket descriptor', 'args[1]: Pending connection backlog'],
    argsRu: ['args[0]: Дескриптор сокета', 'args[1]: Очередь ожидающих соединений'],
    returnEn: '0 on success, negative on error',
    returnRu: '0 при успехе, отрицательное значение при ошибке',
    descriptionEn: 'Marks a bound stream socket as listening for connections.',
    descriptionRu: 'Переводит привязанный потоковый сокет в режим ожидания соединений.'
  },
  {
    numHex: '0x1096',
    numDec: 4246,
    name: 'IPO_SYSCALL_NET_ACCEPT',
    signature: 'int accept_timeout(int sockfd, struct sockaddr *addr, socklen_t *addrlen, uint32_t timeout_ms)',
    argsEn: ['args[0]: Listening socket descriptor', 'args[1]: Optional client address output', 'args[2]: Optional address length output', 'args[3]: Timeout in milliseconds (UINT32_MAX waits indefinitely)'],
    argsRu: ['args[0]: Дескриптор слушающего сокета', 'args[1]: Необязательный буфер адреса клиента', 'args[2]: Необязательный размер адреса', 'args[3]: Тайм-аут в миллисекундах (UINT32_MAX — без ограничения)'],
    returnEn: 'Connected socket descriptor, or negative on error/timeout',
    returnRu: 'Дескриптор принятого соединения или отрицательное значение при ошибке/тайм-ауте',
    descriptionEn: 'Accepts an incoming connection, optionally waiting up to timeout_ms.',
    descriptionRu: 'Принимает входящее соединение, ожидая не дольше timeout_ms.'
  },
  {
    numHex: '0x1097',
    numDec: 4247,
    name: 'IPO_SYSCALL_NET_CONNECT',
    signature: 'int connect(int sockfd, const struct sockaddr *addr, socklen_t addrlen)',
    argsEn: ['args[0]: Socket descriptor', 'args[1]: Remote socket address', 'args[2]: Address structure size'],
    argsRu: ['args[0]: Дескриптор сокета', 'args[1]: Удаленный сетевой адрес', 'args[2]: Размер структуры адреса'],
    returnEn: '0 on success, negative on error',
    returnRu: '0 при успехе, отрицательное значение при ошибке',
    descriptionEn: 'Connects a socket to a remote address.',
    descriptionRu: 'Подключает сокет к удаленному адресу.'
  },
  {
    numHex: '0x1098',
    numDec: 4248,
    name: 'IPO_SYSCALL_NET_SEND',
    signature: 'ssize_t send(int sockfd, const void *buf, size_t len, int flags)',
    argsEn: ['args[0]: Socket descriptor', 'args[1]: Data buffer', 'args[2]: Byte length', 'args[3]: Flags'],
    argsRu: ['args[0]: Дескриптор сокета', 'args[1]: Буфер данных', 'args[2]: Длина в байтах', 'args[3]: Флаги'],
    returnEn: 'Number of bytes sent, or negative on error',
    returnRu: 'Число отправленных байт или отрицательное значение при ошибке',
    descriptionEn: 'Sends data through a connected socket.',
    descriptionRu: 'Отправляет данные через подключенный сокет.'
  },
  {
    numHex: '0x1099',
    numDec: 4249,
    name: 'IPO_SYSCALL_NET_RECV',
    signature: 'ssize_t recv(int sockfd, void *buf, size_t len, int flags)',
    argsEn: ['args[0]: Socket descriptor', 'args[1]: Destination buffer', 'args[2]: Buffer capacity in bytes', 'args[3]: Flags'],
    argsRu: ['args[0]: Дескриптор сокета', 'args[1]: Буфер приема', 'args[2]: Размер буфера в байтах', 'args[3]: Флаги'],
    returnEn: 'Number of bytes received, or negative on error',
    returnRu: 'Число принятых байт или отрицательное значение при ошибке',
    descriptionEn: 'Receives data from a connected socket.',
    descriptionRu: 'Принимает данные из подключенного сокета.'
  },
  {
    numHex: '0x109A',
    numDec: 4250,
    name: 'IPO_SYSCALL_NET_CLOSE',
    signature: 'int socket_close(int sockfd)',
    argsEn: ['args[0]: Socket descriptor'],
    argsRu: ['args[0]: Дескриптор сокета'],
    returnEn: '0 on success, negative on error',
    returnRu: '0 при успехе, отрицательное значение при ошибке',
    descriptionEn: 'Closes a socket and releases its kernel resources.',
    descriptionRu: 'Закрывает сокет и освобождает ресурсы ядра.'
  },
  {
    numHex: '0x109B',
    numDec: 4251,
    name: 'IPO_SYSCALL_NET_CONNECT_ENDPOINT',
    signature: 'int connect_endpoint(int sockfd, const char *host_or_ip, uint16_t port)',
    argsEn: ['args[0]: Socket descriptor', 'args[1]: Hostname or IPv4 address string', 'args[2]: Remote port'],
    argsRu: ['args[0]: Дескриптор сокета', 'args[1]: Имя узла или строка IPv4-адреса', 'args[2]: Удаленный порт'],
    returnEn: '0 on success, negative on error',
    returnRu: '0 при успехе, отрицательное значение при ошибке',
    descriptionEn: 'Resolves the endpoint if needed and connects the socket.',
    descriptionRu: 'При необходимости разрешает имя узла и подключает сокет.'
  },
  {
    numHex: '0x109C',
    numDec: 4252,
    name: 'IPO_SYSCALL_NET_POLL',
    signature: 'void net_poll(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Polls the network device and processes pending network work.',
    descriptionRu: 'Опрос сетевого устройства и обработка ожидающих сетевых событий.'
  },
  {
    numHex: '0x109D',
    numDec: 4253,
    name: 'IPO_SYSCALL_NET_GET_INTERFACE',
    signature: 'net_if_t *net_get_interface(void)',
    argsEn: ['args[0]: Output net_if_t structure pointer'],
    argsRu: ['args[0]: Указатель на выходную структуру net_if_t'],
    returnEn: '1 on success, otherwise 0',
    returnRu: '1 при успехе, иначе 0',
    descriptionEn: 'Copies network interface configuration and link state to userspace.',
    descriptionRu: 'Копирует настройки сетевого интерфейса и состояние соединения в приложение.'
  },
  {
    numHex: '0x109E',
    numDec: 4254,
    name: 'IPO_SYSCALL_NET_INIT',
    signature: 'bool net_init(const net_config_t *config)',
    argsEn: ['args[0]: Network capacity configuration'],
    argsRu: ['args[0]: Настройка емкостей сетевых буферов'],
    returnEn: '1 on success, otherwise 0',
    returnRu: '1 при успехе, иначе 0',
    descriptionEn: 'Initializes network subsystems using capacities supplied by the caller.',
    descriptionRu: 'Инициализирует сетевые подсистемы с емкостями, заданными вызывающей стороной.'
  },
  {
    numHex: '0x109F',
    numDec: 4255,
    name: 'IPO_SYSCALL_NET_SET_IP',
    signature: 'void net_set_ip(ip4_addr_t ip, ip4_addr_t netmask, ip4_addr_t gateway, ip4_addr_t dns)',
    argsEn: ['args[0]: IPv4 address', 'args[1]: Netmask', 'args[2]: Gateway', 'args[3]: DNS server'],
    argsRu: ['args[0]: IPv4-адрес', 'args[1]: Маска подсети', 'args[2]: Шлюз', 'args[3]: DNS-сервер'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Updates the network interface IPv4 configuration.',
    descriptionRu: 'Обновляет конфигурацию IPv4 сетевого интерфейса.'
  },
  {
    numHex: '0x10A0',
    numDec: 4256,
    name: 'IPO_SYSCALL_KBD_GET_SCANCODE',
    signature: 'uint8_t ipo_kbd_get_scancode(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: 'Next scancode from queue or 0 if queue empty',
    returnRu: 'Следующий скан-код из очереди или 0 если очередь пуста',
    descriptionEn: 'Pulls next available raw hardware scancode non-blocking.',
    descriptionRu: 'Неблокирующее чтение очередного скан-кода клавиши из очереди.'
  },
  {
    numHex: '0x10A1',
    numDec: 4257,
    name: 'IPO_SYSCALL_KBD_WAIT_SCANCODE',
    signature: 'uint8_t ipo_kbd_wait_scancode(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: 'Scancode of pressed key',
    returnRu: 'Скан-код нажатой клавиши',
    descriptionEn: 'Blocks calling process until a keyboard scancode is received.',
    descriptionRu: 'Блокирует вызывающий процесс до момента нажатия клавиши на клавиатуре.'
  },
  {
    numHex: '0x10A2',
    numDec: 4258,
    name: 'IPO_SYSCALL_KBD_SET_APP_MODE',
    signature: 'void ipo_kbd_set_app_mode(bool enabled)',
    argsEn: ['args[0]: 1 to route input to application queue, 0 for shell'],
    argsRu: ['args[0]: 1 для перенаправления ввода в очередь приложения, 0 для терминала'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Switches keyboard focus between terminal shell and raw application mode.',
    descriptionRu: 'Переключает ввод клавиатуры между терминалом и сырым режимом приложения.'
  },
  {
    numHex: '0x10A3',
    numDec: 4259,
    name: 'IPO_SYSCALL_KBD_FLUSH',
    signature: 'void ipo_kbd_flush(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Flushes all kernel keyboard queues, 8042 hardware buffers, and modifier states.',
    descriptionRu: 'Очищает очереди клавиатуры ядра, аппаратный буфер 8042 и состояния модификаторов.'
  },
  {
    numHex: '0x10A4',
    numDec: 4260,
    name: 'IPO_SYSCALL_KBD_GET_MODIFIERS',
    signature: 'uint32_t ipo_kbd_get_modifiers(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: 'Bitmask of active modifier keys (Shift, Ctrl, Alt, CapsLock, NumLock, ScrollLock)',
    returnRu: 'Битовая маска модификаторов (Shift, Ctrl, Alt, CapsLock, NumLock, ScrollLock)',
    descriptionEn: 'Returns current state bitmask of keyboard modifier keys.',
    descriptionRu: 'Возвращает текущую битовую маску модификаторов клавиатуры.'
  },
  {
    numHex: '0x10A5',
    numDec: 4261,
    name: 'IPO_SYSCALL_KBD_POLL',
    signature: 'void ipo_kbd_poll(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Polls 8042 keyboard controller ports and dispatches pending events.',
    descriptionRu: 'Опрашивает порты контроллера 8042 и диспетчеризирует ожидающие события.'
  },
  {
    numHex: '0x10A6',
    numDec: 4262,
    name: 'IPO_SYSCALL_KBD_GET_KEY_STRING',
    signature: 'int ipo_kbd_get_key_string(uint8_t scancode, char *buf, uint32_t max_len)',
    argsEn: ['args[0]: Scancode', 'args[1]: Output buffer pointer', 'args[2]: Output buffer capacity'],
    argsRu: ['args[0]: Скан-код', 'args[1]: Указатель на буфер вывода', 'args[2]: Ёмкость буфера вывода'],
    returnEn: '1 on copy to buffer, or kernel string pointer if no buffer provided',
    returnRu: '1 при копировании в буфер, либо указатель на строку ядра если буфер не задан',
    descriptionEn: 'Resolves human-readable name string for a hardware scancode (e.g. "Enter", "Space").',
    descriptionRu: 'Возвращает текстовое название клавиши по её скан-коду (например, "Enter", "Space").'
  },
  {
    numHex: '0x10B0',
    numDec: 4272,
    name: 'IPO_SYSCALL_MOUSE_GET_STATE',
    signature: 'void ipo_mouse_get_state(mouse_state_t *state)',
    argsEn: ['args[0]: Pointer to mouse_state_t structure (x, y, buttons, wheel)'],
    argsRu: ['args[0]: Указатель на структуру mouse_state_t (x, y, кнопки, колесо)'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Retrieves current PS/2 mouse coordinates, button click states, and wheel delta.',
    descriptionRu: 'Считывает текущие координаты мыши PS/2, состояние кнопок и дельту колеса.'
  },
  {
    numHex: '0x10C0',
    numDec: 4288,
    name: 'IPO_SYSCALL_VGA_SET_CURSOR',
    signature: 'void ipo_vga_set_cursor(uint16_t pos)',
    argsEn: ['args[0]: Linear text mode cursor offset (row * 80 + col)'],
    argsRu: ['args[0]: Линейное смещение курсора в текстовом режиме (row * 80 + col)'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Sets hardware CRTC text mode cursor position via ports 0x3D4/0x3D5.',
    descriptionRu: 'Устанавливает аппаратную позицию текстового курсора CRTC через порты 0x3D4/0x3D5.'
  },
  {
    numHex: '0x10C1',
    numDec: 4289,
    name: 'IPO_SYSCALL_VGA_GET_CURSOR',
    signature: 'uint16_t ipo_vga_get_cursor(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: 'Current cursor linear offset (row * 80 + col)',
    returnRu: 'Текущее линейное смещение курсора (row * 80 + col)',
    descriptionEn: 'Reads hardware text mode cursor position from CRTC registers.',
    descriptionRu: 'Считывает аппаратную позицию текстового курсора из регистров CRTC.'
  },
  {
    numHex: '0x10C2',
    numDec: 4290,
    name: 'IPO_SYSCALL_VGA_SHOW_CURSOR',
    signature: 'void ipo_vga_show_cursor(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Enables and shows the hardware text mode blinking cursor.',
    descriptionRu: 'Включает и делает видимым аппаратный мигающий текстовый курсор.'
  },
  {
    numHex: '0x10C3',
    numDec: 4291,
    name: 'IPO_SYSCALL_VGA_HIDE_CURSOR',
    signature: 'void ipo_vga_hide_cursor(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Disables and hides the hardware text mode cursor.',
    descriptionRu: 'Отключает и скрывает аппаратный текстовый курсор.'
  },
  {
    numHex: '0x10C4',
    numDec: 4292,
    name: 'IPO_SYSCALL_VGA_SET_PALETTE',
    signature: 'void ipo_vga_set_palette(uint8_t index, uint8_t r, uint8_t g, uint8_t b)',
    argsEn: ['args[0]: Palette index (0..255)', 'args[1]: Red (0..63)', 'args[2]: Green (0..63)', 'args[3]: Blue (0..63)'],
    argsRu: ['args[0]: Индекс палитры (0..255)', 'args[1]: Красный (0..63)', 'args[2]: Зеленый (0..63)', 'args[3]: Синий (0..63)'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Programs 6-bit RGB values into the VGA DAC palette registers (ports 0x3C8/0x3C9).',
    descriptionRu: 'Записывает 6-битные значения RGB в регистры палитры VGA DAC (порты 0x3C8/0x3C9).'
  },
  {
    numHex: '0x10D0',
    numDec: 4304,
    name: 'IPO_SYSCALL_AUDIO_INIT',
    signature: 'bool ipo_audio_init(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: '1 if audio hardware initialized, 0 otherwise',
    returnRu: '1 если аудиокарта инициализирована, иначе 0',
    descriptionEn: 'Initializes the Sound Blaster 16 DSP, DMA Channel 5, and software mixer.',
    descriptionRu: 'Инициализирует DSP Sound Blaster 16, DMA канал 5 и программный аудиомикшер.'
  },
  {
    numHex: '0x10D1',
    numDec: 4305,
    name: 'IPO_SYSCALL_AUDIO_TICK',
    signature: 'void ipo_audio_tick(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Advances audio playback stream mixer and refills DMA buffers.',
    descriptionRu: 'Выполняет шаг микширования аудиопотоков и обновляет буферы DMA.'
  },
  {
    numHex: '0x10D2',
    numDec: 4306,
    name: 'IPO_SYSCALL_AUDIO_STOP_ALL',
    signature: 'void ipo_audio_stop_all(void)',
    argsEn: ['None'],
    argsRu: ['Нет аргументов'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Stops all active audio playback streams and halts Sound Blaster 16 DMA.',
    descriptionRu: 'Останавливает все активные аудиопотоки и выключает DMA Sound Blaster 16.'
  },
  {
    numHex: '0x10D3',
    numDec: 4307,
    name: 'IPO_SYSCALL_AUDIO_STREAM_CREATE',
    signature: 'audio_stream_t *ipo_audio_stream_create(int format, int channels, uint32_t sample_rate, const void *data, size_t size)',
    argsEn: ['args[0]: Format (U8, S16, S24, S32, F32)', 'args[1]: Channels (1=mono, 2=stereo)', 'args[2]: Sample rate (e.g. 22050, 44100)', 'args[3]: Audio sample data pointer', 'args[4]: Size in bytes'],
    argsRu: ['args[0]: Формат (U8, S16, S24, S32, F32)', 'args[1]: Каналы (1=моно, 2=стерео)', 'args[2]: Частота дискретизации (22050, 44100)', 'args[3]: Указатель на аудиоданные', 'args[4]: Размер в байтах'],
    returnEn: 'Pointer to audio_stream_t handle, or NULL on error',
    returnRu: 'Указатель на дескриптор audio_stream_t или NULL при ошибке',
    descriptionEn: 'Creates a static in-memory audio playback stream.',
    descriptionRu: 'Создает статический поток воспроизведения аудио из буфера памяти.'
  },
  {
    numHex: '0x10D4',
    numDec: 4308,
    name: 'IPO_SYSCALL_AUDIO_STREAM_CREATE_RING',
    signature: 'audio_stream_t *ipo_audio_stream_create_ring(int format, int channels, uint32_t sample_rate, const void *data, size_t size, size_t ring_size)',
    argsEn: ['args[0]: Format', 'args[1]: Channels', 'args[2]: Sample rate', 'args[3]: Initial data pointer', 'args[4]: Initial size', 'args[5]: Total ring buffer capacity'],
    argsRu: ['args[0]: Формат', 'args[1]: Каналы', 'args[2]: Частота дискретизации', 'args[3]: Указатель на данные', 'args[4]: Начальный размер', 'args[5]: Ёмкость кольцевого буфера'],
    returnEn: 'Pointer to audio_stream_t handle, or NULL on error',
    returnRu: 'Указатель на дескриптор audio_stream_t или NULL при ошибке',
    descriptionEn: 'Creates a continuous ring-buffered audio stream for dynamic real-time playback.',
    descriptionRu: 'Создает кольцевой буферизованный аудиопоток для динамического онлайн-воспроизведения.'
  },
  {
    numHex: '0x10D5',
    numDec: 4309,
    name: 'IPO_SYSCALL_AUDIO_STREAM_DESTROY',
    signature: 'void ipo_audio_stream_destroy(audio_stream_t *stream)',
    argsEn: ['args[0]: Audio stream handle pointer'],
    argsRu: ['args[0]: Указатель на дескриптор аудиопотока'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Stops playback, unlinks, and frees an audio stream handle.',
    descriptionRu: 'Останавливает воспроизведение, удаляет и освобождает дескриптор аудиопотока.'
  },
  {
    numHex: '0x10D6',
    numDec: 4310,
    name: 'IPO_SYSCALL_AUDIO_STREAM_PLAY',
    signature: 'void ipo_audio_stream_play(audio_stream_t *stream)',
    argsEn: ['args[0]: Audio stream handle pointer'],
    argsRu: ['args[0]: Указатель на дескриптор аудиопотока'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Starts or resumes playback of an audio stream.',
    descriptionRu: 'Запускает или возобновляет воспроизведение аудиопотока.'
  },
  {
    numHex: '0x10D7',
    numDec: 4311,
    name: 'IPO_SYSCALL_AUDIO_STREAM_PAUSE',
    signature: 'void ipo_audio_stream_pause(audio_stream_t *stream)',
    argsEn: ['args[0]: Audio stream handle pointer'],
    argsRu: ['args[0]: Указатель на дескриптор аудиопотока'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Pauses playback of an audio stream preserving current position.',
    descriptionRu: 'Приостанавливает воспроизведение аудиопотока с сохранением позиции.'
  },
  {
    numHex: '0x10D8',
    numDec: 4312,
    name: 'IPO_SYSCALL_AUDIO_STREAM_STOP',
    signature: 'void ipo_audio_stream_stop(audio_stream_t *stream)',
    argsEn: ['args[0]: Audio stream handle pointer'],
    argsRu: ['args[0]: Указатель на дескриптор аудиопотока'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Stops playback and rewinds audio stream position to beginning.',
    descriptionRu: 'Останавливает воспроизведение и сбрасывает позицию на начало.'
  },
  {
    numHex: '0x10D9',
    numDec: 4313,
    name: 'IPO_SYSCALL_AUDIO_STREAM_SEEK',
    signature: 'void ipo_audio_stream_seek(audio_stream_t *stream, double fraction)',
    argsEn: ['args[0]: Audio stream handle pointer', 'args[1]: Pointer to double normalized fraction (0.0 .. 1.0)'],
    argsRu: ['args[0]: Указатель на дескриптор аудиопотока', 'args[1]: Указатель на double относительную позицию (0.0 .. 1.0)'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Seeks playback position within an audio stream.',
    descriptionRu: 'Перемещает позицию воспроизведения внутри аудиопотока.'
  },
  {
    numHex: '0x10DA',
    numDec: 4314,
    name: 'IPO_SYSCALL_AUDIO_STREAM_SET_VOL',
    signature: 'void ipo_audio_stream_set_volume(audio_stream_t *stream, float volume)',
    argsEn: ['args[0]: Audio stream handle pointer', 'args[1]: Pointer to float volume level (0.0 .. 1.0)'],
    argsRu: ['args[0]: Указатель на дескриптор аудиопотока', 'args[1]: Указатель на float уровень громкости (0.0 .. 1.0)'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Adjusts individual playback volume of an audio stream.',
    descriptionRu: 'Регулирует индивидуальную громкость воспроизведения аудиопотока.'
  },
  {
    numHex: '0x10DB',
    numDec: 4315,
    name: 'IPO_SYSCALL_AUDIO_STREAM_PROGRESS',
    signature: 'void ipo_audio_stream_progress(audio_stream_t *stream, double *out_progress)',
    argsEn: ['args[0]: Audio stream handle pointer', 'args[1]: Pointer to double destination for progress (0.0 .. 1.0)'],
    argsRu: ['args[0]: Указатель на дескриптор аудиопотока', 'args[1]: Указатель на double для записи прогресса (0.0 .. 1.0)'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Queries current playback progress of an audio stream.',
    descriptionRu: 'Запрашивает текущий прогресс воспроизведения аудиопотока.'
  },
  {
    numHex: '0x10DC',
    numDec: 4316,
    name: 'IPO_SYSCALL_AUDIO_STREAM_UPDATE',
    signature: 'void ipo_audio_stream_update_buffered(audio_stream_t *stream, size_t new_size, bool loop)',
    argsEn: ['args[0]: Audio stream handle pointer', 'args[1]: New data size in bytes', 'args[2]: Loop flag (1=loop, 0=once)'],
    argsRu: ['args[0]: Указатель на дескриптор аудиопотока', 'args[1]: Новый размер данных в байтах', 'args[2]: Флаг зацикливания (1=зациклить, 0=однократно)'],
    returnEn: '0',
    returnRu: '0',
    descriptionEn: 'Appends or updates buffer data in a streaming ring-buffer.',
    descriptionRu: 'Добавляет или обновляет буферные данные в потоковом кольцевом буфере.'
  },
  {
    numHex: '0xFFFF',
    numDec: 65535,
    name: 'IPO_SYSCALL_EXIT',
    signature: 'void ipo_exit(int status)',
    argsEn: ['args[0]: Process exit code'],
    argsRu: ['args[0]: Код завершения процесса'],
    returnEn: 'Does not return (process context destroyed)',
    returnRu: 'Не возвращает управление (процесс завершается)',
    descriptionEn: 'Terminates calling process, releases memory and switches context.',
    descriptionRu: 'Завершает вызывающий процесс, освобождает ресурсы и переключает поток.'
  }
];

export function getStructTitle(table: StructTable, lang: string): string {
  return (lang === 'ru' || lang === 'uk') ? table.titleRu : table.titleEn;
}

export function getFieldDescription(field: StructTableField, lang: string): string {
  return (lang === 'ru' || lang === 'uk') ? field.descriptionRu : field.descriptionEn;
}

export function getSyscallDescription(syscall: SyscallDoc, lang: string): string {
  return (lang === 'ru' || lang === 'uk') ? syscall.descriptionRu : syscall.descriptionEn;
}

export function getSyscallArgs(syscall: SyscallDoc, lang: string): string[] {
  return (lang === 'ru' || lang === 'uk') ? syscall.argsRu : syscall.argsEn;
}

export function getSyscallReturn(syscall: SyscallDoc, lang: string): string {
  return (lang === 'ru' || lang === 'uk') ? syscall.returnRu : syscall.returnEn;
}
