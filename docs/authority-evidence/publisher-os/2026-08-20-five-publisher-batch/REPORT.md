# P-OS Five-Publisher Ingestion Report

## Outcome

**PASS.** The five catalogs normalized into the existing Baker/GunFun-style Publisher OS evidence model without production application changes, target-ID/SKU routing, or a new capability family.

The batch captured **790 commercial offering records across 657 live product pages**. Classification identified **505 shootable-target/target-system offering records across 428 product pages** and **285 accessory, consumable, or non-target records**. Every shootable-target record has the existing Smart Evidence Capture floor; richer relationships remain separately authority-gated.

Commercial variants were preserved as commercial identity. Packaging, pack count, adhesive presentation, stand bundles, and physical format did not create new software behavior.

## Access reconnaissance

No Founder authorization, credential, paid access, external account, or repository permission was required. See `ACCESS_RECONNAISSANCE.md`.

The only source friction was environmental/public-download permission, Birchwood's HTTP 403 against direct requests, and an unusable legacy Champion PDF route. Birchwood was completed through the live browser; Champion was completed through the current publisher storefront. Neither issue blocked the batch.

## Count semantics

- **Product pages** are distinct current publisher product pages.
- **Offering records** split publisher-exposed commercial variants when the public source exposes them; otherwise one record represents the live product page.
- **Actual targets** include shootable targets and shootable target systems/bundles.
- **Non-target** includes accessories, maintenance consumables, throwers, hearing protection, shooting rests, hunting products, display/storage items, and other non-shootable catalog goods.
- Birchwood exposes option lists on four parent pages but no option-level SKU in the captured live DOM. Those pages remain single records with the options preserved and an explicit SKU authority gap.

## Publisher results

| Publisher | Product pages | Offering records | Actual target pages | Actual target offerings | Non-target/accessory offerings | Exact SKU records | Status |
|---|---:|---:|---:|---:|---:|---:|---|
| Splatterburst Targets | 34 | 34 | 30 | 30 | 4 | 0 | Complete with public-SKU gap |
| Highwild | 359 | 418 | 204 | 228 | 190 | 416 | Complete |
| Birchwood Casey | 72 | 72 | 53 | 53 | 19 | 68 | Complete through browser; four parent-SKU gaps |
| EZ Aim / Allen Company | 120 | 140 | 106 | 126 | 14 | 140 | Complete |
| Champion Targets | 72 | 126 | 35 | 68 | 58 | 126 | Complete on current Primos/GSM storefront |
| **Combined** | **657** | **790** | **428** | **505** | **285** | **750** | **PASS** |

### Splatterburst Targets

- The catalog contains 30 shootable product pages and four cover-up/adhesive maintenance products.
- Rolls, adhesive presentation, and pack counts remain commercial formats of underlying target behavior, not separate capability families.
- All 30 shootable products inherit Smart Evidence Capture. Twenty-four carry one or more conservative richer-capability candidates, primarily ring scoring (22) and zeroing/sight-in (6).
- The public publisher APIs expose stable source product IDs, names, URLs, descriptions, prices, categories, dimensions, and images, but expose no SKU values. All 30 shootable records therefore fail closed on SKU-dependent admission while retaining source-product identity.
- No new behavior family was found.

### Highwild

- Highwild is a mixed catalog: 228 actual target/target-system offerings and 190 accessories or unrelated offerings across 418 commercial variants.
- The non-target population includes stands and mounting hardware sold alone, shooting rests, feeder and hunting equipment, cameras, hearing protection, and miscellaneous products. Target systems that actually include gongs, silhouettes, paper targets, or reactive components remain target systems.
- All 228 target offerings inherit Smart Evidence Capture. Conservative richer candidates include open/ring scoring (123), bounded reactive challenge (24), decision-profile candidates (21), zeroing (14), and qualification/profile candidates (5).
- Hostage/silhouette artwork does not establish a decision expectation. Dueling/resetting mechanics do not establish game rules. Competition-standard names do not establish a course.
- Two commercial variant records lack an exposed SKU; both are shootable products and preserve source variant identity with a fail-closed SKU gap.
- No new behavior family was found.

### Birchwood Casey

- The six-page live catalog produced 72 current product pages. Fifty-three are targets or target systems; 19 are paint, hangers, stands, throwers, display/storage, stapling, or other accessories/consumables.
- All 53 actual targets inherit Smart Evidence Capture. Richer candidates include scoring (12), reactive challenge (7), qualification/profile relationships (4), decision-profile relationships (2), zeroing (1), and recreational point/game behavior (1).
- Product option parents preserve the exact visible option labels. Three actual target parents and one accessory parent expose no exact SKU in the captured DOM; no SKU is invented.
- The branded circa-2021 PDF is supplemental only. Live pages govern current product identity.
- Unusual art—including an Alien, Yeti, skull, and animal silhouettes—does not create a capability. It remains product identity/artwork unless publisher rules establish a distinct shooter relationship.
- No new behavior family was found.

### EZ Aim / Allen Company

- The EZ Aim collection yielded 140 commercial offerings across 120 product pages. It contains 126 actual target/target-system offerings and 14 stand, hook, chain, thrower, stake, or mounting accessories.
- All 126 target offerings inherit Smart Evidence Capture. Richer candidates include scoring (50), qualification/profile relationships (14), zeroing (14), bounded reactive challenge (7), diagnostic publisher-label matching (5), recreational point/game behavior (5), decision profiles (4), Cue/Drill profiles (3), and collection/hand state (1).
- The Deck of Cards target does not authorize familiar card rules. Photo-real threat/no-threat/hostage art does not authorize expected response. Command and course-of-fire names require their exact profiles.
- Twenty commercial variants beyond the 120 product-page denominator preserve pack or option identity without expanding the behavior-family denominator.
- No new behavior family was found.

### Champion Targets

- The current Champion brand catalog yielded 126 commercial offerings across 72 product pages. Thirty-five pages/68 offerings are shootable paper, steel, or reactive targets; 58 offerings are protective gear, supports, accessories, throwers, and other non-target goods.
- All 68 target offerings inherit Smart Evidence Capture. Richer candidates include zeroing (24), scoring (17), bounded reactive challenge (13), qualification/profile relationships (6), and Cue/Drill timing relationships (2).
- Champion's “Trainer Target Series” branding alone was not treated as diagnostic authority.
- The current publisher catalog, not the blocked legacy guide route, is the governing captured source.
- No new behavior family was found.

## Combined capability result

### Existing behavior coverage

- **505/505 actual target offering records (100%)** map to an existing valid shooter relationship: Smart Evidence Capture.
- **330/505** also present at least one plausible richer existing-family relationship, but those richer relationships remain unavailable until their exact authority is packaged.
- **73/505** present multiple richer-family candidates. Each mission family must still resolve and execute independently.
- **175/505** require no richer relationship to preserve the valid evidence floor represented by current public authority.
- **Zero genuinely new reusable behavioral families** were discovered.

Richer candidate occurrences overlap and therefore do not sum to the target denominator:

| Existing family | Candidate occurrences |
|---|---:|
| CF-02 — open/ring scoring | 224 |
| CF-04 — zeroing/group/correction/confirmation | 59 |
| CF-03 — bounded entity-completion challenge | 51 |
| CF-12 — qualification/staged-course evaluation | 29 |
| CF-14 — decision scenario | 28 |
| CF-08 — multiplayer point accumulation | 6 |
| CF-11 — publisher-label diagnostic feedback | 5 |
| CF-13 — cue/drill orchestration | 5 |
| CF-16 — collection/hand state | 1 |

No product established a new relationship outside the existing 16-family vocabulary. Candidate occurrence means “investigate/package this existing family,” not “admit execution.”

### Authority gaps

- **No actual target is blocked as a known publisher product or evidence-only Smart Target.** A missing optional capability is not a missing target.
- **330 target offering records are authority-gated for one or more richer experiences.** The gap is usually exact UGO/region values, scoring rules, course authority, cue/drill rules, decision expectations, or publisher game rules.
- **35 actual target offering records lack an exact public SKU**: 30 Splatterburst, two Highwild, and three Birchwood parent products. Their publisher URLs/source IDs/images remain preserved, but SKU-dependent admission must fail closed.
- The remaining five missing-SKU records are non-target/accessory/consumable records.
- No official qualification, tactical/legal decision, diagnostic cause, correction, or familiar game rule was inferred from names or artwork.

## Recurring catalog patterns

- Commercial variety is much larger than behavioral variety. Pack count, color, adhesive format, rolls, and hardware bundles dominate many variants.
- Mixed catalogs require classification before ingestion; otherwise accessories and unrelated goods materially inflate the target denominator.
- Reactive steel mechanics often support evidence immediately but require rules before they become games or staged drills.
- Standard/competition target identity does not supply the governing course.
- Unusual art is recognition/product identity, not a capability.
- Exact publisher product identity and reusable mission behavior remain separate records/relationships.

## Architecture check

**Episode 56's scale premise held.** No production application file, executor, route, registry admission branch, or target-specific module was created or modified by this batch. The ingestion artifacts live only under this evidence directory.

The result remains:

> We do not build software for every target. We build software for what shooters do. Then targets inherit those abilities when their authoritative information says they can.

Authority gaps did not become architecture failures, and multi-capability products did not become multi-authority executions.

## Episode 57 readiness

The batch adds **428 known shootable publisher product-page identities representing 505 commercial target offerings** to the potential recognition corpus. All 505 retain product names, publisher identity, URLs, available dimensions/descriptions, image references, commercial variant data, and stable recognition traits. **470 target offering records have an exact exposed SKU; 35 retain source-product identity while awaiting exact SKU authority.**

This makes the already-printed inventory associated with those known products potentially recognizable after a future governed recognition pipeline is trained and validated. It does not claim that visual recognition is implemented or accurate today.

The identity-entry boundary remains:

> QR declares identity. Photo recognizes identity. Website discovers identity.

## Validation

`validation.json` records a full PASS:

- 790/790 unique normalized record IDs;
- 750/750 unique publisher+SKU tuples among exposed SKUs;
- all five publishers present;
- 505/505 actual targets have the Smart Evidence floor;
- 285/285 non-target/accessory/consumable records have no execution mapping;
- every richer mapping remains `candidate_authority_required`;
- only the established CF-01 through CF-16 identifiers appear;
- all referenced evidence files exist;
- every missing-SKU record carries an explicit authority gap;
- captured response headers contain no retained cookies.

## Files

- `normalized/all-publishers.json` — unified common-model evidence records.
- `normalized/<publisher>.json` — publisher slices of the same model.
- `normalized/summary.json` — reconciled denominators and capability counts.
- `validation.json` — fail-closed validation evidence.
- `manifest.json` — file hashes and byte counts.
- `raw/` — captured publisher-source evidence.
- `normalize_batch.py` / `validate_batch.py` — reproducible evidence tooling, not production code.

No UI work, production registration, application architecture change, commit, push, or deployment occurred.
