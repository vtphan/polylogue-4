#!/usr/bin/env python3
"""Assign sequential IDs to turns and sentences in a pre-enumeration transcript.

Usage:
    python enumerate_turns.py <input_path> <output_path>

Transforms:
    Pre-enumeration format (no IDs) → Post-enumeration format (with IDs)

    turn_id: turn_01, turn_02, ...
    sentence id: turn_01.s01, turn_01.s02, ...
"""

import sys
import yaml


def load_yaml(path):
    with open(path, "r") as f:
        return yaml.safe_load(f)


def enumerate_transcript(transcript):
    """Add turn_id and sentence id fields to a pre-enumeration transcript."""
    result = {
        "scenario_id": transcript["scenario_id"],
        "personas": transcript["personas"],
        "turns": [],
    }

    for turn_idx, turn in enumerate(transcript.get("turns", []), start=1):
        turn_id = f"turn_{turn_idx:02d}"
        enumerated_turn = {
            "turn_id": turn_id,
            "speaker": turn["speaker"],
            "sentences": [],
        }

        for sent_idx, sentence in enumerate(
            turn.get("sentences", []), start=1
        ):
            sent_id = f"{turn_id}.s{sent_idx:02d}"
            enumerated_turn["sentences"].append(
                {"id": sent_id, "text": sentence["text"]}
            )

        result["turns"].append(enumerated_turn)

    return result


def write_yaml(data, path):
    """Write data as YAML with readable formatting."""

    class QuotedStr(str):
        pass

    def quoted_str_representer(dumper, data):
        return dumper.represent_scalar("tag:yaml.org,2002:str", data, style='"')

    dumper = yaml.Dumper
    dumper.add_representer(QuotedStr, quoted_str_representer)

    # Quote text fields and IDs for readability
    def quote_strings(obj):
        if isinstance(obj, dict):
            result = {}
            for k, v in obj.items():
                if k in ("text", "id", "turn_id", "scenario_id", "name", "role", "persona_id"):
                    result[k] = QuotedStr(v) if isinstance(v, str) else v
                else:
                    result[k] = quote_strings(v)
            return result
        elif isinstance(obj, list):
            return [quote_strings(item) for item in obj]
        return obj

    quoted_data = quote_strings(data)

    with open(path, "w") as f:
        yaml.dump(
            quoted_data,
            f,
            Dumper=dumper,
            default_flow_style=False,
            allow_unicode=True,
            sort_keys=False,
            width=120,
        )


def main():
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <input_path> <output_path>")
        sys.exit(2)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    transcript = load_yaml(input_path)
    enumerated = enumerate_transcript(transcript)
    write_yaml(enumerated, output_path)

    turn_count = len(enumerated["turns"])
    sent_count = sum(len(t["sentences"]) for t in enumerated["turns"])
    print(
        f"[DONE] Enumerated {turn_count} turns, {sent_count} sentences → {output_path}"
    )


if __name__ == "__main__":
    main()
