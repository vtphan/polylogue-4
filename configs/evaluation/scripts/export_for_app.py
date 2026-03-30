#!/usr/bin/env python3
"""Export student-facing evaluation and facilitation cheat sheet from full evaluation.

Usage:
    python export_for_app.py <evaluation_path> <output_dir> [--detection-act-library <path>]

Produces:
    <output_dir>/evaluation_student.yaml  — annotations stripped of teacher-only fields
    <output_dir>/cheat_sheet.md           — printable facilitation reference

The --detection-act-library flag provides the path to the detection act library
for resolving pattern IDs to plain-language names in the cheat sheet. If omitted,
canonical IDs are used.
"""

import os
import sys
import yaml


def load_yaml(path):
    with open(path, "r") as f:
        return yaml.safe_load(f)


def build_pattern_names(library_path):
    """Build a mapping from pattern_id → plain_language name."""
    if not library_path or not os.path.exists(library_path):
        return {}
    library = load_yaml(library_path)
    names = {}
    for act in library.get("detection_acts", []):
        for pattern in act.get("patterns", []):
            names[pattern["pattern_id"]] = pattern["plain_language"]
    return names


def build_behavior_names(library_path):
    """Build a mapping from behavior_id → plain_language name."""
    if not library_path or not os.path.exists(library_path):
        return {}
    library = load_yaml(library_path)
    names = {}
    for behavior in library.get("thinking_behaviors", []):
        names[behavior["behavior_id"]] = behavior["name"]
    return names


def extract_student_evaluation(evaluation):
    """Strip teacher-only fields from evaluation to produce student-facing version."""
    student_annotations = []
    for ann in evaluation.get("annotations", []):
        student_ann = {
            "annotation_id": ann["annotation_id"],
            "location": ann["location"],
            "argument_flaw": {
                "pattern": ann["argument_flaw"]["pattern"],
                "detection_act": ann["argument_flaw"]["detection_act"],
                "explanation": ann["argument_flaw"]["explanation"],
            },
            "thinking_behavior": {
                "pattern": ann["thinking_behavior"]["pattern"],
                "explanation": ann["thinking_behavior"]["explanation"],
            },
            # Excluded: planned, plausible_alternatives
        }
        student_annotations.append(student_ann)

    return {
        "scenario_id": evaluation["scenario_id"],
        "annotations": student_annotations,
    }


def render_cheat_sheet(evaluation, pattern_names, behavior_names):
    """Render the facilitation cheat sheet as markdown text."""
    guide = evaluation.get("facilitation_guide", {})
    timing = guide.get("timing", {})
    what_to_expect = guide.get("what_to_expect", [])
    phase_1 = guide.get("phase_1", [])
    phase_2 = guide.get("phase_2", [])
    phase_4 = guide.get("phase_4", [])

    topic = evaluation.get("scenario_id", "Unknown").replace("_", " ").title()

    total = (
        timing.get("phase_1_minutes", 0)
        + timing.get("phase_2_minutes", 0)
        + timing.get("phase_3_minutes", 0)
        + timing.get("phase_4_minutes", 0)
    )

    lines = []
    lines.append(f"FACILITATION CHEAT SHEET — {topic}")
    lines.append("")
    lines.append(
        f"TIMING ({total}-min period)\n"
        f"  Phase 1: ~{timing.get('phase_1_minutes', '?')} min  |  "
        f"Phase 2: ~{timing.get('phase_2_minutes', '?')} min  |  "
        f"Phase 3: ~{timing.get('phase_3_minutes', '?')} min  |  "
        f"Phase 4: ~{timing.get('phase_4_minutes', '?')} min"
    )
    lines.append("")

    # What to expect
    lines.append("WHAT TO EXPECT")
    for i, entry in enumerate(what_to_expect, 1):
        flaw_name = pattern_names.get(entry["flaw"], entry["flaw"])
        difficulty_map = {
            "most_will_catch": "Most will catch this.",
            "harder_to_spot": "Harder to spot.",
            "easy_to_miss": "Easy to miss.",
        }
        difficulty = difficulty_map.get(entry.get("difficulty", ""), entry.get("difficulty", ""))
        lines.append(f'  Flaw {i}: "{flaw_name}" — {entry["turns"]}')
        lines.append(f"    Students should notice: {entry['signal']}")
        lines.append(f"    {difficulty}")
        lines.append("")

    # Phase 1
    lines.append("PHASE 1: Student isn't finding flaws")
    for scaffold in phase_1:
        lines.append(f'→ "{scaffold["prompt"]}"')
    lines.append("")

    # Phase 2
    lines.append("PHASE 2: Student found flaw but stuck on thinking behavior")
    for scaffold in phase_2:
        flaw_name = pattern_names.get(scaffold["flaw"], scaffold["flaw"])
        options = [behavior_names.get(opt, opt) for opt in scaffold.get("narrowed_options", [])]
        options_str = " / ".join(f'"{o}"' for o in options)
        lines.append(f'→ For "{flaw_name}": Narrow to {len(options)}: {options_str}')
        lines.append(f'→ "{scaffold["perspective_prompt"]}"')
    lines.append("")

    # Phase 3 (generic)
    lines.append("PHASE 3: Group discussion is stalled [same for every scenario]")
    lines.append('→ "Did you all mark the same turns? Look at where you differ."')
    lines.append('→ "Someone in your group found something you missed. Take another look."')
    lines.append("")

    # Phase 4
    lines.append("PHASE 4: Class isn't engaging with AI perspective")
    for scaffold in phase_4:
        lines.append(f'→ "{scaffold["prompt"]}"')

    return "\n".join(lines) + "\n"


def write_yaml_file(data, path):
    with open(path, "w") as f:
        yaml.dump(
            data,
            f,
            default_flow_style=False,
            allow_unicode=True,
            sort_keys=False,
            width=120,
        )


def main():
    if len(sys.argv) < 3:
        print(
            f"Usage: {sys.argv[0]} <evaluation_path> <output_dir> "
            f"[--detection-act-library <path>] [--thinking-behavior-library <path>]"
        )
        sys.exit(2)

    evaluation_path = sys.argv[1]
    output_dir = sys.argv[2]

    detection_lib_path = None
    behavior_lib_path = None
    i = 3
    while i < len(sys.argv):
        if sys.argv[i] == "--detection-act-library" and i + 1 < len(sys.argv):
            detection_lib_path = sys.argv[i + 1]
            i += 2
        elif sys.argv[i] == "--thinking-behavior-library" and i + 1 < len(sys.argv):
            behavior_lib_path = sys.argv[i + 1]
            i += 2
        else:
            i += 1

    evaluation = load_yaml(evaluation_path)
    pattern_names = build_pattern_names(detection_lib_path)
    behavior_names = build_behavior_names(behavior_lib_path)

    # Export student evaluation
    student_eval = extract_student_evaluation(evaluation)
    student_path = os.path.join(output_dir, "evaluation_student.yaml")
    write_yaml_file(student_eval, student_path)
    print(f"[DONE] Student evaluation → {student_path}")

    # Render cheat sheet
    cheat_sheet = render_cheat_sheet(evaluation, pattern_names, behavior_names)
    cheat_path = os.path.join(output_dir, "cheat_sheet.md")
    with open(cheat_path, "w") as f:
        f.write(cheat_sheet)
    print(f"[DONE] Cheat sheet → {cheat_path}")


if __name__ == "__main__":
    main()
