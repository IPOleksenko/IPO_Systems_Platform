import shutil
import subprocess
import tempfile
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
CACHE_REPOS_DIR = BASE_DIR / ".cache" / "repos"

REPOSITORIES = {
    "IPO_Firmware": "https://github.com/IPOleksenko/IPO_Firmware.git",
    "IPO_Boot_ROM": "https://github.com/IPOleksenko/IPO_Boot_ROM.git",
    "IPO_OS": "https://github.com/IPOleksenko/IPO_OS.git",
    "IPO_OS_Software": "https://github.com/IPOleksenko/IPO_OS_Software.git",
}


def _normalized_url(url: str) -> str:
    normalized = url.rstrip("/")
    if normalized.endswith(".git"):
        normalized = normalized[:-4]
    return normalized.casefold()


def _is_expected_checkout(target_dir: Path, url: str) -> bool:
    if not target_dir.is_dir():
        return False

    root = subprocess.run(
        ["git", "-C", str(target_dir), "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
        check=False,
    )
    if root.returncode != 0 or Path(root.stdout.strip()).resolve() != target_dir.resolve():
        return False

    origin = subprocess.run(
        ["git", "-C", str(target_dir), "remote", "get-url", "origin"],
        capture_output=True,
        text=True,
        check=False,
    )
    return origin.returncode == 0 and _normalized_url(origin.stdout.strip()) == _normalized_url(url)


def ensure_repo(name: str, url: str, force_update: bool = False) -> Path:
    target_dir = CACHE_REPOS_DIR / name
    CACHE_REPOS_DIR.mkdir(parents=True, exist_ok=True)

    if _is_expected_checkout(target_dir, url):
        if force_update:
            print(f"[{name}] Updating repository from {url}...")
            subprocess.run(
                ["git", "-C", str(target_dir), "pull", "--ff-only"],
                check=True,
            )
        return target_dir

    print(f"[{name}] Downloading repository from {url}...")
    with tempfile.TemporaryDirectory(prefix=f".{name}-", dir=CACHE_REPOS_DIR) as temporary_dir:
        temporary_path = Path(temporary_dir)
        staged_repo = temporary_path / name
        subprocess.run(
            ["git", "clone", "--depth", "1", url, str(staged_repo)],
            check=True,
        )

        backup_dir = temporary_path / "previous"
        if target_dir.exists():
            target_dir.rename(backup_dir)
        try:
            staged_repo.rename(target_dir)
        except Exception:
            if backup_dir.exists():
                backup_dir.rename(target_dir)
            raise

    print(f"[{name}] Ready at {target_dir}.")
    return target_dir
