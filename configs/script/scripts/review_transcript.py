#!/usr/bin/env python3
"""Structural review of a pre-enumeration transcript against a scenario plan.

Usage:
    python review_transcript.py <transcript_path> <scenario_path>

Checks:
    1. Turn count matches the plan's outline (and does not exceed 20)
    2. All speaker names match persona_ids from the plan
    3. Turn order follows the plan's speaker sequence
    4. All planned turns are present

Exit codes:
    0 — all checks pass
    1 — one or more checks fail
"""

import sys
import yaml


def load_yaml(path):
    with open(path, "r") as f:
        return yaml.safe_load(f)


def review(transcript, scenario):
    """Review transcript structure against scenario plan. Returns list of issues."""
    issues = []

    turns = transcript.get("turns", [])
    plan_outline = scenario.get("turn_outline", [])
    personas = {p["persona_id"] for p in scenario.get("personas", [])}

    # 1. Turn count matches plan and respects cap
    turn_count = len(turns)
    expected_count = len(plan_outline)
    if turn_count > 20:
        issues.append(f"Turn count {turn_count} exceeds maximum of 20")

    # 2. Speaker names match persona_ids
    for i, turn in enumerate(turns):
        speaker = turn.get("speaker", "")
        if speaker not in personas:
            issues.append(
                f"Turn {i + 1}: speaker '{speaker}' is not a valid persona_id. "
                f"Valid: {sorted(personas)}"
            )

    # 3. Turn order follows plan's speaker sequence
    plan_speakers = [t["speaker"] for t in plan_outline]
    actual_speakers = [t.get("speaker", "") for t in turns]

    min_len = min(len(plan_speakers), len(actual_speakers))
    for i in range(min_len):
        if plan_speakers[i] != actual_speakers[i]:
            issues.append(
                f"Turn {i + 1}: expected speaker '{plan_speakers[i]}', "
                f"got '{actual_speakers[i]}'"
            )

    # 4. All planned turns present
    if len(actual_speakers) < len(plan_speakers):
        missing = len(plan_speakers) - len(actual_speakers)
        issues.append(f"Missing {missing} planned turn(s) at end of transcript")
    elif len(actual_speakers) > len(plan_speakers):
        extra = len(actual_speakers) - len(plan_speakers)
        issues.append(f"Transcript has {extra} extra turn(s) beyond plan")

    # 5. Each turn has at least one sentence
    for i, turn in enumerate(turns):
        sentences = turn.get("sentences", [])
        if not sentences:
            issues.append(f"Turn {i + 1}: no sentences")

    return issues


def main():
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <transcript_path> <scenario_path>")
        sys.exit(2)

    transcript = load_yaml(sys.argv[1])
    scenario = load_yaml(sys.argv[2])

    issues = review(transcript, scenario)

    if issues:
        print(f"[FAIL] Structural review of {sys.argv[1]}:")
        for issue in issues:
            print(f"  - {issue}")
        print(f"\n{len(issues)} issue(s) found.")
        sys.exit(1)
    else:
        print(f"[PASS] {sys.argv[1]} passes structural review")


if __name__ == "__main__":
    main()
