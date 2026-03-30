#!/usr/bin/env python3
"""Unit tests for sync_configs.py."""

import os
import shutil
import tempfile
import unittest
import yaml
from sync_configs import sync


class TestSyncConfigs(unittest.TestCase):
    def setUp(self):
        """Create a temporary project structure for testing."""
        self.tmpdir = tempfile.mkdtemp()

        # Create configs structure
        os.makedirs(os.path.join(self.tmpdir, "configs", "scenario", "commands"))
        os.makedirs(os.path.join(self.tmpdir, "configs", "scenario", "agents"))
        os.makedirs(os.path.join(self.tmpdir, "configs", "reference"))
        os.makedirs(os.path.join(self.tmpdir, ".claude"))

        # Write test command and agent
        with open(os.path.join(self.tmpdir, "configs", "scenario", "commands", "test_cmd.md"), "w") as f:
            f.write("# Test command")
        with open(os.path.join(self.tmpdir, "configs", "scenario", "agents", "test_agent.md"), "w") as f:
            f.write("# Test agent")

        # Write reference libraries
        detection_acts = {
            "detection_acts": [
                {"act_id": f"act_{i}", "patterns": [{"pattern_id": f"p_{j}"} for j in range(counts)]}
                for i, counts in enumerate([3, 5, 4, 3, 4])
            ]
        }
        with open(os.path.join(self.tmpdir, "configs", "reference", "detection_act_library.yaml"), "w") as f:
            yaml.dump(detection_acts, f)

        behaviors = {
            "thinking_behaviors": [{"behavior_id": f"b_{i}"} for i in range(8)]
        }
        with open(os.path.join(self.tmpdir, "configs", "reference", "thinking_behavior_library.yaml"), "w") as f:
            yaml.dump(behaviors, f)

    def tearDown(self):
        shutil.rmtree(self.tmpdir)

    def test_copies_commands(self):
        copied, issues = sync(self.tmpdir)
        dest = os.path.join(self.tmpdir, ".claude", "commands", "test_cmd.md")
        self.assertTrue(os.path.exists(dest))
        self.assertTrue(any("command: test_cmd.md" in c for c in copied))

    def test_copies_agents(self):
        copied, issues = sync(self.tmpdir)
        dest = os.path.join(self.tmpdir, ".claude", "agents", "test_agent.md")
        self.assertTrue(os.path.exists(dest))
        self.assertTrue(any("agent: test_agent.md" in c for c in copied))

    def test_no_issues_with_valid_structure(self):
        copied, issues = sync(self.tmpdir)
        self.assertEqual(issues, [])

    def test_missing_detection_library(self):
        os.remove(os.path.join(self.tmpdir, "configs", "reference", "detection_act_library.yaml"))
        copied, issues = sync(self.tmpdir)
        self.assertTrue(any("detection_act_library" in i for i in issues))

    def test_missing_behavior_library(self):
        os.remove(os.path.join(self.tmpdir, "configs", "reference", "thinking_behavior_library.yaml"))
        copied, issues = sync(self.tmpdir)
        self.assertTrue(any("thinking_behavior_library" in i for i in issues))

    def test_wrong_pattern_count(self):
        # Write library with wrong count
        detection_acts = {
            "detection_acts": [
                {"act_id": "act_0", "patterns": [{"pattern_id": "p_0"}]}
            ]
        }
        with open(os.path.join(self.tmpdir, "configs", "reference", "detection_act_library.yaml"), "w") as f:
            yaml.dump(detection_acts, f)
        copied, issues = sync(self.tmpdir)
        self.assertTrue(any("acts" in i or "patterns" in i for i in issues))

    def test_creates_registry(self):
        sync(self.tmpdir)
        self.assertTrue(os.path.exists(os.path.join(self.tmpdir, "registry")))


if __name__ == "__main__":
    unittest.main()
