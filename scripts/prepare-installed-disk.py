#!/usr/bin/env python3
import argparse
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

from project_repositories import REPOSITORIES, ensure_repo


BASE_DIR = Path(__file__).resolve().parent.parent
SECTOR_SIZE = 512
EXPECTED_FILESYSTEM_LBA = 2048


def main() -> None:
    parser = argparse.ArgumentParser(description="Build a bootable IPO_OS disk with applications installed.")
    parser.add_argument("--output", type=Path, default=BASE_DIR / "public" / "emulator")
    parser.add_argument("--os-image", type=Path, default=BASE_DIR / "public" / "downloads" / "IPO_OS.img")
    parser.add_argument("--application-manifest", type=Path, default=BASE_DIR / ".cache" / "applications.json")
    args = parser.parse_args()

    output = args.output.resolve()
    os_image = args.os_image.resolve()
    application_manifest = args.application_manifest.resolve()
    app_repo = ensure_repo("IPO_OS_Software", REPOSITORIES["IPO_OS_Software"])
    if not application_manifest.is_file():
        raise RuntimeError("Application verification manifest is missing; prepare applications before building disk-installed.img.")

    original_os = os_image.read_bytes()
    if len(original_os) < SECTOR_SIZE or original_os[510:512] != b"\x55\xAA":
        raise RuntimeError(f"{os_image} is not a bootable IPO_OS image.")

    filesystem_lba = None
    partition_capacity = None
    for index in range(4):
        entry = 0x1BE + index * 16
        if original_os[entry] != 0x80 or original_os[entry + 4] != 0x83:
            continue
        start = int.from_bytes(original_os[entry + 8:entry + 12], "little")
        sectors = int.from_bytes(original_os[entry + 12:entry + 16], "little")
        if start != EXPECTED_FILESYSTEM_LBA or sectors == 0:
            raise RuntimeError(f"IPO_OS has an unsupported application partition at LBA {start}.")
        filesystem_lba = start
        partition_capacity = (start + sectors) * SECTOR_SIZE
        break
    if filesystem_lba is None or partition_capacity is None:
        raise RuntimeError("IPO_OS does not contain the expected active IPO_FS partition.")

    output.mkdir(parents=True, exist_ok=True)
    installed_disk = output / "disk-installed.img"
    shutil.copyfile(os_image, installed_disk)
    with installed_disk.open("r+b") as image:
        image.truncate(partition_capacity)

    loader = app_repo / "tools" / "load_applications.py"
    result = subprocess.run(
        [
            sys.executable,
            str(loader),
            "--disk",
            str(installed_disk),
            "--project-root",
            str(app_repo),
            "--start-lba",
            str(filesystem_lba),
            "--format",
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.stdout:
        print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)
    if result.returncode != 0:
        raise RuntimeError(f"IPO_OS_Software application loader exited with status {result.returncode}.")
    if "Warning putting" in result.stdout or "invalid dest path" in result.stdout:
        raise RuntimeError("IPO_OS_Software reported one or more files that it could not install.")

    boot_region_size = min(len(original_os), filesystem_lba * SECTOR_SIZE)
    with installed_disk.open("rb") as image:
        if image.read(boot_region_size) != original_os[:boot_region_size]:
            raise RuntimeError("Application installation changed the IPO_OS boot region before its filesystem partition.")
    if installed_disk.stat().st_size != partition_capacity:
        raise RuntimeError("disk-installed.img does not match the disk capacity declared by the IPO_OS MBR.")

    sys.path.insert(0, str(app_repo / "tools"))
    from disk_editor import DiskImage

    package = json.loads(application_manifest.read_text(encoding="utf-8"))
    if not package.get("files"):
        raise RuntimeError("Application verification manifest contains no files.")
    disk = DiskImage(str(installed_disk), start_lba=filesystem_lba)
    try:
        for asset in package.get("files", []):
            source_relative = Path(asset["source"])
            if source_relative.is_absolute() or ".." in source_relative.parts:
                raise RuntimeError(f"Application manifest contains an invalid source path: {asset['source']}.")
            source = (app_repo / source_relative).resolve()
            if not source.is_relative_to(app_repo.resolve()):
                raise RuntimeError(f"Application manifest source escapes the repository: {asset['source']}.")
            expected = source.read_bytes()
            if len(expected) != asset["size"] or hashlib.sha256(expected).hexdigest() != asset["sha256"]:
                raise RuntimeError(f"Application source changed after manifest generation: {asset['source']}.")
            actual = disk.cat(asset["path"])
            if actual != expected:
                raise RuntimeError(f"Installed disk content does not match {asset['path']}.")
    finally:
        disk.close()

    print(
        f"[applications] Verified bootable disk-installed.img: "
        f"{installed_disk.stat().st_size} bytes, {len(package['files'])} application/support files."
    )


if __name__ == "__main__":
    main()
