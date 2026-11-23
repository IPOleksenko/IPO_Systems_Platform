import os
import subprocess
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
REPOS_DIR = BASE_DIR / "repos"
LOCAL_REPOS_ENV = "IPO_LOCAL_REPOS"

REPOSITORIES = {
    "IPO_Firmware": "https://github.com/IPOleksenko/IPO_Firmware.git",
    "IPO_Boot_ROM": "https://github.com/IPOleksenko/IPO_Boot_ROM.git",
    "IPO_OS": "https://github.com/IPOleksenko/IPO_OS.git",
    "IPO_OS_Software": "https://github.com/IPOleksenko/IPO_OS_Software.git",
}

SUBMODULE_PATHS = {
    name: REPOS_DIR / name for name in REPOSITORIES
}

OPTIONAL_NESTED_SUBMODULES = {
    "third_party/SENSE-The-Game",
}


def _git_env() -> dict[str, str]:
    env = os.environ.copy()
    env.setdefault("GIT_TERMINAL_PROMPT", "0")
    return env


def _dir_populated(path: Path) -> bool:
    return path.is_dir() and any(path.iterdir())


def _list_nested_submodules(repo_dir: Path) -> list[str]:
    gitmodules = repo_dir / ".gitmodules"
    if not gitmodules.is_file():
        return []
    result = subprocess.run(
        [
            "git",
            "-C",
            str(repo_dir),
            "config",
            "--file",
            ".gitmodules",
            "--get-regexp",
            r"^submodule\..*\.path$",
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    paths: list[str] = []
    for line in result.stdout.splitlines():
        parts = line.split(None, 1)
        if len(parts) == 2:
            paths.append(parts[1].strip())
    return paths


def _nested_needs_init(repo_dir: Path, rel_path: str) -> bool:
    if not _dir_populated(repo_dir / rel_path):
        return True
    if rel_path == "third_party/git":
        sha1_dir = repo_dir / rel_path / "sha1collisiondetection"
        if not _dir_populated(sha1_dir):
            return True
    return False


def _sync_nested_submodules(target_dir: Path, name: str, force_update: bool) -> None:
    nested_paths = _list_nested_submodules(target_dir)
    if not nested_paths:
        return

    mandatory = [p for p in nested_paths if p not in OPTIONAL_NESTED_SUBMODULES]
    optional = [p for p in nested_paths if p in OPTIONAL_NESTED_SUBMODULES]
    mandatory_pending = mandatory if force_update else [p for p in mandatory if _nested_needs_init(target_dir, p)]
    optional_pending = optional if force_update else [p for p in optional if _nested_needs_init(target_dir, p)]

    if not mandatory_pending and not optional_pending:
        return

    env = _git_env()
    subprocess.run(
        ["git", "-C", str(target_dir), "submodule", "sync", "--recursive"],
        env=env,
        stdin=subprocess.DEVNULL,
        check=True,
    )

    if mandatory_pending:
        print(f"[{name}] Updating nested public submodules ({len(mandatory_pending)})...")
        subprocess.run(
            [
                "git",
                "-C",
                str(target_dir),
                "submodule",
                "update",
                "--init",
                "--recursive",
                "--depth",
                "1",
                "--",
                *mandatory_pending,
            ],
            env=env,
            stdin=subprocess.DEVNULL,
            check=True,
        )

    for opt_path in optional_pending:
        was_populated = _dir_populated(target_dir / opt_path)
        if not force_update and was_populated:
            continue
        # Only attempt optional private submodules when all other submodules were uninitialized
        # or on explicit update, so repeated calls never retry an inaccessible private repo.
        if not force_update and not mandatory_pending:
            continue
        res = subprocess.run(
            [
                "git",
                "-C",
                str(target_dir),
                "submodule",
                "update",
                "--init",
                "--recursive",
                "--depth",
                "1",
                "--",
                opt_path,
            ],
            env=env,
            stdin=subprocess.DEVNULL,
            check=False,
        )
        if res.returncode != 0:
            if not was_populated:
                subprocess.run(
                    ["git", "-C", str(target_dir), "submodule", "deinit", "-f", "--", opt_path],
                    env=env,
                    stdin=subprocess.DEVNULL,
                    capture_output=True,
                    check=False,
                )
            print(
                f"[{name}] Skipping optional private submodule '{opt_path}' "
                "(inaccessible without repository credentials)."
            )


def ensure_repo(
    name: str,
    url: str = "",
    force_update: bool = False,
    local_root: Path | None = None,
) -> Path:
    effective_local = local_root
    if effective_local is None and os.environ.get(LOCAL_REPOS_ENV):
        env_value = os.environ[LOCAL_REPOS_ENV].strip()
        if env_value:
            effective_local = Path(env_value).expanduser()
    if effective_local is not None:
        local_candidate = effective_local / name
        if local_candidate.is_dir():
            print(f"[{name}] Using local repository at {local_candidate}.")
            return local_candidate.resolve()

    target_dir = SUBMODULE_PATHS.get(name, REPOS_DIR / name)
    rel_path = target_dir.relative_to(BASE_DIR).as_posix()

    if force_update or not _dir_populated(target_dir):
        print(f"[{name}] Initializing git submodule at {rel_path}...")
        env = _git_env()
        subprocess.run(
            ["git", "-C", str(BASE_DIR), "submodule", "sync", "--", rel_path],
            env=env,
            stdin=subprocess.DEVNULL,
            check=True,
        )
        subprocess.run(
            [
                "git",
                "-C",
                str(BASE_DIR),
                "submodule",
                "update",
                "--init",
                "--depth",
                "1",
                "--",
                rel_path,
            ],
            env=env,
            stdin=subprocess.DEVNULL,
            check=True,
        )

    _sync_nested_submodules(target_dir, name, force_update=force_update)

    if not _dir_populated(target_dir):
        raise RuntimeError(
            f"Git submodule '{rel_path}' is missing or empty ({url or REPOSITORIES.get(name, '')}). "
            "Run 'git submodule update --init --recursive'."
        )

    print(f"[{name}] Ready at {target_dir} (git submodule).")
    return target_dir
