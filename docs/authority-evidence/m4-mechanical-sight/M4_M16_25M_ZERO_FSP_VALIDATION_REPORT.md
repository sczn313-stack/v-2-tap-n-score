# M4/M16 25M target-scoped front-sight authority validation

Status: Founder Approved / locked. Founder verdict: **“It works swimmingly well.”**

## Exact governed identity

- Target: `m4_25m_zero` / `M4_TARGET_AUTHORITY_v1_ORIGINAL`
- Canonical target plane: `M4_M16_25M_ZERO_AUTHORITY_v1`
- Weapon: M4/M4A1 Carbine
- Configuration: detachable carrying handle plus standard M4/M4A1 front sight post
- Runtime authority: `M4-M16-25M-ZERO-FSP-AUTHORITY-2026-09-01`
- Mechanical values: windage 0.75 MOA per click; elevation 1.75 MOA per click

## Evidence lineage

The exact physical target photograph is `docs/assets/M4_M16_SERIES_WEAPONS_25M_ZERO_FOUNDER_PHOTO.jpeg`, SHA-256 `55dc305ac678b786e6d571273a9b5118f614d093e8f979fa37eb5c313d4f4f20`. Its printed table states that each block is 1 MOA at 25 meters and gives the M4/M4A1 front-sight elevation value as 1.75. SCZN3 does not invent or assert a publisher attribution for this artifact.

The registered canonical target artifact is `docs/assets/M4_M16_25M_ZERO_AUTHORITY_v1.png`, SHA-256 `e2be00e15b82b8f775fcb0934aaac7413ee44abcb53df29e44f07ac2c2b25b70`.

FM 3-22.9, Change 1 (2011), SHA-256 `56c9c9c32e1f19aaff4c8f6bf220208ce54960dadd62dff8a4b59db0b5a1d532`, remains the verified source behind the separate 1.5 MOA record. That record is preserved and is not globally superseded.

## Scope and validation

The target profile selects the new record explicitly; the shared adjustment-system resolver still accepts the historical record when that historical record ID is requested. Observed results:

- M4 backend authority: 11/11
- registry contract and mechanical testability: pass
- Python/JavaScript parity: 57/57 in both production and backend parity paths
- Backend Session Authority: 19/19
- target registration and confirmation: 6/6
- SEC/Vault architecture: pass
- protected exact-photo Founder road: pass at 1440px and 390px

The full gate ledger, including unrelated inherited suite drift that was deliberately left unchanged, is preserved at `CHECKPOINTS/SCZN3_EP60_VICTORY_2_M4_TARGET_SCOPED_AUTHORITY_2026-09-01/VERIFICATION_REPORT.md`.

This report is not a Home activation or deployment record. M4 remains COMING SOON.
