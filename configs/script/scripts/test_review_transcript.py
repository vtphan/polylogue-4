#!/usr/bin/env python3
"""Unit tests for review_transcript.py."""

import unittest
from review_transcript import review


def make_scenario(speakers=None, turn_count=12):
    """Build a minimal scenario plan for testing."""
    if speakers is None:
        speakers = ["mia", "jaylen"] * (turn_count // 2)
        speakers = speakers[:turn_count]
    return {
        "personas": [
            {"persona_id": "mia", "name": "Mia"},
            {"persona_id": "jaylen", "name": "Jaylen"},
        ],
        "turn_outline": [
            {"turn": i + 1, "speaker": s} for i, s in enumerate(speakers)
        ],
    }


def make_transcript(speakers=None, turn_count=12):
    """Build a minimal pre-enumeration transcript for testing."""
    if speakers is None:
        speakers = ["mia", "jaylen"] * (turn_count // 2)
        speakers = speakers[:turn_count]
    return {
        "turns": [
            {"speaker": s, "sentences": [{"text": f"Turn {i + 1} text."}]}
            for i, s in enumerate(speakers)
        ]
    }


class TestReviewTranscript(unittest.TestCase):
    def test_pass(self):
        speakers = ["mia", "jaylen"] * 6
        issues = review(make_transcript(speakers), make_scenario(speakers))
        self.assertEqual(issues, [])

    def test_turn_count_too_low(self):
        speakers = ["mia", "jaylen"] * 5  # 10 turns
        issues = review(make_transcript(speakers), make_scenario(speakers))
        self.assertTrue(any("too low" in i for i in issues))

    def test_turn_count_too_high(self):
        speakers = ["mia", "jaylen"] * 9  # 18 turns
        issues = review(make_transcript(speakers), make_scenario(speakers))
        self.assertTrue(any("too high" in i for i in issues))

    def test_invalid_speaker(self):
        speakers = ["mia", "jaylen"] * 6
        transcript = make_transcript(speakers)
        transcript["turns"][3]["speaker"] = "unknown_persona"
        issues = review(transcript, make_scenario(speakers))
        self.assertTrue(any("unknown_persona" in i for i in issues))

    def test_wrong_speaker_order(self):
        plan_speakers = ["mia", "jaylen"] * 6
        actual_speakers = ["jaylen", "mia"] * 6  # swapped
        issues = review(make_transcript(actual_speakers), make_scenario(plan_speakers))
        self.assertTrue(any("expected speaker" in i for i in issues))

    def test_missing_turns(self):
        plan_speakers = ["mia", "jaylen"] * 6  # 12
        actual_speakers = ["mia", "jaylen"] * 5  # 10
        issues = review(make_transcript(actual_speakers), make_scenario(plan_speakers))
        self.assertTrue(any("Missing" in i for i in issues))

    def test_empty_sentences(self):
        speakers = ["mia", "jaylen"] * 6
        transcript = make_transcript(speakers)
        transcript["turns"][5]["sentences"] = []
        issues = review(transcript, make_scenario(speakers))
        self.assertTrue(any("no sentences" in i for i in issues))

    def test_real_artifacts(self):
        """Review the actual Phase 5 transcript."""
        import yaml
        import os

        base = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.join(base, "..", "..", "..")

        transcript_path = os.path.join(project_root, "registry", "ocean_plastic_campaign", "script_pre.yaml")
        scenario_path = os.path.join(project_root, "registry", "ocean_plastic_campaign", "scenario.yaml")

        if not os.path.exists(transcript_path):
            self.skipTest("Phase 5 artifacts not available")

        with open(transcript_path) as f:
            transcript = yaml.safe_load(f)
        with open(scenario_path) as f:
            scenario = yaml.safe_load(f)

        issues = review(transcript, scenario)
        self.assertEqual(issues, [], f"Review issues: {issues}")


if __name__ == "__main__":
    unittest.main()
