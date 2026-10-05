#!/usr/bin/env python3
"""
IPO Systems Platform — Artifact Build & Packaging Pipeline
Clones, builds, and packages binaries for IPO_Firmware, IPO_Boot_ROM, and IPO_OS.
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
import zipfile
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DOWNLOADS_DIR = BASE_DIR / "public" / "downloads"
CACHE_REPOS_DIR = BASE_DIR / ".cache" / "repos"

REPOSITORIES = {
    "IPO_Firmware": "https://github.com/IPOleksenko/IPO_Firmware.git",
    "IPO_Boot_ROM": "https://github.com/IPOleksenko/IPO_Boot_ROM.git",
    "IPO_OS": "https://github.com/IPOleksenko/IPO_OS.git",
}

EXPECTED_ARTIFACTS = [
    "ipo-system-bundle.zip",
    "IPO_OS.img",
    "disk.img",
    "ipo-boot-rom.zip",
    "ipo-firmware.zip",
]


def sha256_file(filepath: Path) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


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
    for filename in EXPECTED_ARTIFACTS:
        target = DOWNLOADS_DIR / filename
        if not target.exists() or target.stat().st_size == 0:
            return False
    return True


def ensure_repo(name: str, url: str, force_update: bool = False) -> Path:
    target_dir = CACHE_REPOS_DIR / name
    local_source = BASE_DIR.parent / name

    if target_dir.exists() and not force_update:
        print(f"[{name}] Using cached repository at {target_dir}")
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

        # Fallback to local source in parent directory if available
        if local_source.exists():
            print(f"[{name}] Copying from local source directory {local_source}...")
            shutil.copytree(local_source, target_dir, symlinks=True, ignore=shutil.ignore_patterns(".git", "build", "__pycache__"))
            print(f"[{name}] Copied successfully.")
            return target_dir
        else:
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

    fw_bin = repo_dir / "build" / "firmware.bin"
    fw_rom = repo_dir / "build" / "firmware_rom.bin"
    if not fw_bin.exists() or not fw_rom.exists():
        raise RuntimeError("IPO_Firmware build did not produce firmware.bin / firmware_rom.bin")

    print(f"✓ IPO_Firmware built: {fw_bin.name} ({fw_bin.stat().st_size} bytes), {fw_rom.name} ({fw_rom.stat().st_size} bytes)")
    return {"bin": fw_bin, "rom": fw_rom}


def build_bootrom(repo_dir: Path, firmware_bin: Path, firmware_repo_dir: Path) -> dict:
    print("\n--- Building IPO_Boot_ROM ---")
    # Ensure test stub files exist if needed
    tests_dir = repo_dir / "tests"
    tests_dir.mkdir(exist_ok=True)
    for asset in ["font8x16.bin", "vga_dac.bin"]:
        src_asset = firmware_repo_dir / "src" / asset
        dest_asset = tests_dir / asset
        if src_asset.exists() and not dest_asset.exists():
            shutil.copy2(src_asset, dest_asset)

    subprocess.run(["make", "clean"], cwd=repo_dir, check=True)
    cmd = ["make", f"FW_BIN={firmware_bin}", "bootrom", "build/bootrom_run.bin"]
    subprocess.run(cmd, cwd=repo_dir, check=True)

    bootrom_bin = repo_dir / "build" / "bootrom.bin"
    bootrom_run = repo_dir / "build" / "bootrom_run.bin"
    bootrom_tmpl = repo_dir / "build" / "bootrom_template.bin"

    if not bootrom_bin.exists() or not bootrom_run.exists():
        raise RuntimeError("IPO_Boot_ROM build did not produce bootrom.bin / bootrom_run.bin")

    print(f"✓ IPO_Boot_ROM built: {bootrom_run.name} ({bootrom_run.stat().st_size} bytes)")
    return {"bin": bootrom_bin, "run": bootrom_run, "tmpl": bootrom_tmpl}


def build_os(repo_dir: Path) -> dict:
    print("\n--- Building IPO_OS ---")
    subprocess.run(["make", "clean"], cwd=repo_dir, check=True)
    cmd = ["make", "lib", "kernel", "boot", "applications", "toolchain", "image", "disks"]
    subprocess.run(cmd, cwd=repo_dir, check=True)

    os_img = repo_dir / "build" / "IPO_OS.img"
    disk_img = repo_dir / "build" / "disk.img"

    if not os_img.exists() or not disk_img.exists():
        raise RuntimeError("IPO_OS build did not produce IPO_OS.img / disk.img")

    print(f"✓ IPO_OS built: {os_img.name} ({os_img.stat().st_size} bytes), {disk_img.name} ({disk_img.stat().st_size} bytes)")
    return {"os_img": os_img, "disk_img": disk_img}


def package_artifacts(fw: dict, br: dict, os_art: dict) -> list:
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

    # 2. Standalone disk.img (128 MB Applications & Filesystem Disk)
    disk_os_dest = DOWNLOADS_DIR / "disk.img"
    shutil.copy2(os_art["disk_img"], disk_os_dest)
    manifest_entries.append({
        "id": "ipo-os-disk",
        "file": "disk.img",
        "name": "IPO_OS Applications Disk (128 MB)",
        "category": "os",
        "description": "Pre-formatted 128 MB disk image with 39 compiled applications and userland toolchain.",
        "size_bytes": disk_os_dest.stat().st_size,
        "size_formatted": format_size(disk_os_dest.stat().st_size),
        "sha256": sha256_file(disk_os_dest),
    })

    # 3. IPO_Firmware zip (Compiled ROM binaries ONLY)
    fw_zip_path = DOWNLOADS_DIR / "ipo-firmware.zip"
    with zipfile.ZipFile(fw_zip_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
        z.write(fw["rom"], "firmware_rom.bin")
        z.write(fw["bin"], "firmware.bin")
    manifest_entries.append({
        "id": "ipo-firmware",
        "file": "ipo-firmware.zip",
        "name": "IPO_Firmware Package",
        "category": "firmware",
        "description": "Compiled BIOS runtime service layer ROM binaries (firmware_rom.bin, firmware.bin).",
        "size_bytes": fw_zip_path.stat().st_size,
        "size_formatted": format_size(fw_zip_path.stat().st_size),
        "sha256": sha256_file(fw_zip_path),
    })

    # 4. IPO_Boot_ROM zip (Compiled ROM binaries ONLY)
    br_zip_path = DOWNLOADS_DIR / "ipo-boot-rom.zip"
    with zipfile.ZipFile(br_zip_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
        z.write(br["run"], "bootrom_run.bin")
        z.write(br["bin"], "bootrom.bin")
        if br["tmpl"].exists():
            z.write(br["tmpl"], "bootrom_template.bin")
    manifest_entries.append({
        "id": "ipo-boot-rom",
        "file": "ipo-boot-rom.zip",
        "name": "IPO_Boot_ROM Package",
        "category": "bootrom",
        "description": "Compiled hardware reset vector 0xFFFFFFF0 ROM binaries (bootrom_run.bin, bootrom.bin).",
        "size_bytes": br_zip_path.stat().st_size,
        "size_formatted": format_size(br_zip_path.stat().st_size),
        "sha256": sha256_file(br_zip_path),
    })

    # 5. Full System Turnkey Bundle (Compiled binaries of all 3 projects ONLY)
    full_bundle_path = DOWNLOADS_DIR / "ipo-system-bundle.zip"
    with zipfile.ZipFile(full_bundle_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
        z.write(br["run"], "bootrom_run.bin")
        z.write(fw["rom"], "firmware_rom.bin")
        z.write(os_art["os_img"], "IPO_OS.img")
        z.write(os_art["disk_img"], "disk.img")
    manifest_entries.append({
        "id": "ipo-system-bundle",
        "file": "ipo-system-bundle.zip",
        "name": "Complete IPO Systems Bundle (All 3 Projects & Disk)",
        "category": "bundle",
        "featured": True,
        "description": "All compiled binaries across the entire platform: Boot ROM, Firmware BIOS, IPO_OS kernel image, and 128 MB applications disk.",
        "size_bytes": full_bundle_path.stat().st_size,
        "size_formatted": format_size(full_bundle_path.stat().st_size),
        "sha256": sha256_file(full_bundle_path),
    })

    # Clean up obsolete duplicate ipo-os-bundle.zip if present
    obsolete_bundle = DOWNLOADS_DIR / "ipo-os-bundle.zip"
    if obsolete_bundle.exists():
        try:
            obsolete_bundle.unlink()
        except Exception:
            pass

    # Write manifest
    manifest = {
        "version": "1.0.0",
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

    # 1. Ensure all 3 repositories are present in cache
    fw_repo = ensure_repo("IPO_Firmware", REPOSITORIES["IPO_Firmware"], force_update=args.update)
    br_repo = ensure_repo("IPO_Boot_ROM", REPOSITORIES["IPO_Boot_ROM"], force_update=args.update)
    os_repo = ensure_repo("IPO_OS", REPOSITORIES["IPO_OS"], force_update=args.update)

    # 2. Build in dependency order: Firmware -> Boot ROM -> OS
    fw_art = build_firmware(fw_repo)
    br_art = build_bootrom(br_repo, fw_art["bin"], fw_repo)
    os_art = build_os(os_repo)

    # 3. Package and generate manifest in public/downloads/
    package_artifacts(fw_art, br_art, os_art)

    print("\n✓ All artifacts built and ready for distribution!\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
