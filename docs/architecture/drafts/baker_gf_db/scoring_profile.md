# Draft Scoring Profile — Baker GF-DB

**Profile ID:** `baker_gf_db_scoring_draft_0_1`
**Scoring authority:** Validation only
**Numeric scoring:** Unapproved and unavailable

## Independence statement

This proposal does not copy, claim, or imply WDF or traditional dart-game authority. The printed numbers and radial artwork are target observations. Any Baker/SCZN3 firearm scoring rule must be independently approved.

## Proposed classification record

Each observed bullet hole would produce:

| Field | Meaning |
|---|---|
| `shot_id` | Stable shooter-facing observation identity |
| `sector_number` | Approved sector classification, or null for a sector-independent center zone |
| `radial_band` | Approved radial-region identity |
| `zone_value` | Independently approved Baker/SCZN3 radial value; currently null |
| `multiplier` | Not used by this proposal unless independently approved; currently null |
| `raw_score` | Backend-computed score only when every required scoring value is approved |
| `classification_status` | `classified`, `human_review_required`, or `unavailable` |
| `authority_status` | `authoritative` or `authority_unavailable` |

## Proposed rule shape

The smallest independent firearm rule under review is:

```text
expected bullet holes per turn = 3
hole score = approved sector value + approved radial-band value
turn score = sum of three authoritative hole scores
```

No numeric radial-band values are approved in this draft. Consequently, `raw_score` and `turn_score` must be null and the package must be `authority_unavailable`. Recording a zero in place of missing rule authority is prohibited.

The following table is a rules-approval checklist, not a scoring table:

| Radial region | Sector participation | Approved zone value | Current behavior |
|---|---|---:|---|
| `bull_core` | Unresolved | — | `authority_unavailable` |
| `bull_outer` | Unresolved | — | `authority_unavailable` |
| `inner_field` | Proposed | — | `authority_unavailable` |
| `middle_accent_band` | Proposed | — | `authority_unavailable` |
| `outer_field` | Proposed | — | `authority_unavailable` |
| `outer_accent_band` | Proposed | — | `authority_unavailable` |
| `number_annulus` | Proposed non-scoring | — | `authority_unavailable` |
| `outer_rim` | Proposed non-scoring | — | `authority_unavailable` |
| `outside_board` | Proposed miss | — | `authority_unavailable` until approved |

## Refusal and review behavior

- Missing or unapproved scoring table → `authority_unavailable`.
- Unknown sector or radial band → `authority_unavailable`.
- Ambiguous sector/ring boundary → classification status `human_review_required` inside an `authority_unavailable` package; no score.
- Missing observation from an expected three-hole turn → incomplete turn; no plausible total.
- Duplicate shot ID or classification → malformed package; no total.
- Outside registered evidence → `authority_unavailable`.
- Outside approved scoring surface → governed zero only after the miss rule is approved; until then `authority_unavailable`.
- Frontend or saved fields cannot supply, repair, or override a classification or score.

Because this profile is unapproved, every current scoring request returns `authority_unavailable`, even when the draft geometry can describe a sector and radial band.

## Explicitly excluded game mechanics

- Bust or checkout rules
- Dart retention or removal state
- Alternating-player dart game state
- WDF scoring or equipment rules
- Zeroing corrections, POIB, MOA, MRAD, clicks, or optic guidance
