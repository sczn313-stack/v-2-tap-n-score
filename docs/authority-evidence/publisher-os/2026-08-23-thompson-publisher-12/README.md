# Thompson Target Inc. — Additive P-OS Publisher #12

This directory is the durable additive Publisher #12 evidence bundle observed
on 2026-08-23. It extends, but does not rewrite, the preserved 11-publisher P-OS
corpus and annual-volume model.

Start with `REPORT.md`. Machine consumers should use `THOMPSON_CATALOG.json` and
`THOMPSON_VOLUME_PRICING_MODEL.json`. Authority and capability boundaries are in
`CAPABILITY_MAP.md`; provenance is in `SOURCE_LEDGER.md`.

Rebuild order:

1. `collect_thompson_catalog.py`
2. `collect_thompson_variants.py`
3. `normalize_thompson_catalog.py`
4. `build_thompson_models.py`
5. `validate_thompson.py`

The collection steps access public publisher pages and therefore require
network access. The normalization, modeling, and validation steps are local and
deterministic over the preserved evidence.
