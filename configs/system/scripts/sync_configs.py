#!/usr/bin/env python3
"""Sync commands and agents from configs/ to .claude/ directories.

Usage:
    python sync_configs.py [--project-root <path>]

    If --project-root is not specified, uses the current working directory.

What it does:
    1. Copies commands from configs/*/commands/*.md to .claude/commands/
    2. Copies agents from configs/*/agents/*.md to .claude/agents/
    3. Verifies reference libraries exist
    4. Reports what was copied and any issues
"""

import glob
import os
import shutil
import sys
import yaml


def find_project_root(args):
    for i, arg in enumerate(args):
        if arg == "--project-root" and i + 1 < len(args):
            return args[i + 1]
    return os.getcwd()


def sync(project_root):
    """Sync configs to .claude/ directories. Returns (copied, issues) lists."""
    copied = []
    issues = []

    configs_dir = os.path.join(project_root, "configs")
    claude_dir = os.path.join(project_root, ".claude")

    commands_dest = os.path.join(claude_dir, "commands")
    agents_dest = os.path.join(claude_dir, "agents")

    os.makedirs(commands_dest, exist_ok=True)
    os.makedirs(agents_dest, exist_ok=True)

    # Copy commands
    command_files = glob.glob(os.path.join(configs_dir, "*/commands/*.md"))
    for src in command_files:
        filename = os.path.basename(src)
        dest = os.path.join(commands_dest, filename)
        shutil.copy2(src, dest)
        copied.append(f"command: {filename}")

    # Copy agents
    agent_files = glob.glob(os.path.join(configs_dir, "*/agents/*.md"))
    for src in agent_files:
        filename = os.path.basename(src)
        dest = os.path.join(agents_dest, filename)
        shutil.copy2(src, dest)
        copied.append(f"agent: {filename}")

    # Verify reference libraries
    ref_dir = os.path.join(configs_dir, "reference")
    detection_lib = os.path.join(ref_dir, "detection_act_library.yaml")
    behavior_lib = os.path.join(ref_dir, "thinking_behavior_library.yaml")

    for lib_path, lib_name in [
        (detection_lib, "detection_act_library.yaml"),
        (behavior_lib, "thinking_behavior_library.yaml"),
    ]:
        if not os.path.exists(lib_path):
            issues.append(f"Missing reference library: {lib_name}")
        else:
            data = yaml.safe_load(open(lib_path, "r"))
            if not data:
                issues.append(f"Reference library is empty: {lib_name}")

    # Verify detection act library has 5 acts with 19 patterns
    if os.path.exists(detection_lib):
        data = yaml.safe_load(open(detection_lib, "r"))
        acts = data.get("detection_acts", [])
        if len(acts) != 5:
            issues.append(
                f"Detection act library has {len(acts)} acts, expected 5"
            )
        pattern_count = sum(len(a.get("patterns", [])) for a in acts)
        if pattern_count != 19:
            issues.append(
                f"Detection act library has {pattern_count} patterns, expected 19"
            )

    # Verify thinking behavior library has 8 behaviors
    if os.path.exists(behavior_lib):
        data = yaml.safe_load(open(behavior_lib, "r"))
        behaviors = data.get("thinking_behaviors", [])
        if len(behaviors) != 8:
            issues.append(
                f"Thinking behavior library has {len(behaviors)} behaviors, expected 8"
            )

    # Verify registry directory
    registry_dir = os.path.join(project_root, "registry")
    if not os.path.exists(registry_dir):
        os.makedirs(registry_dir)
        copied.append("created: registry/")

    return copied, issues


def main():
    project_root = find_project_root(sys.argv[1:])

    copied, issues = sync(project_root)

    print(f"[SYNC] Project root: {project_root}")
    print(f"\nCopied {len(copied)} file(s):")
    for item in sorted(copied):
        print(f"  ✓ {item}")

    if issues:
        print(f"\n{len(issues)} issue(s):")
        for issue in issues:
            print(f"  ✗ {issue}")
        sys.exit(1)
    else:
        print("\nAll checks passed.")


if __name__ == "__main__":
    main()
