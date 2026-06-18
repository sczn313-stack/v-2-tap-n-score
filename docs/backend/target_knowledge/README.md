# SCZN3 Target Knowledge

Backend target knowledge is stored as JSON manifests by target family/type.

This folder is not wired into live scoring yet. It exists to separate target
purpose, instructions, geometry authority, and unknowns before any scoring or
guidance implementation uses the data.

Authority classes:

- `geometry_authority`: dimensions, coordinates, zones, grids, rings, and other
  measurable target facts from official dimensions, verified manifests, or
  verified measurement.
- `instruction_authority`: designer text, printed target text, official rules,
  course of fire, shot count, distances, scoring, and success conditions.
- `shooter_evidence`: uploaded target image, aim taps, impacts, distance,
  setup, timestamp, and session evidence.
- `shooter_continuity`: saved SEC/session history, progression, prior results,
  shooter metadata, and replay/export context.

Governance rules:

- Photos are evidence, not full geometry authority.
- Do not invent ring dimensions, zones, distances, or scoring rules.
- Missing official facts must be listed in `unknowns` with
  `UNKNOWN / REQUIRES OFFICIAL SOURCE`.
- The backend should organize by target family/type and purpose, not artwork
  alone.

Validate manifests:

```sh
python3 docs/backend/target_knowledge/validate_target_knowledge.py
```
