#!/usr/bin/env python3
"""Build and verify deterministic offline content packs for Mylingo."""
from __future__ import annotations

import io
import json
import os
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"]
PACK_VERSION = 1

# Fixed timestamp (the classic ZIP epoch) for the synthetic PACK_MANIFEST.json
# entry written into every pack ZIP. zipfile.ZipFile.writestr(name, data), when
# given a bare filename instead of a ZipInfo, stamps the entry with the
# current wall-clock time — the one place offline pack generation embedded a
# build-time clock, silently breaking byte-for-byte reproducibility between
# runs (every other entry's timestamp already comes from its source file's
# mtime via ZipInfo.from_file). Same value both builders below.
_ZIP_EPOCH = (1980, 1, 1, 0, 0, 0)

CORE_FILES = [
    "index.html",
    "sw.js",
    "manifest.json",
    "main/index.html",
    "a1/index.html",
    "a1/dashboard.html",
    "a1/quizzes.json",
    "a2/index.html",
    "a2/dashboard.html",
    "a2/quizzes.json",
    "b1/index.html",
    "b1/dashboard.html",
    "b1/quizzes.json",
    "b2/index.html",
    "b2/dashboard.html",
    "b2/quizzes.json",
    "c1/index.html",
    "c1/dashboard.html",
    "c1/quizzes.json",
    "c2/index.html",
    "c2/dashboard.html",
    "c2/quizzes.json",
    "shared/quiz.html",
    "shared/js/gamification.js",
    "shared/js/orientation.js",
    "shared/js/placement.js",
    "shared/js/recommendations.js",
    "shared/js/skill-mastery.js",
    "shared/js/review-scheduler.js",
    "shared/js/runtime-v2-adapter.js",
    "shared/js/offline-packs.js",
    "shared/js/offline-packs-ui.js",
    "placement/index.json",
    "placement/a1/placement-001.json",
    "placement/a2/placement-001.json",
    "placement/b1/placement-001.json",
    "placement/b2/placement-001.json",
    "placement/c1/placement-001.json",
    "placement/c2/placement-001.json",
    "main/placement.html",
    "shared/js/course-progress.js",
    "courses/index.html",
    "courses/course.html",
    "courses/lesson.html",
    "courses/journey.html",
    "course_content/courses.json",
    "course_content/units.json",
    "course_content/lessons.json",
    "shared/brand/icon.svg",
    "shared/brand/logo-horizontal.svg",
    "shared/brand/logo-stacked.svg",
    "shared/brand/favicon.ico",
    "shared/brand/favicon-32.png",
    "shared/brand/favicon-192.png",
    "shared/brand/favicon-512.png",
    "shared/brand/apple-touch-icon.png",
    "shared/sfx/correct.mp3",
    "shared/sfx/wrong_answer.mp3",
    "shared/sfx/win.mp3",
    "shared/sfx/great_job.mp3",
    "shared/sfx/try_again_2.mp3",
    "offline/packs.json",
    "offline/core-manifest.json",
]


def norm(path: str) -> str:
    return path.replace(os.sep, "/").lstrip("./")


def existing_files(site_root: Path, files: list[str]) -> list[str]:
    return [p for p in (norm(f) for f in files) if (site_root / p).is_file()]


def _write_bytes_if_changed(path: Path, data: bytes) -> bool:
    """Write `data` to `path` only when it differs from what's already
    there. Returns True if a write actually happened (new file or changed
    content), False if the existing file was already byte-identical and
    the write was skipped.

    Mirrors build.py's `_write_text_if_changed` (Agent 57), extended here
    to cover offline pack ZIPs too. This only pays off because Agent 57
    already made quiz JSON/manifest writes skip-if-unchanged: those files'
    mtimes now stay stable across no-op rebuilds, which is what lets the
    ZIP bytes below (whose entries embed each source file's mtime) come
    out byte-identical run over run instead of just structurally
    equivalent."""
    try:
        if path.read_bytes() == data:
            return False
    except FileNotFoundError:
        pass
    path.write_bytes(data)
    return True


def write_core_manifest(site_root: str | os.PathLike[str], stats: dict | None = None) -> Path:
    root = Path(site_root)
    missing = [rel for rel in CORE_FILES if not (root / rel).is_file() and rel not in {"offline/packs.json", "offline/core-manifest.json"}]
    if missing:
        raise FileNotFoundError("core manifest missing required runtime assets: " + ", ".join(missing))
    manifest_dir = root / "offline"
    manifest_dir.mkdir(parents=True, exist_ok=True)
    path = manifest_dir / "core-manifest.json"
    text = json.dumps({
        "schema": "mylingo.offline-core.v1",
        "files": sorted(set(CORE_FILES)),
    }, indent=2, ensure_ascii=False) + "\n"
    changed = _write_bytes_if_changed(path, text.encode("utf-8"))
    if stats is not None:
        stats["written" if changed else "unchanged"] = stats.get("written" if changed else "unchanged", 0) + 1
    return path


def build_pack_records(site_root: str | os.PathLike[str]) -> list[dict]:
    root = Path(site_root)
    records = []
    core = sorted(set(CORE_FILES))
    records.append({"id": "core", "type": "core", "label": "Mylingo core", "dependencies": [], "files": core})

    for level in LEVELS:
        manifest_rel = f"{level.lower()}/quizzes.json"
        files = existing_files(root, [f"{level.lower()}/index.html", f"{level.lower()}/dashboard.html", manifest_rel])
        if (root / manifest_rel).is_file():
            try:
                manifest = json.loads((root / manifest_rel).read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                manifest = []
            for entry in manifest if isinstance(manifest, list) else []:
                rel = entry.get("file") if isinstance(entry, dict) else None
                if isinstance(rel, str) and rel.strip():
                    files.append(norm(rel))
        records.append({
            "id": level.lower(),
            "type": "level",
            "label": f"{level} offline content",
            "level": level,
            "dependencies": ["core"],
            "files": sorted(set(existing_files(root, files))),
        })
    return records


def write_offline_packs(
    site_root: str | os.PathLike[str], stats: dict | None = None
) -> tuple[Path, list[dict]]:
    """Write offline/packs.json, offline/core-manifest.json, and each
    pack's ZIP — skipping the disk write for any of those whose content is
    already byte-identical (incremental build, same approach as Agent 57's
    `build_site`). Each ZIP is assembled in memory first (`io.BytesIO`) so
    the comparison is a single all-or-nothing byte check against the
    existing file, with no partial/half-written ZIP ever hitting disk.

    Return contract is unchanged: `(index_path, records)`, same `records`
    content as before. Pass a dict as `stats` (optional, back-compatible —
    existing 1-arg callers are unaffected) to receive
    {'written': N, 'unchanged': N} across all offline artifacts (core
    manifest + packs.json + every pack ZIP)."""
    root = Path(site_root)
    offline = root / "offline"
    packs_dir = offline / "packs"
    packs_dir.mkdir(parents=True, exist_ok=True)
    counts = {"written": 0, "unchanged": 0}

    write_core_manifest(root, stats=counts)
    records = build_pack_records(root)
    index = {
        "schema": "mylingo.offline-packs.v1",
        "version": PACK_VERSION,
        "default_install": ["core"],
        "packs": records,
    }
    index_path = offline / "packs.json"
    index_text = json.dumps(index, indent=2, ensure_ascii=False) + "\n"
    if _write_bytes_if_changed(index_path, index_text.encode("utf-8")):
        counts["written"] += 1
    else:
        counts["unchanged"] += 1

    for record in records:
        zip_path = packs_dir / f"{record['id']}.zip"
        buf = io.BytesIO()
        with ZipFile(buf, "w", compression=ZIP_DEFLATED, compresslevel=9) as zf:
            for rel in record["files"]:
                src = root / rel
                if src.is_file():
                    zf.write(src, arcname=rel)
            manifest_info = ZipInfo("PACK_MANIFEST.json", date_time=_ZIP_EPOCH)
            manifest_info.compress_type = ZIP_DEFLATED
            zf.writestr(manifest_info, json.dumps({
                "schema": index["schema"],
                "version": PACK_VERSION,
                "id": record["id"],
                "dependencies": record.get("dependencies", []),
                "files": record["files"],
            }, indent=2, ensure_ascii=False) + "\n")
        if _write_bytes_if_changed(zip_path, buf.getvalue()):
            counts["written"] += 1
        else:
            counts["unchanged"] += 1

    if stats is not None:
        stats.update(counts)
    return index_path, records


def verify_offline_packs(site_root: str | os.PathLike[str]) -> tuple[list[str], list[str]]:
    root = Path(site_root)
    errors: list[str] = []
    warnings: list[str] = []
    index_path = root / "offline/packs.json"
    if not index_path.is_file():
        return ["offline: missing offline/packs.json"], []
    try:
        index = json.loads(index_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return [f"offline: packs.json is invalid JSON ({exc})"], []
    if index.get("schema") != "mylingo.offline-packs.v1" or index.get("version") != PACK_VERSION:
        errors.append("offline: unsupported packs schema/version")
    packs = index.get("packs")
    if not isinstance(packs, list) or not packs:
        return errors + ["offline: packs array is missing or empty"], warnings

    core_manifest_path = root / "offline" / "core-manifest.json"
    if not core_manifest_path.is_file():
        errors.append("offline: missing offline/core-manifest.json")
    else:
        try:
            core_manifest = json.loads(core_manifest_path.read_text(encoding="utf-8"))
            manifest_files = core_manifest.get("files")
            if core_manifest.get("schema") != "mylingo.offline-core.v1" or not isinstance(manifest_files, list):
                errors.append("offline: core-manifest.json is invalid")
            elif sorted(set(manifest_files)) != sorted(set(CORE_FILES)):
                errors.append("offline: core-manifest.json does not match canonical CORE_FILES")
        except (OSError, json.JSONDecodeError) as exc:
            errors.append(f"offline: core-manifest.json is invalid JSON ({exc})")

    ids = set()
    for pack in packs:
        pid = pack.get("id") if isinstance(pack, dict) else None
        files = pack.get("files") if isinstance(pack, dict) else None
        if not pid or pid in ids:
            errors.append(f"offline: invalid or duplicate pack id {pid!r}")
            continue
        ids.add(pid)
        if not isinstance(files, list) or not files:
            errors.append(f"offline/{pid}: pack has no files")
            continue
        for rel in files:
            if not isinstance(rel, str) or not rel:
                errors.append(f"offline/{pid}: invalid file entry {rel!r}")
                continue
            if not (root / norm(rel)).is_file():
                errors.append(f"offline/{pid}: missing asset {rel}")
        zip_path = root / "offline" / "packs" / f"{pid}.zip"
        if not zip_path.is_file():
            errors.append(f"offline/{pid}: missing ZIP artifact {zip_path}")
            continue
        try:
            with ZipFile(zip_path) as zf:
                names = set(zf.namelist())
                zip_manifest = json.loads(zf.read("PACK_MANIFEST.json")) if "PACK_MANIFEST.json" in names else None
            payload_names = names - {"PACK_MANIFEST.json"}
            missing = [rel for rel in files if rel not in names]
            extra = sorted(payload_names - set(files))
            if missing:
                errors.append(f"offline/{pid}: ZIP missing {len(missing)} listed asset(s)")
            if extra:
                errors.append(f"offline/{pid}: ZIP contains {len(extra)} unlisted asset(s): {', '.join(extra[:5])}")
            if "PACK_MANIFEST.json" not in names:
                errors.append(f"offline/{pid}: ZIP missing PACK_MANIFEST.json")
            elif (zip_manifest.get("schema") != index.get("schema") or
                  zip_manifest.get("version") != index.get("version") or
                  zip_manifest.get("id") != pid or
                  zip_manifest.get("dependencies", []) != pack.get("dependencies", []) or
                  zip_manifest.get("files") != files):
                errors.append(f"offline/{pid}: ZIP manifest does not match pack index")
            if pid == "core" and payload_names != set(CORE_FILES):
                errors.append("offline/core: ZIP contents do not exactly match canonical core manifest")
        except Exception as exc:
            errors.append(f"offline/{pid}: ZIP is unreadable ({exc})")
    for pack in packs:
        if not isinstance(pack, dict):
            continue
        pid = pack.get("id")
        deps = pack.get("dependencies", [])
        if not isinstance(deps, list) or any(not isinstance(dep, str) or not dep for dep in deps):
            errors.append(f"offline/{pid}: dependencies must be a list of non-empty ids")
            continue
        if pid == "core" and deps:
            errors.append("offline/core: core pack cannot depend on another pack")
        for dep in deps:
            if dep == pid:
                errors.append(f"offline/{pid}: pack cannot depend on itself")
            elif dep not in ids:
                errors.append(f"offline/{pid}: missing dependency pack {dep!r}")

    graph = {pack.get("id"): pack.get("dependencies", []) for pack in packs if isinstance(pack, dict) and pack.get("id")}
    visiting, visited = set(), set()
    def visit(pid):
        if pid in visiting:
            return True
        if pid in visited or pid not in graph:
            return False
        visiting.add(pid)
        cyclic = any(visit(dep) for dep in graph[pid])
        visiting.remove(pid)
        visited.add(pid)
        return cyclic
    for pid in graph:
        if visit(pid):
            errors.append("offline: dependency graph contains a cycle")
            break

    return errors, warnings
