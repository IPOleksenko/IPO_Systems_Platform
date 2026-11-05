#!/usr/bin/env python3
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

from project_repositories import REPOSITORIES, ensure_repo


BASE_DIR = Path(__file__).resolve().parent.parent
TOOLCHAIN_FILES = {
    "gcc": "gcc.elf",
    "g++": "g++.elf",
    "ld": "ld.elf",
    "as": "as.elf",
    "ar": "ar.elf",
    "ranlib": "ranlib.elf",
    "objcopy": "objcopy.elf",
    "objdump": "objdump.elf",
    "readelf": "readelf.elf",
    "nm": "nm.elf",
    "strip": "strip.elf",
    "nasm": "nasm.elf",
    "micropython": "python.elf",
    "python": "python.elf",
    "lua": "lua/lua.elf",
    "luac": "lua/luac.elf",
}
LIBRARY_FILES = (
    "libc.a",
    "libm.a",
    "libstdc++.a",
    "libgcc.a",
    "crt0.o",
    "crti.o",
    "crtn.o",
    "crt1.o",
    "libtcc1.a",
    "libapp.a",
    "libapp_api.a",
)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def collect_files(repo: Path) -> list[tuple[Path, str]]:
    files: list[tuple[Path, str]] = []
    apps_dir = repo / "build" / "applications"
    app_binaries = sorted(apps_dir.rglob("*.bin")) if apps_dir.is_dir() else []
    for binary in app_binaries:
        files.append((binary, f"/applications/{binary.stem}"))

    toolchain_dir = repo / "build" / "toolchain"
    for name, relative_path in TOOLCHAIN_FILES.items():
        binary = toolchain_dir / relative_path
        if binary.is_file():
            files.append((binary, f"/applications/{name}"))

    doom_wad = repo / "applications" / "doom" / "doom1.wad"
    if doom_wad.is_file():
        files.append((doom_wad, "/applications/doom1.wad"))

    fonts_dir = repo / "build" / "fonts"
    if not fonts_dir.is_dir() or not any(fonts_dir.glob("*.fnt")):
        fonts_dir = repo / "assets" / "fonts"
    if fonts_dir.is_dir():
        files.extend((font, f"/fonts/{font.name}") for font in sorted(fonts_dir.glob("*.fnt")))

    library_dir = repo / "build" / "lib"
    files.extend(
        (library_dir / name, f"/lib/{name}")
        for name in LIBRARY_FILES
        if (library_dir / name).is_file()
    )
    linker_script = repo / "lib" / "linker.ld"
    if linker_script.is_file():
        files.append((linker_script, "/lib/linker.ld"))

    autorun = repo / "assets" / "autorun"
    if not autorun.is_file():
        autorun = repo / "autorun"
    if autorun.is_file():
        files.append((autorun, "/autorun"))

    destinations = [destination for _, destination in files]
    if len(destinations) != len(set(destinations)):
        raise RuntimeError("IPO_OS_Software contains duplicate application disk paths.")
    if not app_binaries:
        raise RuntimeError(f"No compiled application binaries found in {apps_dir}.")
    if not any(path == "/applications/doom" for _, path in files) and doom_wad.is_file():
        raise RuntimeError("DOOM game data exists but the compiled DOOM application is missing.")
    return files


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare an IPO_OS application verification manifest.")
    parser.add_argument("--manifest", type=Path, default=BASE_DIR / ".cache" / "applications.json")
    args = parser.parse_args()

    repo = ensure_repo("IPO_OS_Software", REPOSITORIES["IPO_OS_Software"])
    files = collect_files(repo)
    if not any(path.startswith("/applications/") for _, path in files):
        raise RuntimeError("IPO_OS_Software produced no installable applications.")

    expected_tools = {f"/applications/{name}" for name in TOOLCHAIN_FILES}
    installed_tools = {destination for _, destination in files} & expected_tools
    if installed_tools != expected_tools:
        print("Building missing IPO_OS_Software applications or toolchain outputs...")
        subprocess.run(["make", "all"], cwd=repo, check=True)
        files = collect_files(repo)
        installed_tools = {destination for _, destination in files} & expected_tools
        if installed_tools != expected_tools:
            missing = sorted(expected_tools - installed_tools)
            raise RuntimeError(f"IPO_OS_Software is missing built toolchain files: {', '.join(missing)}")

    manifest_path = args.manifest.resolve()
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    entries = []
    for source, destination in files:
        digest = sha256_file(source)
        entries.append({
            "path": destination,
            "source": source.relative_to(repo).as_posix(),
            "size": source.stat().st_size,
            "sha256": digest,
        })

    package_version = hashlib.sha256(
        json.dumps(
            [{"path": entry["path"], "sha256": entry["sha256"]} for entry in entries],
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
    ).hexdigest()
    manifest_path.write_text(
        json.dumps({"version": package_version, "files": entries}, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"[applications] Prepared a verification manifest for {len(entries)} files from {repo}.")


if __name__ == "__main__":
    main()
