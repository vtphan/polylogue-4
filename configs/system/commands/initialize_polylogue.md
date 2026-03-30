# /initialize_polylogue

One-time system setup. Prepares the Claude Code environment for running the pipeline.

## What This Command Does

1. Copies slash commands from `configs/` to `.claude/commands/`
2. Copies subagent definitions from `configs/` to `.claude/agents/`
3. Verifies the directory structure exists
4. Verifies reference libraries are in place

## Steps

### Step 1: Run sync script (or sync manually)

If `configs/system/scripts/sync_configs.py` exists, run it:

```bash
python configs/system/scripts/sync_configs.py
```

If the script is not available, sync manually:

```bash
# Copy commands
cp configs/scenario/commands/create_scenario.md .claude/commands/
cp configs/script/commands/create_script.md .claude/commands/
cp configs/evaluation/commands/evaluate_script.md .claude/commands/

# Copy agents
cp configs/scenario/agents/learning_scientist.md .claude/agents/
cp configs/script/agents/dialog_writer.md .claude/agents/
cp configs/script/agents/instructional_designer.md .claude/agents/
cp configs/evaluation/agents/evaluator.md .claude/agents/
```

### Step 2: Verify directory structure

Confirm these directories exist (create if missing):

```bash
mkdir -p registry
mkdir -p .claude/commands
mkdir -p .claude/agents
```

### Step 3: Verify reference libraries

Confirm these files exist and are non-empty:

- `configs/reference/detection_act_library.yaml` — should contain 5 detection acts with 19 total patterns
- `configs/reference/thinking_behavior_library.yaml` — should contain 8 thinking behaviors

Read each file and verify:
- Detection act library has acts: `somethings_wrong`, `not_enough_support`, `somethings_missing`, `doesnt_fit_together`, `not_really_resolved`
- Thinking behavior library has behaviors: `confirmation_bias`, `anchoring_bias`, `emotional_reasoning`, `black_and_white_thinking`, `groupthink`, `overreliance_on_authority`, `echo_chamber`, `tunnel_vision`

### Step 4: Report

Report what was copied and verified. Flag any missing files or directories.

## When to Run

- Once after cloning the repo
- After adding or changing commands or subagents in `configs/`

## Bootstrap Note

Since this command is itself a slash command, it must be manually copied first:

```bash
cp configs/system/commands/initialize_polylogue.md .claude/commands/
```

Then run `/initialize_polylogue` to sync everything else.

## What's Next

After initialization, you're ready to generate scenarios. Run:

```
/create_scenario
```

Provide a topic, context, instructional goals, and target flaw-behavior combinations. See `docs/scenario-sequence.md` for ready-to-use prompts with a designed progression from easy to hard.
