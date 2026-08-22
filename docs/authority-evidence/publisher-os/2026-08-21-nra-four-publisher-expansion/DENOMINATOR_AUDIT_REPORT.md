# P-OS Batch #8–#11 Denominator Audit

> **HISTORICAL INTERMEDIATE AUDIT — CUMULATIVE TOTALS SUPERSEDED.** This audit correctly establishes the Batch #8–#11 addition at **744 identities / 1,151 offerings**. Its 1,651/2,319 cumulative result was explicitly conditional on the unaudited seven-publisher baseline. The later eleven-publisher audit replaced that baseline and establishes **1,683 identities / 2,416 offerings**. See the [11-Publisher Founder Master Summary](../PUBLISHER_OS_11_PUBLISHER_MASTER_SUMMARY_2026-08-21.md).

Observed: 2026-08-21  
Scope: reconciliation only. No new publisher research, capability activation, registration, production change, commit, push, or deployment.

## Audit verdict

**The previous +841 target-identity and +1,164 target-offering claims were inflated and are withdrawn.** They reconciled arithmetically but conflated catalog product records with publisher target implementation identities and contained classification errors.

Correct Batch #8–#11 totals:

| Denominator | Correct total |
|---|---:|
| Unique NRA governed specifications in the four manufacturer sheets | **136** |
| NRA manufacturer-sheet publisher/specification relationships | **377** |
| NRA specifications with an exact live-catalog mapping | **112** |
| Exact live publisher implementations of those NRA specifications | **264** |
| Other publisher-defined or not-yet-governed target implementations | **480** |
| **Publisher target implementation identities** | **744** |
| **Commercial target offerings** | **1,151** |
| Non-target/accessory/consumable product records | **33** |
| Non-target/accessory/consumable offering rows | **37** |

Thus:

> **136 governed NRA specifications are not 744 identities.**

The 136 are organization-owned specifications. Of them, 112 were connected to 264 exact live publisher implementations across the four catalogs. The remaining 480 implementation identities are non-NRA publisher designs, other-organization products, or products whose governing specification was not established strongly enough to merge. Those 744 implementations are sold through 1,151 commercial configurations.

## Corrected cumulative P-OS scale

Using the accepted seven-publisher baseline supplied for this audit:

| Measure | Prior seven | Audited addition | Corrected cumulative |
|---|---:|---:|---:|
| Publishers | 7 | 4 | **11** |
| Publisher target implementation identities | 907 | **744** | **1,651** |
| Commercial target offerings | 1,168 | **1,151** | **2,319** |

The prior seven-publisher baseline was not re-audited in this assignment. The cumulative figures above are therefore authoritative for the corrected Batch #8–#11 addition against the accepted baseline, not proof that the earlier 907/1,168 corpus already conforms perfectly to the newly explicit four-layer ontology.

## Per-publisher reconciliation

| Publisher | Catalog product records | Correct target product records | Publisher implementation identities | Commercial target offerings | Non-target product records | Exact live NRA spec implementations |
|---|---:|---:|---:|---:|---:|---:|
| American Target | 207 | 202 | **174** | **502** | 5 | 81 |
| National Target | 308 | 302 | **266** | **302** | 6 | 94 |
| Speedwell | 194 | 173 | **139** | **173** | 21 | 30 |
| U.S. Target | 175 | 174 | **165** | **174** | 1 | 59 |
| **Combined** | **884** | **851** | **744** | **1,151** | **33** | **264** |

“Target product record” is an intermediate catalog denominator, not another name for target identity.

## American Target: 207 → 174 → 502

American is the clearest proof that the old denominator was wrong:

1. The static catalog contains **207 product/design blocks**.
2. Five blocks are not shootable targets: four target backers and one target-paster product. That leaves **202 target product records**.
3. Material, color, and duplicate-category records collapse to **174 publisher target implementation identities**. Examples include paper/tagboard B-6 and B-8 variants, paper/tagboard smallbore variants, B-16 color variants, B-27 color/material variants, and identical products listed in more than one category.
4. The catalog exposes **521 target price-tier rows** after excluding nine non-target price-tier rows.
5. Nineteen repeated evidence rows are not additional offerings: duplicated B-6/B-8 category rows, overlapping D-1/D-2 catalog listings, and three repeated AURORA PD 2 price lines.
6. Result: **502 unique commercial target offerings**.

Different quantity tiers remain separate commercial offerings. Different paper/tagboard/color packages remain commercial variants. They do not create another publisher target identity when they implement the same face/design lineage.

## Classification corrections

The prior normalizer made errors in both directions:

- **American Target:** four backers and Target Pasters were incorrectly counted as targets.
- **National Target:** six shootable sale/custom products were incorrectly classified as accessories merely because their category was named “Custom Targets & Backers.” Only six actual backer/paster products remain non-target.
- **Speedwell:** ten net target records were restored. Keyword matching had treated steel plates and paper/cardboard targets as accessories because their titles/descriptions mentioned a stand, backer, or similar term. Twenty-one genuine non-target records remain: stands, backers, pasters/overlays, cleaning products, and a non-product GSA page.
- **U.S. Target:** the unprinted corrugated `Backer` product is now non-target; the other 174 records are targets.

These corrections explain why the raw target-product-record count moved from 841 to 851 even while the actual identity count fell to 744. Classification and identity deduplication are separate operations.

## Identity rules used

### 1. Governed target specification

An organization-owned target definition. NRA B-16 is one governed specification regardless of printer, color, paper stock, package, or seller.

### 2. Publisher target implementation identity

One publisher's implementation of a target face/design lineage. The audit collapses only:

- exact organization designation variants supported by the manufacturer sheet;
- paper/tagboard/cardboard versions of the same face;
- color/high-visibility versions of the same face;
- package and quantity variants;
- explicit duplicate category records;
- explicit publisher lineages whose catalog names establish the same face.

Repair centers, reductions, different bull counts, different scoring layouts, F-Class geometry, anatomy overlays, and other materially different faces remain separate unless exact authority proves equivalence.

### 3. Commercial SKU/package offering

A separately sold SKU, product page, package, material, color, or quantity tier. Multiple offerings may inherit one publisher implementation identity. Conflicting price observations are preserved; they do not manufacture another target identity.

### 4. Non-target/accessory/consumable

Backers, stands without a target, pasters, overlays, cleaning products, and comparable records remain commercial intelligence but are excluded from target denominators.

## Fail-closed treatment

Ambiguous target relationships were left separate. Visual similarity, a shared image, a base-code substring, or a reference to another target in a description was not enough to merge identities.

Examples deliberately kept separate include:

- full targets versus repair centers;
- an NRA target versus a non-competition version with different rings;
- a base target versus a reduced or F-Class geometry;
- B-3 versus B-3/2 and B-3/4 practice layouts;
- ordinary versus anatomy/scenario overlays;
- similarly named state, military, or agency targets without exact common authority.

## Artifacts and reproducibility

- `DENOMINATOR_AUDIT.json` contains every source product, corrected classification, governed specification where established, publisher implementation key, and every commercial offering row.
- `audit_denominators.py` deterministically rebuilds the four-layer reconciliation.
- `normalized/summary.json` now carries a denominator warning and the audited totals.
- `normalize_batch.py` contains the corrected target/non-target classification rules.

## Final correction

Withdraw:

> **+841 identities / +1,164 offerings → 1,748 cumulative identities / 2,332 cumulative offerings**

Replace with:

> **+744 publisher target implementation identities / +1,151 commercial target offerings → 1,651 cumulative identities / 2,319 cumulative offerings**

The four catalogs are still large. The audit simply prevents catalog rows, material/color variants, duplicated evidence, and accessories from masquerading as distinct target identities.
