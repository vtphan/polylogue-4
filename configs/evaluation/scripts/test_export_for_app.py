#!/usr/bin/env python3
"""Unit tests for export_for_app.py."""

import unittest
from export_for_app import extract_student_evaluation, render_cheat_sheet


def make_evaluation():
    return {
        "scenario_id": "test_scenario",
        "annotations": [
            {
                "annotation_id": "ann_01",
                "location": {"turn": "turn_05", "sentences": ["turn_05.s01"]},
                "argument_flaw": {
                    "pattern": "big_claim_little_evidence",
                    "detection_act": "not_enough_support",
                    "explanation": "Test explanation.",
                },
                "thinking_behavior": {
                    "pattern": "confirmation_bias",
                    "explanation": "Test behavior explanation.",
                    "plausible_alternatives": ["echo_chamber", "tunnel_vision"],
                },
                "planned": True,
            }
        ],
        "summary": {
            "total_annotations": 1,
            "target_flaws_surfaced": 1,
            "target_flaws_planned": 1,
        },
        "quality_assessment": {"all_targets_surfaced": True, "issues": []},
        "facilitation_guide": {
            "timing": {
                "phase_1_minutes": 10,
                "phase_2_minutes": 10,
                "phase_3_minutes": 15,
                "phase_4_minutes": 15,
            },
            "what_to_expect": [
                {
                    "flaw": "big_claim_little_evidence",
                    "turns": "turn 5 (Mia)",
                    "signal": "Mia says 'proves'",
                    "difficulty": "most_will_catch",
                }
            ],
            "phase_1": [
                {
                    "prompt": "Re-read turn 5.",
                    "targets": "big_claim_little_evidence",
                }
            ],
            "phase_2": [
                {
                    "flaw": "big_claim_little_evidence",
                    "narrowed_options": [
                        "confirmation_bias",
                        "echo_chamber",
                        "tunnel_vision",
                    ],
                    "perspective_prompt": "Imagine you're Mia.",
                }
            ],
            "phase_4": [
                {"type": "challenge", "prompt": "The AI says..."}
            ],
        },
    }


class TestExtractStudentEvaluation(unittest.TestCase):
    def test_includes_required_fields(self):
        result = extract_student_evaluation(make_evaluation())
        ann = result["annotations"][0]
        self.assertEqual(ann["annotation_id"], "ann_01")
        self.assertEqual(ann["argument_flaw"]["pattern"], "big_claim_little_evidence")
        self.assertEqual(ann["argument_flaw"]["detection_act"], "not_enough_support")
        self.assertIn("explanation", ann["argument_flaw"])
        self.assertEqual(ann["thinking_behavior"]["pattern"], "confirmation_bias")
        self.assertIn("explanation", ann["thinking_behavior"])

    def test_excludes_teacher_fields(self):
        result = extract_student_evaluation(make_evaluation())
        ann = result["annotations"][0]
        self.assertNotIn("planned", ann)
        self.assertNotIn("plausible_alternatives", ann.get("thinking_behavior", {}))

    def test_excludes_top_level_teacher_fields(self):
        result = extract_student_evaluation(make_evaluation())
        self.assertNotIn("summary", result)
        self.assertNotIn("quality_assessment", result)
        self.assertNotIn("facilitation_guide", result)

    def test_preserves_scenario_id(self):
        result = extract_student_evaluation(make_evaluation())
        self.assertEqual(result["scenario_id"], "test_scenario")


class TestRenderCheatSheet(unittest.TestCase):
    def test_contains_timing(self):
        text = render_cheat_sheet(make_evaluation(), {}, {})
        self.assertIn("Phase 1: ~10 min", text)
        self.assertIn("Phase 4: ~15 min", text)

    def test_contains_what_to_expect(self):
        text = render_cheat_sheet(make_evaluation(), {}, {})
        self.assertIn("WHAT TO EXPECT", text)
        self.assertIn("turn 5 (Mia)", text)

    def test_contains_phase_sections(self):
        text = render_cheat_sheet(make_evaluation(), {}, {})
        self.assertIn("PHASE 1:", text)
        self.assertIn("PHASE 2:", text)
        self.assertIn("PHASE 3:", text)
        self.assertIn("PHASE 4:", text)

    def test_phase_3_is_generic(self):
        text = render_cheat_sheet(make_evaluation(), {}, {})
        self.assertIn("same for every scenario", text)

    def test_uses_plain_language_names(self):
        pattern_names = {
            "big_claim_little_evidence": "They're saying a lot based on very little"
        }
        text = render_cheat_sheet(make_evaluation(), pattern_names, {})
        self.assertIn("They're saying a lot based on very little", text)

    def test_real_evaluation(self):
        """Render cheat sheet from actual Phase 5 evaluation."""
        import yaml
        import os

        base = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.join(base, "..", "..", "..")

        eval_path = os.path.join(project_root, "registry", "ocean_plastic_campaign", "evaluation.yaml")
        if not os.path.exists(eval_path):
            self.skipTest("Phase 5 artifacts not available")

        with open(eval_path) as f:
            evaluation = yaml.safe_load(f)

        text = render_cheat_sheet(evaluation, {}, {})
        self.assertIn("FACILITATION CHEAT SHEET", text)
        self.assertIn("PHASE 1:", text)


if __name__ == "__main__":
    unittest.main()
