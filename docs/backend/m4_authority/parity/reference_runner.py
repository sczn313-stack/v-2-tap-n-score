"""Run the frozen Python authority reference for adapter parity testing."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from m4_authority.authority_service import build_authority_package  # noqa: E402


def main() -> None:
    fixtures = json.load(sys.stdin)
    rows = []
    for fixture in fixtures:
        result = build_authority_package(fixture)
        core = {
            key: value
            for key, value in result.items()
            if key not in {"computedAt", "evidenceHash"}
        }
        rows.append({
            "result": result,
            "canonical": json.dumps(core, sort_keys=True, separators=(",", ":")),
        })
    json.dump(rows, sys.stdout)


if __name__ == "__main__":
    main()
