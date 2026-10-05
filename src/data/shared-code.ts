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

# Run multiple GUI applications concurrently on the same desktop:
run wm_demo && wm_demo2 && wm_fullscreen

# Pipeline: wait for left command and pass return code to right:
run test_sb16 | player sound.raw

# Sequential execution:
run setfont /fonts/terminus.fnt ; startx
`
  },

  'disk-editor-cmds': {
    id: 'disk-editor-cmds',
    lang: 'bash',
    title: 'disk_editor.py Complete Command Reference',
    code: `# Inspect disk image contents (root directory)
python3 disk_editor.py -i build/disk.img ls /

# Copy host compiled executable into IPO_FS /applications folder
python3 disk_editor.py -i build/disk.img put ./build/applications/doom /applications/doom

# Create directory inside filesystem
python3 disk_editor.py -i build/disk.img mkdir /home/user

# Write text file into image
python3 disk_editor.py -i build/disk.img touch /autorun "startx\nrun wm_demo\n"

# View file content
python3 disk_editor.py -i build/disk.img cat /autorun

# Delete file or directory
python3 disk_editor.py -i build/disk.img rm /old_app
`
  },

  'makefile-all-targets': {
    id: 'makefile-all-targets',
    lang: 'bash',
    title: 'Makefile Target Reference (IPO_OS)',
    code: `# Full build and run in QEMU:
make all

# Incremental module builds:
make lib          # Builds libc.a, libm.a, libk.a
make kernel       # Builds kernel.bin (HAL, VFS, Net, Drivers, TinyGL)
make boot         # Builds boot.bin bootloader
make image        # Combines bootloader and kernel into IPO_OS.img
make applications # Compiles user applications in applications/

# Host TAP networking configuration (exposes all 65535 ports):
make setup-tap

# Launch in QEMU with specific parameters:
make run NET_MODE=tap AUDIODEV=pa
make run NET_MODE=user DRIVE_TYPE=ide

# Cleanups:
make clean
make clean-lib
make clean-applications
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
    code: `# Execute standalone Boot ROM with external firmware and IPO_OS disk:
qemu-system-i386 \
    -m 2048 \
    -drive format=raw,file=build/IPO_OS.img,if=ide,index=0 \
    -drive format=raw,file=build/disk.img,if=ide,index=1 \
    -device rtl8139,netdev=net0 \
    -netdev user,id=net0,net=192.168.7.0/24,host=192.168.7.1,dhcpstart=192.168.7.2 \
    -device sb16 \
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

# 4. Build padded 4MB/8MB SPI image
make spi-flash BIOS=path/to/firmware.bin FLASH_SIZE=4M

# 5. Flash physical chip with verification
flashrom -p ch341a_spi -w build/spi_flash.bin
`
  },

  'syscall-c-wrapper': {
    id: 'syscall-c-wrapper',
    lang: 'c',
    title: 'src/userland/libc/sys.c (Syscall Invoker)',
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

    . = ALIGN(4);

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
           -I/path/to/IPO_OS/src/include

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
    id: 'process_pcb',
    titleEn: 'Process Descriptor Structure (process_t)',
    titleRu: 'Структура дескриптора процесса (process_t)',
    totalSize: '132 bytes (core) / 152 bytes (extended)',
    fields: [
      { offset: '0x00', size: '4 bytes', type: 'uint32_t', name: 'pid', descriptionEn: 'Unique process ID (allocated dynamically starting from 1)', descriptionRu: 'Уникальный номер процесса (выделяется динамически от 1)' },
      { offset: '0x04', size: '4 bytes', type: 'void*', name: 'binary_base', descriptionEn: 'Base address of loaded executable image', descriptionRu: 'Базовый адрес загруженного исполняемого образа' },
      { offset: '0x08', size: '4 bytes', type: 'uint32_t', name: 'binary_size', descriptionEn: 'Binary executable size in bytes', descriptionRu: 'Размер исполняемого файла в байтах' },
      { offset: '0x0C', size: '4 bytes', type: 'uint32_t', name: 'entry_point', descriptionEn: 'Absolute execution entry point', descriptionRu: 'Абсолютный адрес точки входа в программу' },
      { offset: '0x10', size: '4 bytes', type: 'void*', name: 'binary_storage', descriptionEn: 'Dedicated backup storage buffer when swapped out', descriptionRu: 'Выделенный буфер хранения образа при свопе в фон' },
      { offset: '0x14', size: '4 bytes', type: 'uint32_t', name: 'data_offset', descriptionEn: 'Offset where writable data/bss begins in image', descriptionRu: 'Смещение начала сегмента данных/bss в бинарнике' },
      { offset: '0x18', size: '4 bytes', type: 'uint32_t', name: 'data_size', descriptionEn: 'Size of writable data/bss segment in bytes', descriptionRu: 'Размер сегмента данных/bss в байтах' },
      { offset: '0x1C', size: '1 byte', type: 'bool', name: 'code_mapped', descriptionEn: 'True if code segment has been loaded into 0x800000', descriptionRu: 'Флаг загрузки сегмента кода по адресу 0x800000' },
      { offset: '0x20', size: '4 bytes', type: 'void*', name: 'stack_base', descriptionEn: 'Allocated process stack buffer', descriptionRu: 'Выделенный буфер стека процесса' },
      { offset: '0x24', size: '4 bytes', type: 'uint32_t', name: 'stack_ptr', descriptionEn: 'Saved ESP stack pointer during multitasking', descriptionRu: 'Сохранённый указатель стека ESP при многозадачности' },
      { offset: '0x28', size: '4 bytes', type: 'uint32_t', name: 'stack_start', descriptionEn: 'High memory start address of stack region', descriptionRu: 'Верхний базовый адрес области стека' },
      { offset: '0x2C', size: '4 bytes', type: 'uint32_t', name: 'stack_size', descriptionEn: 'Stack capacity in bytes', descriptionRu: 'Размер выделенного стека в байтах' },
      { offset: '0x30', size: '4 bytes', type: 'int', name: 'argc', descriptionEn: 'Argument count passed to main()', descriptionRu: 'Количество аргументов командной строки' },
      { offset: '0x34', size: '4 bytes', type: 'uint32_t', name: 'argv_addr', descriptionEn: 'Address of argv pointers array in process space', descriptionRu: 'Адрес массива аргументов argv в пространстве процесса' },
      { offset: '0x38', size: '4 bytes', type: 'char**', name: 'argv_kernel', descriptionEn: 'Copy of argv array in kernel space for debugging', descriptionRu: 'Копия массива argv в пространстве ядра' },
      { offset: '0x3C', size: '4 bytes', type: 'int', name: 'exit_code', descriptionEn: 'Termination return code', descriptionRu: 'Код возврата завершившегося процесса' },
      { offset: '0x40', size: '1 byte', type: 'uint8_t', name: 'is_running', descriptionEn: 'Active execution state flag', descriptionRu: 'Флаг активности процесса (1=выполняется)' },
      { offset: '0x41', size: '1 byte', type: 'bool', name: 'waiting_for_input', descriptionEn: 'Blocked waiting for keyboard / terminal input', descriptionRu: 'Флаг ожидания пользовательского ввода с клавиатуры' },
      { offset: '0x42', size: '1 byte', type: 'bool', name: 'wants_graphics', descriptionEn: 'Requested VGA Mode 13h (320x200x256)', descriptionRu: 'Флаг запроса графического режима VGA (Mode 13h)' },
      { offset: '0x43', size: '1 byte', type: 'bool', name: 'is_wm_app', descriptionEn: 'Created a Window Manager desktop window', descriptionRu: 'Процесс зарегистрировал окно в оконном менеджере' },
      { offset: '0x44', size: '4 bytes', type: 'uint32_t', name: 'async_task_count', descriptionEn: 'Count of active background async tasks', descriptionRu: 'Количество активных асинхронных фоновых задач' },
      { offset: '0x48', size: '4 bytes', type: 'uint32_t', name: 'user_heap_break', descriptionEn: 'Per-process sbrk break address boundary', descriptionRu: 'Граница динамической кучи процесса (sbrk)' },
      { offset: '0x4C', size: '4 bytes', type: 'uint16_t*', name: 'text_vram_backup', descriptionEn: '80x25 text mode buffer backup for workspace switching', descriptionRu: 'Резервная копия текстового экрана 80x25 при переключении воркспейсов' },
      { offset: '0x50', size: '4 bytes', type: 'uint8_t*', name: 'gfx_vram_backup', descriptionEn: '320x200 graphics VRAM backup when swapped to background', descriptionRu: 'Резервная копия графического экрана Mode 13h' },
      { offset: '0x54', size: '2 bytes', type: 'uint16_t', name: 'text_cursor_pos', descriptionEn: 'Saved cursor coordinate in text mode', descriptionRu: 'Сохранённая позиция курсора в текстовом режиме' },
      { offset: '0x56', size: '1 byte', type: 'bool', name: 'text_cursor_visible', descriptionEn: 'Saved cursor visibility flag', descriptionRu: 'Флаг видимости текстового курсора' },
      { offset: '0x57', size: '1 byte', type: 'bool', name: 'completed_and_acknowledged', descriptionEn: 'Process completed and acknowledged by parent', descriptionRu: 'Флаг завершения и подтверждения родителем' },
      { offset: '0x58', size: '4 bytes', type: 'uint16_t*', name: 'scroll_top_buffer', descriptionEn: 'Workspace top scrollback line buffer', descriptionRu: 'Буфер верхнего скроллбэка воркспейса' },
      { offset: '0x5C', size: '4 bytes', type: 'uint16_t*', name: 'scroll_bottom_buffer', descriptionEn: 'Workspace bottom scrollback line buffer', descriptionRu: 'Буфер нижнего скроллбэка воркспейса' },
      { offset: '0x60', size: '4 bytes', type: 'int', name: 'scroll_top_count', descriptionEn: 'Count of lines in top scrollback buffer', descriptionRu: 'Число строк в верхнем буфере скролла' },
      { offset: '0x64', size: '4 bytes', type: 'int', name: 'scroll_bottom_count', descriptionEn: 'Count of lines in bottom scrollback buffer', descriptionRu: 'Число строк в нижнем буфере скролла' },
      { offset: '0x68', size: '4 bytes', type: 'int', name: 'window_id', descriptionEn: 'Workspace window group identifier in batch mode', descriptionRu: 'Идентификатор окна в оконном менеджере' },
      { offset: '0x6C', size: '1 byte', type: 'bool', name: 'text_screen_shared', descriptionEn: 'True if VRAM buffers are shared with co-process', descriptionRu: 'Флаг совместного использования буфера экрана' },
      { offset: '0x7C', size: '4 bytes', type: 'char*', name: 'name', descriptionEn: 'Dynamically allocated process name string', descriptionRu: 'Динамически выделенная строка имени процесса' },
      { offset: '0x80', size: '4 bytes', type: 'struct process*', name: 'next', descriptionEn: 'Pointer to next PCB in active kernel list', descriptionRu: 'Указатель на следующий процесс в списке ядра' }
    ]
  },
  {
    id: 'kmalloc_stats',
    titleEn: 'Kernel Heap Allocator Statistics (kmalloc_stats_t)',
    titleRu: 'Статистика кучи ядра (kmalloc_stats_t)',
    totalSize: '28 bytes',
    fields: [
      { offset: '0x00', size: '4 bytes', type: 'size_t', name: 'heap_total', descriptionEn: 'Total kernel heap capacity in bytes (16 MB)', descriptionRu: 'Полный объём кучи ядра в байтах (16 МБ)' },
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
    totalSize: '88 bytes',
    fields: [
      { offset: '0x00', size: '1 byte', type: 'uint8_t', name: 'present', descriptionEn: '1 if device detected, 0 if absent', descriptionRu: '1 если устройство обнаружено, 0 если отсутствует' },
      { offset: '0x01', size: '1 byte', type: 'uint8_t', name: 'channel', descriptionEn: 'IDE Channel (0 = Primary, 1 = Secondary)', descriptionRu: 'Канал IDE (0 = Primary, 1 = Secondary)' },
      { offset: '0x02', size: '1 byte', type: 'uint8_t', name: 'drive', descriptionEn: 'Drive position (0 = Master, 1 = Slave)', descriptionRu: 'Позиция накопителя (0 = Master, 1 = Slave)' },
      { offset: '0x04', size: '4 bytes', type: 'ata_device_type_t', name: 'type', descriptionEn: 'Device type (0=NONE, 1=PATA, 2=PATAPI)', descriptionRu: 'Тип устройства (0=NONE, 1=PATA, 2=PATAPI)' },
      { offset: '0x08', size: '2 bytes', type: 'uint16_t', name: 'cylinders', descriptionEn: 'Drive cylinders count from IDENTIFY', descriptionRu: 'Количество цилиндров накопителя из ответа IDENTIFY' },
      { offset: '0x0A', size: '2 bytes', type: 'uint16_t', name: 'heads', descriptionEn: 'Drive heads count from IDENTIFY', descriptionRu: 'Количество магнитных головок из ответа IDENTIFY' },
      { offset: '0x0C', size: '2 bytes', type: 'uint16_t', name: 'sectors', descriptionEn: 'Sectors per track from IDENTIFY', descriptionRu: 'Количество секторов на дорожку из IDENTIFY' },
      { offset: '0x10', size: '8 bytes', type: 'uint64_t', name: 'capacity_sectors', descriptionEn: 'Total capacity in 512-byte sectors (LBA28/LBA48)', descriptionRu: 'Полная ёмкость в секторах по 512 байт (LBA28/LBA48)' },
      { offset: '0x18', size: '41 bytes', type: 'char[41]', name: 'model', descriptionEn: 'ATA IDENTIFY ASCII model string (40 chars + NULL)', descriptionRu: 'ASCII строка модели накопителя (40 символов + NULL)' },
      { offset: '0x41', size: '21 bytes', type: 'char[21]', name: 'serial', descriptionEn: 'ATA serial number string (20 chars + NULL)', descriptionRu: 'Серийный номер устройства (20 символов + NULL)' }
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
    numHex: '0x1030',
    numDec: 4144,
    name: 'IPO_SYSCALL_ASYNC_START',
    signature: 'int ipo_async_start(void *task_fn, void *arg)',
    argsEn: ['args[0]: Function entry pointer', 'args[1]: Parameter pointer'],
    argsRu: ['args[0]: Указатель на функцию задачи', 'args[1]: Указатель на параметр'],
    returnEn: 'Task ID handle (>= 0), or negative on failure',
    returnRu: 'Идентификатор задачи (>= 0) или код ошибки',
    descriptionEn: 'Registers periodic asynchronous kernel task (fires on kernel ticks).',
    descriptionRu: 'Регистрирует периодическую асинхронную задачу ядра (вызывается на тиках ядра).'
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
    returnEn: 'System uptime in milliseconds',
    returnRu: 'Время работы системы в миллисекундах',
    descriptionEn: 'Returns system uptime milliseconds measured from kernel boot.',
    descriptionRu: 'Возвращает системный аптайм в миллисекундах от старта ядра.'
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
    descriptionEn: 'Enters VGA Mode 13h, allocates backbuffer, registers 60 FPS compositor async task.',
    descriptionRu: 'Переходит в режим 320x200x256, выделяет backbuffer и запускает композитор (60 FPS).'
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
