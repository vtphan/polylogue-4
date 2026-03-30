#!/usr/bin/env python3
"""Validate a YAML artifact against a Polylogue 4 descriptive schema.

Usage:
    python validate_schema.py <artifact_path> <schema_path> [--strict]

Modes:
    --strict    Halt on first violation (exit code 1)
    (default)   Warn mode — log violations but continue (exit code 0)

Schema format (descriptive YAML):
    Each schema has a top-level `fields` mapping. Each field has:
        type: string | integer | boolean | timestamp | list | object
        required: true | false
        description: human-readable description
        items: (for lists) nested field definition
        fields: (for objects) nested field mapping
        constraints:
            enum: [list of valid values]
            pattern: regex pattern
            min: minimum numeric value
            max: maximum numeric value
            min_length: minimum list length
            max_length: maximum list length
"""

import re
import sys
import yaml


def load_yaml(path):
    with open(path, "r") as f:
        return yaml.safe_load(f)


def validate_field(value, field_name, field_def, path, errors):
    """Validate a single field value against its definition."""
    field_type = field_def.get("type")
    required = field_def.get("required", False)
    constraints = field_def.get("constraints", {})

    # Check required
    if value is None:
        if required:
            errors.append(f"{path}: required field '{field_name}' is missing or null")
        return

    # Type checking
    type_ok = True
    if field_type == "string":
        if not isinstance(value, str):
            errors.append(f"{path}: expected string, got {type(value).__name__}")
            type_ok = False
    elif field_type == "integer":
        if not isinstance(value, int) or isinstance(value, bool):
            errors.append(f"{path}: expected integer, got {type(value).__name__}")
            type_ok = False
    elif field_type == "boolean":
        if not isinstance(value, bool):
            errors.append(f"{path}: expected boolean, got {type(value).__name__}")
            type_ok = False
    elif field_type == "timestamp":
        # Timestamps can be strings or datetime objects
        pass
    elif field_type == "list":
        if not isinstance(value, list):
            errors.append(f"{path}: expected list, got {type(value).__name__}")
            type_ok = False
    elif field_type == "object":
        if not isinstance(value, dict):
            errors.append(f"{path}: expected object, got {type(value).__name__}")
            type_ok = False

    if not type_ok:
        return

    # Constraints
    if "enum" in constraints:
        if value not in constraints["enum"]:
            errors.append(
                f"{path}: value '{value}' not in allowed values {constraints['enum']}"
            )

    if "pattern" in constraints and isinstance(value, str):
        if not re.fullmatch(constraints["pattern"], value):
            errors.append(
                f"{path}: value '{value}' does not match pattern '{constraints['pattern']}'"
            )

    if "min" in constraints and isinstance(value, (int, float)):
        if value < constraints["min"]:
            errors.append(
                f"{path}: value {value} is less than minimum {constraints['min']}"
            )

    if "max" in constraints and isinstance(value, (int, float)):
        if value > constraints["max"]:
            errors.append(
                f"{path}: value {value} exceeds maximum {constraints['max']}"
            )

    if isinstance(value, list):
        if "min_length" in constraints and len(value) < constraints["min_length"]:
            errors.append(
                f"{path}: list has {len(value)} items, minimum is {constraints['min_length']}"
            )
        if "max_length" in constraints and len(value) > constraints["max_length"]:
            errors.append(
                f"{path}: list has {len(value)} items, maximum is {constraints['max_length']}"
            )

    # Recurse into nested structures
    if field_type == "list" and "items" in field_def and isinstance(value, list):
        items_def = field_def["items"]
        for i, item in enumerate(value):
            item_path = f"{path}[{i}]"
            if items_def.get("type") == "object" and "fields" in items_def:
                validate_object(item, items_def["fields"], item_path, errors)
            else:
                validate_field(item, str(i), items_def, item_path, errors)

    if field_type == "object" and "fields" in field_def and isinstance(value, dict):
        validate_object(value, field_def["fields"], path, errors)


def validate_object(data, fields_def, path, errors):
    """Validate a dict against a fields definition."""
    if not isinstance(data, dict):
        errors.append(f"{path}: expected object, got {type(data).__name__}")
        return

    for field_name, field_def in fields_def.items():
        value = data.get(field_name)
        field_path = f"{path}.{field_name}" if path else field_name
        validate_field(value, field_name, field_def, field_path, errors)


def validate(artifact, schema):
    """Validate an artifact against a schema. Returns list of error strings."""
    errors = []
    fields_def = schema.get("fields", {})
    validate_object(artifact, fields_def, "", errors)
    return errors


def main():
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <artifact_path> <schema_path> [--strict]")
        sys.exit(2)

    artifact_path = sys.argv[1]
    schema_path = sys.argv[2]
    strict = "--strict" in sys.argv

    artifact = load_yaml(artifact_path)
    schema = load_yaml(schema_path)

    errors = validate(artifact, schema)

    if errors:
        mode = "STRICT" if strict else "WARN"
        print(f"[{mode}] Validation of {artifact_path} against {schema_path}:")
        for e in errors:
            print(f"  - {e}")
        print(f"\n{len(errors)} issue(s) found.")
        if strict:
            sys.exit(1)
    else:
        print(f"[PASS] {artifact_path} conforms to {schema_path}")


if __name__ == "__main__":
    main()
