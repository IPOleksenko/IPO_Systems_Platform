#!/usr/bin/env python3
"""
IPO Systems Platform — Artifact Build & Packaging Pipeline
Clones, builds, and packages binaries for IPO_Firmware, IPO_Boot_ROM, IPO_OS, and IPO_OS_Software.
Compiles once, caching outputs in public/downloads/ for fast delivery on GitHub Pages.
"""

import argparse
import datetime
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import tarfile
import zipfile
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DOWNLOADS_DIR = BASE_DIR / "public" / "downloads"
CACHE_REPOS_DIR = BASE_DIR / ".cache" / "repos"

REPOSITORIES = {
    "IPO_Firmware": "https://github.com/IPOleksenko/IPO_Firmware.git",
    "IPO_Boot_ROM": "https://github.com/IPOleksenko/IPO_Boot_ROM.git",
    "IPO_OS": "https://github.com/IPOleksenko/IPO_OS.git",
    "IPO_OS_Software": "https://github.com/IPOleksenko/IPO_OS_Software.git",
}

STANDARD_BOOTROM_SIZES = [
    ("64K", "64k", "64 KB"),
    ("128K", "128k", "128 KB"),
    ("256K", "256k", "256 KB"),
    ("512K", "512k", "512 KB"),
    ("1M", "1m", "1 MB"),
    ("2M", "2m", "2 MB"),
    ("4M", "4m", "4 MB"),
    ("8M", "8m", "8 MB"),
    ("16M", "16m", "16 MB"),
]
RETIRED_BOOTROM_SIZES = ["32m", "64m", "128m"]
ARCHIVE_FORMATS = ["zip", "tar.gz", "tar.bz2", "tar.xz"]
EXPECTED_ARTIFACTS = [
    *[f"ipo-system-bundle.{extension}" for extension in ARCHIVE_FORMATS],
    "IPO_OS.img",
    "disk-installed.img",
    "disk-clean.img",
    *[f"applications.{extension}" for extension in ARCHIVE_FORMATS],
    *[
        f"ipo-boot-rom{'' if size == '4m' else f'-{size}'}.bin"
        for _, size, _ in STANDARD_BOOTROM_SIZES
    ],
    "firmware.rom",
]


def sha256_file(filepath: Path) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def create_tar_archive_from_zip(source_path: Path, destination_path: Path, compression: str) -> None:
    with zipfile.ZipFile(source_path) as source, tarfile.open(destination_path, f"w:{compression}") as archive:
        for member in source.infolist():
            info = tarfile.TarInfo(member.filename)
            info.size = member.file_size
            info.mode = (member.external_attr >> 16) & 0xFFFF or 0o644
            info.mtime = datetime.datetime(*member.date_time, tzinfo=datetime.timezone.utc).timestamp()
            if member.is_dir():
                info.type = tarfile.DIRTYPE
                info.size = 0
                archive.addfile(info)
            else:
                with source.open(member) as content:
                    archive.addfile(info, content)


def add_tar_archive_variants(
    source_path: Path,
    artifact: dict,
    manifest_entries: list,
    archive_group: str | None = None,
    extra_metadata: dict | None = None,
) -> None:
    variants = [
        ("tar.gz", "gz", "TAR.GZ"),
        ("tar.bz2", "bz2", "TAR.BZ2"),
        ("tar.xz", "xz", "TAR.XZ"),
    ]
    archive_group = archive_group or artifact["id"]
    artifact["archive_group"] = archive_group
    artifact["archive_format"] = "ZIP"
    if extra_metadata:
        artifact.update(extra_metadata)

    for extension, compression, label in variants:
        destination = DOWNLOADS_DIR / f"{source_path.stem}.{extension}"
        create_tar_archive_from_zip(source_path, destination, compression)
        variant = artifact.copy()
        variant.update({
            "id": f"{artifact['id']}-{extension.replace('.', '-')}",
            "file": destination.name,
            "archive_group": archive_group,
            "archive_format": label,
            "size_bytes": destination.stat().st_size,
            "size_formatted": format_size(destination.stat().st_size),
            "sha256": sha256_file(destination),
        })
        if extra_metadata:
            variant.update(extra_metadata)
        variant.pop("featured", None)
        manifest_entries.append(variant)


def build_bootrom_binaries(bootrom: dict, manifest_entries: list) -> None:
    with tempfile.TemporaryDirectory(prefix="ipo-boot-rom-") as temp_dir:
        temp_path = Path(temp_dir)
        build_rom_script = bootrom["build_rom_script"]

        for flash_size, size_slug, size_label in STANDARD_BOOTROM_SIZES:
            binary_name = f"ipo-boot-rom{'' if size_slug == '4m' else f'-{size_slug}'}.bin"
            binary_path = DOWNLOADS_DIR / binary_name
            raw_path = temp_path / f"bootrom-{size_slug}.bin"
            subprocess.run(
                [
                    sys.executable,
                    str(build_rom_script),
                    flash_size,
                    str(bootrom["firmware_bin"]),
                    str(bootrom["init_bin"]),
                    str(bootrom["reset_bin"]),
                    str(raw_path),
                ],
                check=True,
            )
            rom_size_bytes = raw_path.stat().st_size
            shutil.copy2(raw_path, binary_path)

            artifact = {
                "id": f"ipo-boot-rom-{size_slug}",
                "file": binary_name,
                "name": f"IPO_Boot_ROM ({size_label})",
                "category": "bootrom",
                "description": f"IPO_Boot_ROM image sized for a {size_label} flash chip.",
                "download_group": "ipo-boot-rom",
                "rom_size": size_label,
                "rom_size_bytes": rom_size_bytes,
                "size_bytes": rom_size_bytes,
                "size_formatted": format_size(rom_size_bytes),
                "sha256": sha256_file(binary_path),
            }
            manifest_entries.append(artifact)


def format_size(bytes_num: int) -> str:
    for unit in ["B", "KB", "MB", "GB"]:
        if bytes_num < 1024.0:
            return f"{bytes_num:.1f} {unit}" if unit != "B" else f"{bytes_num} B"
        bytes_num /= 1024.0
    return f"{bytes_num:.1f} TB"


def artifacts_exist() -> bool:
    manifest_path = DOWNLOADS_DIR / "manifest.json"
    if not manifest_path.exists():
        return False
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest_files = {artifact["file"] for artifact in manifest.get("artifacts", [])}
    except (OSError, json.JSONDecodeError, KeyError, TypeError):
        return False
    expected_bootrom_files = {filename for filename in EXPECTED_ARTIFACTS if filename.startswith("ipo-boot-rom")}
    manifest_bootrom_files = {filename for filename in manifest_files if filename.startswith("ipo-boot-rom")}
    if manifest_bootrom_files != expected_bootrom_files:
        return False
    for filename in EXPECTED_ARTIFACTS:
        target = DOWNLOADS_DIR / filename
        if filename not in manifest_files or not target.exists() or target.stat().st_size == 0:
            return False
    return True


def ensure_repo(name: str, url: str, force_update: bool = False) -> Path:
    target_dir = CACHE_REPOS_DIR / name
    local_source = BASE_DIR.parent / name

    if local_source.exists():
        print(f"[{name}] Syncing from local source directory {local_source}...")
        if target_dir.exists():
            shutil.rmtree(target_dir)
        shutil.copytree(local_source, target_dir, symlinks=True, ignore=shutil.ignore_patterns(".git", "__pycache__"))
        print(f"[{name}] Copied successfully.")
        return target_dir

    CACHE_REPOS_DIR.mkdir(parents=True, exist_ok=True)

    # Try git clone if not present
    if not target_dir.exists():
        print(f"[{name}] Downloading repository from {url}...")
        try:
            res = subprocess.run(
                ["git", "clone", "--depth", "1", url, str(target_dir)],
                capture_output=True,
                text=True,
                timeout=120,
            )
            if res.returncode == 0:
                print(f"[{name}] Successfully cloned from GitHub.")
                return target_dir
            else:
                print(f"[{name}] Git clone failed: {res.stderr.strip()}")
        except Exception as e:
            print(f"[{name}] Network clone failed ({e}).")

        raise RuntimeError(f"Cannot obtain repository {name}: clone failed and local {local_source} not found.")

    if force_update:
        print(f"[{name}] Updating repository...")
        try:
            subprocess.run(["git", "pull"], cwd=target_dir, check=False)
        except Exception:
            pass

    return target_dir


def build_firmware(repo_dir: Path) -> dict:
    print("\n--- Building IPO_Firmware ---")
    subprocess.run(["make", "clean"], cwd=repo_dir, check=True)
    subprocess.run(["make"], cwd=repo_dir, check=True)

    fw_bin = repo_dir / "build" / ".bin" / "firmware.bin"
    fw_rom = repo_dir / "build" / "firmware.rom"
    if not fw_bin.exists() or not fw_rom.exists():
        raise RuntimeError("IPO_Firmware build did not produce firmware.bin / firmware.rom")

    print(f"✓ IPO_Firmware built: {fw_rom.name} ({fw_rom.stat().st_size} bytes)")
    return {"bin": fw_bin, "rom": fw_rom}


def build_bootrom(repo_dir: Path, firmware_bin: Path, firmware_repo_dir: Path) -> dict:
    print("\n--- Building IPO_Boot_ROM ---")
    subprocess.run(["make", "clean"], cwd=repo_dir, check=True)
    cmd = ["make", f"FIRMWARE={firmware_bin}"]
    subprocess.run(cmd, cwd=repo_dir, check=True)

    bootrom_bin = repo_dir / "build" / "bootrom.bin"
    if not bootrom_bin.exists():
        raise RuntimeError("IPO_Boot_ROM build did not produce bootrom.bin")

    print(f"✓ IPO_Boot_ROM built: {bootrom_bin.name} ({bootrom_bin.stat().st_size} bytes)")
    return {
        "bin": bootrom_bin,
        "firmware_bin": firmware_bin,
        "init_bin": repo_dir / "build" / ".bin" / "init.bin",
        "reset_bin": repo_dir / "build" / ".bin" / "reset.bin",
        "build_rom_script": repo_dir / "tools" / "build_rom.sh",
    }


def build_os(repo_dir: Path) -> dict:
    print("\n--- Building IPO_OS (Kernel & Boot Image) ---")
    subprocess.run(["make", "clean"], cwd=repo_dir, check=True)
    cmd = ["make", "lib", "kernel", "boot", "image"]
    subprocess.run(cmd, cwd=repo_dir, check=True)

    os_img = repo_dir / "build" / "IPO_OS.img"

    if not os_img.exists():
        raise RuntimeError("IPO_OS build did not produce IPO_OS.img")

    print(f"✓ IPO_OS built: {os_img.name} ({os_img.stat().st_size} bytes)")
    return {"os_img": os_img}


def build_software(repo_dir: Path) -> dict:
    print("\n--- Building IPO_OS_Software (Applications, Libraries, Toolchain & Disks) ---")
    subprocess.run(["make", "all"], cwd=repo_dir, check=True)

    build_dir = repo_dir / "build"
    disk_installed = build_dir / "disk-installed.img"
    disk_clean = build_dir / "disk-clean.img"
    apps_zip_path = build_dir / "applications.zip"

    # 1. Generate 512MB disk with pre-installed applications (Variant 2)
    if disk_installed.exists():
        disk_installed.unlink()

    print("[IPO_OS_Software] Populating 512MB IPO_FS disk with applications (disk-installed.img)...")
    subprocess.run(
        [sys.executable, str(repo_dir / "tools" / "load_applications.py"), "--disk", str(disk_installed), "--format"],
        cwd=repo_dir,
        check=True,
    )

    if not disk_installed.exists() or disk_installed.stat().st_size == 0:
        raise RuntimeError("IPO_OS_Software build did not produce disk-installed.img")

    # Keep a copy as disk.img for backwards-compatibility
    shutil.copy2(disk_installed, build_dir / "disk.img")

    # 2. Generate 512MB clean formatted IPO_FS disk (Variant 1A)
    if disk_clean.exists():
        disk_clean.unlink()

    print("[IPO_OS_Software] Creating clean 512MB IPO_FS disk (disk-clean.img)...")
    with open(disk_clean, "wb") as f:
        f.truncate(512 * 1024 * 1024)

    subprocess.run(
        [sys.executable, str(repo_dir / "tools" / "disk_editor.py"), "-i", str(disk_clean), "format"],
        cwd=repo_dir,
        check=True,
    )

    if not disk_clean.exists() or disk_clean.stat().st_size == 0:
        raise RuntimeError("IPO_OS_Software build did not produce disk-clean.img")

    # 3. Package applications.zip (Variant 1B: ONLY compiled binaries, no sources/build scripts)
    if apps_zip_path.exists():
        apps_zip_path.unlink()

    print(f"[IPO_OS_Software] Packaging compiled applications only into {apps_zip_path.name}...")
    with zipfile.ZipFile(apps_zip_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
        # Applications (*.bin, doom1.wad)
        apps_build = build_dir / "applications"
        if apps_build.exists():
            for f in apps_build.rglob("*"):
                if f.is_file() and (f.suffix in [".bin", ".wad"] or f.name.endswith(".bin") or f.name == "doom1.wad"):
                    z.write(f, arcname=f"applications/{f.name}")
        doom_wad = repo_dir / "applications" / "doom" / "doom1.wad"
        if doom_wad.exists() and "applications/doom1.wad" not in z.namelist():
            z.write(doom_wad, arcname="applications/doom1.wad")

        # Toolchain (*.elf)
        tc_build = build_dir / "toolchain"
        if tc_build.exists():
            for f in tc_build.rglob("*"):
                if f.is_file() and f.suffix == ".elf":
                    z.write(f, arcname=f"toolchain/{f.name}")

        # Libraries (*.a, *.o, linker.ld)
        lib_build = build_dir / "lib"
        if lib_build.exists():
            for f in lib_build.rglob("*"):
                if f.is_file() and f.suffix in [".a", ".o", ".ld"]:
                    z.write(f, arcname=f"lib/{f.name}")
        linker_ld = repo_dir / "lib" / "linker.ld"
        if linker_ld.exists() and "lib/linker.ld" not in z.namelist():
            z.write(linker_ld, arcname="lib/linker.ld")

        # Fonts (*.fnt)
        fonts_build = build_dir / "fonts"
        if fonts_build.exists() and any(fonts_build.glob("*.fnt")):
            for f in fonts_build.rglob("*.fnt"):
                z.write(f, arcname=f"fonts/{f.name}")
        else:
            assets_fonts = repo_dir / "assets" / "fonts"
            if assets_fonts.exists():
                for f in assets_fonts.rglob("*.fnt"):
                    z.write(f, arcname=f"fonts/{f.name}")

        # Headers (include/**/*.h)
        inc_dir = repo_dir / "include"
        if inc_dir.exists():
            for f in inc_dir.rglob("*.h"):
                z.write(f, arcname=f"include/{f.relative_to(inc_dir)}")

    print(f"✓ IPO_OS_Software built: {disk_installed.name}, {disk_clean.name}, {apps_zip_path.name}")
    return {
        "disk_installed": disk_installed,
        "disk_clean": disk_clean,
        "applications_zip": apps_zip_path,
        "disk_img": build_dir / "disk.img",
    }


def package_artifacts(fw: dict, br: dict, os_art: dict, sw_art: dict) -> list:
    DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    manifest_entries = []

    print("\n--- Packaging Release Artifacts ---")

    # 1. Standalone IPO_OS.img (Bootable Kernel Image)
    raw_os_dest = DOWNLOADS_DIR / "IPO_OS.img"
    shutil.copy2(os_art["os_img"], raw_os_dest)
    manifest_entries.append({
        "id": "ipo-os-raw",
        "file": "IPO_OS.img",
        "name": "IPO_OS Kernel Bootable Image",
        "category": "os",
        "description": "Raw 32-bit bootable image containing IPO_OS kernel (LBA 0 bootloader + kernel binary).",
        "size_bytes": raw_os_dest.stat().st_size,
        "size_formatted": format_size(raw_os_dest.stat().st_size),
        "sha256": sha256_file(raw_os_dest),
    })

    # 2. Variant 2: disk-installed.img (512 MB Pre-Installed Applications Disk)
    disk_inst_dest = DOWNLOADS_DIR / "disk-installed.img"
    shutil.copy2(sw_art["disk_installed"], disk_inst_dest)
    manifest_entries.append({
        "id": "ipo-disk-installed",
        "file": "disk-installed.img",
        "name": "IPO_OS Pre-Installed Disk (512 MB)",
        "category": "software",
        "description": "Ready-to-use 512 MB virtual disk image with all applications, DOOM, toolchains, runtime libraries, and fonts pre-installed.",
        "size_bytes": disk_inst_dest.stat().st_size,
        "size_formatted": format_size(disk_inst_dest.stat().st_size),
        "sha256": sha256_file(disk_inst_dest),
    })

    # Also keep disk.img for backwards-compatibility
    disk_os_dest = DOWNLOADS_DIR / "disk.img"
    shutil.copy2(sw_art["disk_installed"], disk_os_dest)

    # 3. Variant 1A: disk-clean.img (512 MB Clean Formatted IPO_FS Disk)
    disk_clean_dest = DOWNLOADS_DIR / "disk-clean.img"
    shutil.copy2(sw_art["disk_clean"], disk_clean_dest)
    manifest_entries.append({
        "id": "ipo-disk-clean",
        "file": "disk-clean.img",
        "name": "IPO_OS Clean Formatted Disk (512 MB)",
        "category": "os",
        "description": "Clean 512 MB disk image formatted with the extent-based IPO_FS filesystem without pre-installed applications.",
        "size_bytes": disk_clean_dest.stat().st_size,
        "size_formatted": format_size(disk_clean_dest.stat().st_size),
        "sha256": sha256_file(disk_clean_dest),
    })

    # 4. Variant 1B: applications.zip (Pre-Compiled Binaries Only)
    apps_dest = DOWNLOADS_DIR / "applications.zip"
    shutil.copy2(sw_art["applications_zip"], apps_dest)
    manifest_entries.append({
        "id": "ipo-applications",
        "file": "applications.zip",
        "name": "IPO_OS Compiled Applications Package",
        "category": "software",
        "description": "Pre-compiled production binaries: applications, DOOM, in-OS developer toolchain (TCC, Lua, Python, NASM), runtime libraries (libc, libm, libapp, tinygl), SDK headers, and fonts.",
        "size_bytes": apps_dest.stat().st_size,
        "size_formatted": format_size(apps_dest.stat().st_size),
        "sha256": sha256_file(apps_dest),
    })
    add_tar_archive_variants(apps_dest, manifest_entries[-1], manifest_entries)

    # 5. IPO_Firmware ROM (single-file artifact)
    firmware_dest = DOWNLOADS_DIR / "firmware.rom"
    shutil.copy2(fw["rom"], firmware_dest)
    manifest_entries.append({
        "id": "ipo-firmware",
        "file": "firmware.rom",
        "name": "IPO_Firmware",
        "category": "firmware",
        "description": "Compiled IPO_Firmware runtime services ROM binary (firmware.rom).",
        "size_bytes": firmware_dest.stat().st_size,
        "size_formatted": format_size(firmware_dest.stat().st_size),
        "sha256": sha256_file(firmware_dest),
    })

    # 6. IPO_Boot_ROM binaries for standard flash chip sizes
    build_bootrom_binaries(br, manifest_entries)

    # 7. Full System Turnkey Bundle (Compiled binaries of all projects)
    full_bundle_path = DOWNLOADS_DIR / "ipo-system-bundle.zip"
    with zipfile.ZipFile(full_bundle_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
        z.write(br["bin"], "bootrom.bin")
        z.write(fw["rom"], "firmware.rom")
        z.write(os_art["os_img"], "IPO_OS.img")
        z.write(sw_art["disk_installed"], "disk-installed.img")
        z.write(sw_art["disk_clean"], "disk-clean.img")
        z.write(sw_art["applications_zip"], "applications.zip")
    manifest_entries.append({
        "id": "ipo-system-bundle",
        "file": "ipo-system-bundle.zip",
        "name": "Complete IPO Systems Bundle (All Projects & Disks)",
        "category": "bundle",
        "featured": True,
        "description": "All compiled binaries across the platform: Boot ROM (bootrom.bin), Firmware (firmware.rom), IPO_OS kernel image (IPO_OS.img), clean and pre-installed disks (disk-clean.img, disk-installed.img), and pre-compiled applications package (applications.zip).",
        "size_bytes": full_bundle_path.stat().st_size,
        "size_formatted": format_size(full_bundle_path.stat().st_size),
        "sha256": sha256_file(full_bundle_path),
    })
    add_tar_archive_variants(full_bundle_path, manifest_entries[-1], manifest_entries)

    # Clean up obsolete archives
    for obsolete in [
        "ipo-os-bundle.zip",
        "ipo-os-software.zip",
        "ipo-firmware.zip",
        "ipo-firmware.tar.gz",
        "ipo-firmware.tar.bz2",
        "ipo-firmware.tar.xz",
        *[
            f"ipo-boot-rom{'' if size == '4m' else f'-{size}'}.{extension}"
            for _, size, _ in STANDARD_BOOTROM_SIZES
            for extension in ARCHIVE_FORMATS
        ],
        *[
            f"ipo-boot-rom-{size}.{extension}"
            for size in RETIRED_BOOTROM_SIZES
            for extension in [*ARCHIVE_FORMATS, "bin"]
        ],
    ]:
        obsolete_file = DOWNLOADS_DIR / obsolete
        if obsolete_file.exists():
            obsolete_file.unlink()

    # Write manifest
    manifest = {
        "version": "1.4.0",
        "build_date": timestamp,
        "generator": "IPO Systems Documentation Build Pipeline",
        "artifacts": manifest_entries,
    }

    manifest_path = DOWNLOADS_DIR / "manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Generated manifest with {len(manifest_entries)} artifacts at {manifest_path}")
    for a in manifest_entries:
        print(f"  • {a['file']:<25} ({a['size_formatted']}) [SHA256: {a['sha256'][:8]}...]")

    return manifest_entries


def main():
    parser = argparse.ArgumentParser(description="Build and package IPO Systems artifacts")
    parser.add_argument("--force", action="store_true", help="Force rebuild even if artifacts already exist")
    parser.add_argument("--update", action="store_true", help="Pull latest repository changes before building")
    args = parser.parse_args()

    if not args.force and artifacts_exist():
        print("[artifacts] Pre-compiled artifacts already exist in public/downloads/.")
        print("[artifacts] Serving existing build. Use --force to recompile from source.")
        return 0

    print("==================================================")
    print("IPO Systems Platform — Artifact Pipeline")
    print("==================================================")

    force_sync = args.force or args.update
    fw_repo = ensure_repo("IPO_Firmware", REPOSITORIES["IPO_Firmware"], force_update=force_sync)
    br_repo = ensure_repo("IPO_Boot_ROM", REPOSITORIES["IPO_Boot_ROM"], force_update=force_sync)
    os_repo = ensure_repo("IPO_OS", REPOSITORIES["IPO_OS"], force_update=force_sync)
    sw_repo = ensure_repo("IPO_OS_Software", REPOSITORIES["IPO_OS_Software"], force_update=force_sync)

    # Build in dependency order: Firmware -> Boot ROM -> OS -> Software
    fw_art = build_firmware(fw_repo)
    br_art = build_bootrom(br_repo, fw_art["bin"], fw_repo)
    os_art = build_os(os_repo)
    sw_art = build_software(sw_repo)

    # Package and generate manifest in public/downloads/
    package_artifacts(fw_art, br_art, os_art, sw_art)

    print("\n✓ All artifacts built and ready for distribution!\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
