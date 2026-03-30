#!/usr/bin/env python3
"""Unit tests for enumerate_turns.py."""

import unittest
from enumerate_turns import enumerate_transcript


class TestEnumerateTurns(unittest.TestCase):
    def _make_pre(self, turn_count=3, sentences_per_turn=2):
        return {
            "scenario_id": "test_scenario",
            "personas": [{"persona_id": "a", "name": "A", "role": "Test"}],
            "turns": [
                {
                    "speaker": "a",
                    "sentences": [
                        {"text": f"Turn {t + 1} sentence {s + 1}."}
                        for s in range(sentences_per_turn)
                    ],
                }
                for t in range(turn_count)
            ],
        }

    def test_turn_ids_sequential(self):
        result = enumerate_transcript(self._make_pre(5))
        turn_ids = [t["turn_id"] for t in result["turns"]]
        self.assertEqual(
            turn_ids, ["turn_01", "turn_02", "turn_03", "turn_04", "turn_05"]
        )

    def test_sentence_ids_sequential(self):
        result = enumerate_transcript(self._make_pre(2, 3))
        sent_ids_t1 = [s["id"] for s in result["turns"][0]["sentences"]]
        self.assertEqual(
            sent_ids_t1, ["turn_01.s01", "turn_01.s02", "turn_01.s03"]
        )
        sent_ids_t2 = [s["id"] for s in result["turns"][1]["sentences"]]
        self.assertEqual(
            sent_ids_t2, ["turn_02.s01", "turn_02.s02", "turn_02.s03"]
        )

    def test_preserves_text(self):
        pre = self._make_pre(1, 1)
        pre["turns"][0]["sentences"][0]["text"] = "Hello world."
        result = enumerate_transcript(pre)
        self.assertEqual(result["turns"][0]["sentences"][0]["text"], "Hello world.")

    def test_preserves_speaker(self):
        pre = self._make_pre(1)
        pre["turns"][0]["speaker"] = "mia"
        result = enumerate_transcript(pre)
        self.assertEqual(result["turns"][0]["speaker"], "mia")

    def test_preserves_metadata(self):
        pre = self._make_pre(1)
        pre["scenario_id"] = "my_scenario"
        result = enumerate_transcript(pre)
        self.assertEqual(result["scenario_id"], "my_scenario")
        self.assertEqual(result["personas"], pre["personas"])

    def test_zero_padded(self):
        result = enumerate_transcript(self._make_pre(12))
        self.assertEqual(result["turns"][0]["turn_id"], "turn_01")
        self.assertEqual(result["turns"][8]["turn_id"], "turn_09")
        self.assertEqual(result["turns"][9]["turn_id"], "turn_10")
        self.assertEqual(result["turns"][11]["turn_id"], "turn_12")

    def test_real_artifact(self):
        """Enumerate the actual Phase 5 pre-enumeration transcript."""
        import yaml
        import os

        base = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.join(base, "..", "..", "..")

        pre_path = os.path.join(project_root, "registry", "ocean_plastic_campaign", "script_pre.yaml")
        if not os.path.exists(pre_path):
            self.skipTest("Phase 5 artifacts not available")

        with open(pre_path) as f:
            pre = yaml.safe_load(f)

        result = enumerate_transcript(pre)
        self.assertEqual(len(result["turns"]), 12)
        self.assertEqual(result["turns"][0]["turn_id"], "turn_01")
        self.assertEqual(result["turns"][11]["turn_id"], "turn_12")
        # All sentences should have IDs
        for turn in result["turns"]:
            for sent in turn["sentences"]:
                self.assertIn("id", sent)
                self.assertTrue(sent["id"].startswith(turn["turn_id"]))


if __name__ == "__main__":
    unittest.main()
