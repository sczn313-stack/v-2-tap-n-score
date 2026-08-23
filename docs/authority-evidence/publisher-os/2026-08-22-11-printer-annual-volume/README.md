# P-OS 11-Printer Annual Target-Volume Investigation

Observation date: 2026-08-22

This directory preserves the first versioned P-OS estimate of annual individual
paper/cardboard target pieces sold by the eleven publishers in the current P-OS
corpus.

Files:

- `REPORT.md` — Founder-facing conclusion, method, printer estimates, adoption
  scenarios, limitations, and improvement plan.
- `MODEL.json` — machine-readable estimate inputs and outputs.
- `SOURCE_LEDGER.md` — evidence ledger, source strength, and the claim each
  source supports.
- `validate_model.py` — deterministic reconciliation of printer totals and
  adoption scenarios.

## Counting boundary

The unit is one physical paper/cardboard target sheet or separately marketed
shootable target piece. A package is converted to pieces only when its count is
known. Steel targets, stands, carriers, clay targets, unrelated accessories,
and repair pasters are excluded. A sheet with several printed bullseyes remains
one physical target sheet.

These are planning estimates, not audited sales figures. Future revisions must
preserve the documented-fact / calculation / assumption separation and create
a new dated version rather than silently replacing this one.

The intended scope is each publisher's total annual volume where the evidence
permits. Public evidence is predominantly U.S.-channel evidence, so unobserved
exports are a source of uncertainty rather than a separately modeled add-on.

## Update procedure

1. Add new sources to `SOURCE_LEDGER.md`, retaining observation date and source
   quality.
2. Change only the affected printer inputs in `MODEL.json`.
3. Explain the changed inference in `REPORT.md`.
4. Run `python3 validate_model.py` and preserve the validation result with the
   next version.
