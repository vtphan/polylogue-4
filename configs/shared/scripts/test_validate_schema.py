#!/usr/bin/env python3
"""Unit tests for validate_schema.py."""

import unittest
from validate_schema import validate


class TestValidateSchema(unittest.TestCase):
    def _schema(self, fields):
        return {"fields": fields}

    def test_required_string_present(self):
        schema = self._schema({"name": {"type": "string", "required": True}})
        errors = validate({"name": "hello"}, schema)
        self.assertEqual(errors, [])

    def test_required_string_missing(self):
        schema = self._schema({"name": {"type": "string", "required": True}})
        errors = validate({}, schema)
        self.assertEqual(len(errors), 1)
        self.assertIn("required", errors[0])

    def test_optional_string_missing(self):
        schema = self._schema({"name": {"type": "string", "required": False}})
        errors = validate({}, schema)
        self.assertEqual(errors, [])

    def test_wrong_type(self):
        schema = self._schema({"count": {"type": "integer", "required": True}})
        errors = validate({"count": "not a number"}, schema)
        self.assertEqual(len(errors), 1)
        self.assertIn("expected integer", errors[0])

    def test_boolean_not_int(self):
        schema = self._schema({"flag": {"type": "boolean", "required": True}})
        errors = validate({"flag": True}, schema)
        self.assertEqual(errors, [])
        errors = validate({"flag": 1}, schema)
        self.assertEqual(len(errors), 1)

    def test_enum_constraint(self):
        schema = self._schema({
            "status": {
                "type": "string",
                "required": True,
                "constraints": {"enum": ["ready", "revise", "rethink"]},
            }
        })
        self.assertEqual(validate({"status": "ready"}, schema), [])
        errors = validate({"status": "invalid"}, schema)
        self.assertEqual(len(errors), 1)
        self.assertIn("not in allowed values", errors[0])

    def test_pattern_constraint(self):
        schema = self._schema({
            "turn_id": {
                "type": "string",
                "required": True,
                "constraints": {"pattern": "turn_\\d{2}"},
            }
        })
        self.assertEqual(validate({"turn_id": "turn_01"}, schema), [])
        errors = validate({"turn_id": "turn_1"}, schema)
        self.assertEqual(len(errors), 1)

    def test_min_max_constraints(self):
        schema = self._schema({
            "phase": {
                "type": "integer",
                "required": True,
                "constraints": {"min": 1, "max": 4},
            }
        })
        self.assertEqual(validate({"phase": 2}, schema), [])
        self.assertEqual(len(validate({"phase": 0}, schema)), 1)
        self.assertEqual(len(validate({"phase": 5}, schema)), 1)

    def test_list_length_constraints(self):
        schema = self._schema({
            "items": {
                "type": "list",
                "required": True,
                "constraints": {"min_length": 2, "max_length": 3},
                "items": {"type": "string"},
            }
        })
        self.assertEqual(validate({"items": ["a", "b"]}, schema), [])
        self.assertEqual(len(validate({"items": ["a"]}, schema)), 1)
        self.assertEqual(len(validate({"items": ["a", "b", "c", "d"]}, schema)), 1)

    def test_nested_object(self):
        schema = self._schema({
            "location": {
                "type": "object",
                "required": True,
                "fields": {
                    "turn": {"type": "string", "required": True},
                    "sentences": {"type": "list", "required": True, "items": {"type": "string"}},
                },
            }
        })
        data = {"location": {"turn": "turn_01", "sentences": ["turn_01.s01"]}}
        self.assertEqual(validate(data, schema), [])

        data_missing = {"location": {"sentences": ["turn_01.s01"]}}
        errors = validate(data_missing, schema)
        self.assertEqual(len(errors), 1)
        self.assertIn("turn", errors[0])

    def test_list_of_objects(self):
        schema = self._schema({
            "turns": {
                "type": "list",
                "required": True,
                "items": {
                    "type": "object",
                    "fields": {
                        "speaker": {"type": "string", "required": True},
                    },
                },
            }
        })
        data = {"turns": [{"speaker": "mia"}, {"speaker": "jaylen"}]}
        self.assertEqual(validate(data, schema), [])

        data_bad = {"turns": [{"speaker": "mia"}, {}]}
        errors = validate(data_bad, schema)
        self.assertEqual(len(errors), 1)

    def test_real_scenario_plan(self):
        """Validate the actual Phase 5 scenario against its schema."""
        import yaml
        import os

        base = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.join(base, "..", "..", "..")

        scenario_path = os.path.join(project_root, "registry", "ocean_plastic_campaign", "scenario.yaml")
        schema_path = os.path.join(project_root, "configs", "scenario", "schemas", "scenario_plan.yaml")

        if not os.path.exists(scenario_path):
            self.skipTest("Phase 5 artifacts not available")

        with open(scenario_path) as f:
            scenario = yaml.safe_load(f)
        with open(schema_path) as f:
            schema = yaml.safe_load(f)

        errors = validate(scenario, schema)
        self.assertEqual(errors, [], f"Validation errors: {errors}")


if __name__ == "__main__":
    unittest.main()
