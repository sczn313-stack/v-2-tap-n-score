# Episode 56 Publisher OS / Full-Catalog QR Feasibility Founder Specification

**Status:** Founder review — specification only  
**Catalog denominator:** 258 distinct published GunFun SKU records  
**Evidence basis:** Completed Episode 56 full-catalog stress test  
**Implementation status:** No implementation authorized or performed

## 1. Founder answer

Yes. SCZN3 can support the Publisher OS relationship:

> Publisher identity + publisher SKU → SCZN3 Target Profile identity → governed catalog entry → unique public route → QR association

without creating an individual target implementation for every product.

The complete 258-record simulation produced:

| Catalog result | Count | Percent of 258 | Meaning |
|---|---:|---:|---|
| Association-ready today | 238 | 92.25% | A unique governed target identity and route can be established without new target-specific production code. |
| Generic Target Execution Contract path | 237 | 91.86% | Existing registered products inherit the frozen scale architecture. |
| Existing governed legacy path | 1 | 0.39% | Vital Dude, SKU 22740, retains its approved identity and route while joining the catalog relationship. |
| Publisher-authority confirmation required | 3 | 1.16% | Rangemaster products cannot be published under GunFun authority until ownership/authority is resolved. |
| Outside the Smart Target population | 17 | 6.59% | Target supports/backers and multi-target packs are not one executable publisher target. |

There were no publisher-SKU collisions, Target Profile identity collisions, governed-route collisions, missing catalog artwork assets, missing product names, or missing SKU values in the fixed population.

The direct answer to “How many of 258 could be returned to GunFun QR-ready today?” has two necessary layers:

- **238 records are association-ready today.** Their product identities can be deterministically bound to governed SCZN3 identities and unique QR routes.
- **Zero production-issued QR assets should be handed off today.** The shared generic resolver, immutable catalog publication record, and integrity-bearing QR package generator have not yet been implemented and Founder Approved. Issuing raw target URLs would bypass the governed QR boundary already established by the Smart Target Catalog.

After the smallest shared mechanism is implemented and validated, the first governed batch can return **238 production QR packages** without 238 target implementations. The potential ceiling is **241** if the three Rangemaster authority questions are resolved affirmatively and those products are registered.

## 2. Identity and authority model

The durable lookup key is the structured tuple:

> `(publisher identity, exact publisher SKU)`

SKU alone is not globally unique and must never be treated as publisher-independent authority.

The tuple identifies the publisher product lineage. The immutable Target Profile and catalog-entry version identify the exact governed physical-product relationship. If a publisher reuses a SKU or materially changes the product, SCZN3 publishes a new Target Profile/catalog version. An existing QR remains bound to its historical version and must not silently resolve to “latest.”

The Publisher Product Boundary remains unchanged:

- The publisher owns the product facts: product identity, exact SKU, product name, published dimensions, artwork, variants, descriptions, and publisher-supplied rules.
- SCZN3 owns the digital relationship: Target Profile identity, registration, authority resolution, capability composition, catalog lifecycle, route admission, QR binding, result authority, SEC, and preservation.
- Registration establishes the relationship. Authority determines the available capabilities.
- A missing optional capability is not a missing target.
- The QR payload is a governed lookup request, not executable authority and not a container for scoring, rules, claims, or private data.

## 3. Full-library simulation

The simulation applied one identity and route model to every record in the fixed 258-product population.

| Test | Result |
|---|---:|
| Publisher + SKU composite keys | 258 |
| Composite-key collisions | 0 |
| Registerable unique product relationships | 241 |
| Association-ready governed identities/routes | 238 |
| Target Profile ID collisions | 0 |
| Governed-route collisions | 0 |
| Generic TEC routes | 237 |
| Existing legacy governed routes | 1 |
| Publisher-confirmation holds | 3 |
| Non-target physical-product exclusions | 17 |
| Target-specific production-code changes needed for the 238 associations | 0 |

All 237 generic entries can truthfully inherit `smartEvidenceCapture` as their minimum capability under the frozen architecture. Vital Dude can retain its already-approved evidence-only experience through its existing governed route. Missing scoring, geometry, mission, qualification, or other richer authority does not invalidate the QR relationship.

## 4. Catalog exceptions

### 4.1 Publisher-authority confirmation required

| Stress ID | SKU | Current result | Required resolution |
|---|---|---|---|
| E56-FC-043 | 140 | Held | Confirm which publisher owns and can authorize the Rangemaster product relationship. |
| E56-FC-045 | 148 | Held | Confirm which publisher owns and can authorize the Rangemaster product relationship. |
| E56-FC-046 | 151 | Held | Confirm which publisher owns and can authorize the Rangemaster product relationship. |

GunFun’s product pages transfer availability to MPTargets. SCZN3 must not infer that GunFun has item-level authority to establish these three Smart Target relationships. They remain identifiable catalog products, but no production Target Profile, route publication, or QR package should be issued until the publisher authority is explicit.

### 4.2 Outside the Smart Target QR population

The following 17 products are legitimate commercial SKUs but are not one executable publisher target:

- Target hangers/backers/support products: `61020-C`, `61040-C`, `61050-C`, `61090-C`, `62020-P`, `62030-P`, `62050-P`, `62100-P`, `62110-P`, `62130-P`, `62250-P`, `62260-P`, `62270-P`, `63040-P`.
- Multi-target Splatter packs: `74010`, `79512`, `79522`.

They may eventually receive commercial or informational QR treatment, but they must not be represented as one registered Smart Target. That is a different Publisher OS product relationship and is outside this specification.

### 4.3 Vital Dude, SKU 22740

Vital Dude already has the governed Target Profile identity `gunfun_22740_vital_dude` and an approved evidence-only experience. Its earlier architecture-test exception concerned generic TEC inheritance, not the validity of its publisher-product relationship.

Publisher OS should publish one catalog entry that binds SKU 22740 to that existing identity and governed destination. It must not create a duplicate Target Profile, duplicate experience, new mission, or target-specific QR resolver branch.

## 5. Minimum Publisher OS ingestion record

Publisher OS ingestion is a staging envelope. It is not a second source of target, execution, or capability authority.

| Field | Requirement | Authority | Treatment |
|---|---|---|---|
| `publisherRef.id` | Mandatory | Verified publisher/partner authority | Exact stable publisher identity; `gunfun` for this population. |
| `publisherRef.name` | Mandatory | Publisher authority | Preserved publisher name. |
| `sku` | Mandatory | Publisher authority | Exact string; never coerced to a number. |
| `productName` | Mandatory | Publisher authority | Exact published product name. |
| `productAuthoritySource` | Mandatory | Publisher evidence/provenance | Source URL, captured record, or approved publisher feed reference. |
| `productRepresentationRef` | Mandatory for executable targets | Publisher evidence | The admitted product artwork/image/representation used by registration. |
| `publishedDimensions` | Optional for minimum relationship; mandatory when claimed | Publisher authority | Preserved exactly with units and source. Absence prevents dimensional claims, not identity registration. |
| `publisherCategory` | Optional | Publisher authority | Preserved classification; not execution authority. |
| `description`, `variants`, `material`, additional images | Optional | Publisher authority | Preserved product facts only. |
| `requestedCapabilities` | Optional request | Publisher/SCZN3 intake | A request for evaluation, never proof of authority. |
| `catalogEntryId` and `catalogVersion` | Mandatory at publication | SCZN3 Catalog authority | Immutable published identity/version. |
| `targetProfileRef.id` and `.version` | Mandatory for a Smart Target publication | SCZN3 Target Profile authority | Exact authoritative physical-product relationship. |
| `registrationRef` | Mandatory for execution admission | SCZN3 registration authority | References registration, admitted asset digest, and applicable contract. |
| `capabilityRefs` and capability status | Mandatory | Existing SCZN3 capability owners/TEC | Referenced and resolved; rules are not copied into the catalog. |
| `lifecycleStatus`, effective time, approval evidence | Mandatory | SCZN3 Catalog authority | Draft, active, suspended, retired, or revoked; fail closed unless active. |
| `qrRouteId` and canonical resolver route | Mandatory | SCZN3 route authority | Stable, unique, version-bound route association. |
| `integrityDigest` | Mandatory | SCZN3 publication process | Digest over the immutable published relationship. |
| Composite publisher/SKU key | Derived | Deterministic SCZN3 process | Structured from verified publisher identity and exact SKU. |
| QR payload and asset filenames/hashes | Derived | Deterministic SCZN3 process | Generated from the published route record. |
| Eligibility or exception state | Derived review result | SCZN3 governance | Records registration readiness, authority hold, or non-target exclusion. |

Price, inventory, promotional copy, and similar mutable commerce data are not required for a Smart Target relationship and should not enter the QR authority path.

## 6. Smallest correct Publisher OS mechanism

The minimum reusable mechanism has four shared parts.

### 6.1 Publisher ingestion and normalization

Accept a publisher manifest, preserve publisher-authoritative facts exactly, validate the publisher/SKU composite key, and produce staged records plus explicit exceptions. The staging record cannot make a target executable.

### 6.2 Catalog publication

Publish an immutable, versioned catalog entry only after resolving its Target Profile and registration references. The route record references existing authority owners; it does not duplicate Target Profile, KTIS, UGO, TEC, mission, scoring, Session Authority, or SEC truth.

The existing Smart Target Catalog remains the architectural source of truth. Existing identity-registry records should be evolved or referenced as identity seeds rather than copied into a competing identity database.

### 6.3 Generic fail-closed resolver

Use one canonical public shape:

> `/t/{publisherRouteId}/{productRouteId}`

`productRouteId` is SCZN3-issued, stable, unique, and bound to a specific published catalog version. It may contain a human-recognizable SKU element such as `11010-v1`, but the parsed string has no independent authority.

The resolver must:

1. Parse only the minimal route identity.
2. Resolve the exact immutable catalog entry/version.
3. Require an active lifecycle state.
4. Verify integrity and publisher, Target Profile, registration, and capability references.
5. Resolve the currently authorized experience through existing architecture.
6. Fail closed for unknown, ambiguous, tampered, suspended, retired, revoked, incompatible, or incomplete relationships.

No target-ID branch may be added to the resolver. Vital Dude is handled through catalog data pointing to its existing governed destination.

### 6.4 Batch QR package generation

Generate QR payloads only from approved published catalog entries. The payload is the HTTPS canonical resolver URL and contains no scoring, mission rules, mutable authority, private data, or frontend-generated claims.

## 7. GunFun handoff package

A governed batch returned to GunFun should contain:

- `publisher-manifest.json` identifying the publisher, batch, publication, and package version.
- A JSON and CSV association manifest mapping publisher identity and SKU to catalog entry/version, Target Profile reference, canonical resolver route, QR payload, minimum capability status, registration reference, and integrity digest.
- One SVG and one PNG QR asset per published association, with deterministic filenames and hashes.
- An integrity manifest covering every payload, QR asset, catalog entry/version, and registration reference.
- An exceptions report separating authority holds from products outside the Smart Target population.
- A human-readable handoff README defining placement, lifecycle, replacement, suspension, and support expectations.

GunFun retains authority over physical placement and changes to its product artwork. SCZN3 does not silently modify publisher artwork or infer approval to print.

## 8. Automation and legitimate review

| Work | Classification |
|---|---|
| Extract and validate all 258 publisher/SKU keys | Fully automatable |
| Detect missing values and key/profile/route collisions | Fully automatable |
| Bind and package 237 generic TEC registrations | Batch automatable after shared implementation |
| Bind Vital Dude to its existing governed identity and route | One shared catalog review, then automatable; no target code |
| Flag the three Rangemaster records | Automatable detection; item-level publisher authority decision remains manual |
| Flag the 17 support/bundle records | Automatable classification with one batch governance review |
| Generate manifests, QR assets, hashes, and integrity report | Fully automatable after publication approval |
| Approve the batch for publication and accept publisher handoff | One batch SCZN3 decision and one publisher acceptance, not 238 target implementations |

Legitimate future manual review remains necessary for publisher-identity conflicts, duplicate or reused SKUs, materially changed artwork/product versions, missing product representations, unclear target-versus-bundle composition, and external ownership. Minimum QR registration must not wait on optional scoring or mission authority.

## 9. Exact proposed future implementation scope

No implementation is authorized by this document. If Founder Approved separately, the smallest implementation scope is:

- Generalize `docs/backend/product_catalog.py` from its current single-product behavior into a data-driven, fail-closed catalog-route resolver.
- Preserve the existing `/api/catalog/product-route` endpoint in `docs/backend/server.py` unless validation demonstrates a real contract conflict.
- Generalize `docs/404.html` route handling so `/t/{publisher}/{product}` resolves through catalog data instead of GSSF-specific authority checks and destination wiring.
- Evolve or reference `docs/backend/registries/smart_target_identity_registry.json` and its schema as existing identity seeds; add only route/catalog records that reference authoritative Target Profiles rather than creating a second Target Profile authority source.
- Add one offline/shared Publisher OS ingestion and QR-package builder under operations tooling.
- Add schemas and validation for composite-key uniqueness, immutable version binding, lifecycle admission, authority references, integrity, route uniqueness, QR reproducibility, and exception classification.
- Add full-catalog fixtures covering the 237 generic entries, Vital Dude’s existing path, the three authority holds, and the 17 exclusions.
- Add an acceptance test proving a newly published catalog fixture receives a governed route and QR package with zero target-ID production edits.

## 10. Validation plan

The future implementation must prove:

- All 258 fixed inputs reconcile to exactly 238 publishable associations, 3 authority holds, and 17 non-target exclusions.
- All 238 publisher/SKU composite keys, Target Profile references, catalog IDs, route IDs, and QR payloads are unique where uniqueness is required.
- Re-running an unchanged batch produces byte-stable association data and QR payloads.
- Every QR resolves through the generic catalog resolver and reaches only the destination authorized by its exact catalog version and authority references.
- Unknown, ambiguous, altered, suspended, retired, revoked, missing-reference, and integrity-failed records fail closed.
- Historical QR payloads remain bound to their historical catalog version after a new product version is published.
- Two distinct products can share an execution family while retaining exact publisher, SKU, Target Profile, route, result, SEC, and preservation identities.
- Vital Dude resolves through its existing approved experience without a new target-ID runtime branch.
- The three Rangemaster records cannot be published until publisher authority is supplied.
- The 17 non-target products cannot be misrepresented as individual Smart Targets.
- No production QR is generated from staged, unapproved, or incomplete ingestion data.
- Existing target execution, Session Authority, Zeroing Authority, Universal SEC, preservation, historical SEC, and existing public product routes regressions remain passing.

## 11. What will not change

This mechanism does not change or redesign:

- M-009, ADR-001, M-010, the Publisher Product Boundary, KTIS, UGO, or the Shortest Correct Mental Model.
- Target Execution Contract semantics or capability-family executors.
- Session Authority, Zeroing Authority isolation, Backend Authority, Universal SEC, or preservation.
- Existing publisher product facts, artwork, dimensions, or supplied rules.
- Existing targets, historical SECs, or governed results.
- Vital Dude’s evidence-only authority boundary.
- The rule that missing optional capability is not a missing target.

It does not introduce scoring, geometry, mission rules, qualification meaning, physical measurement, anatomical interpretation, correction, or publisher intent.

## 12. Founder decisions

No additional decision is required to accept the feasibility result.

Before implementation, Founder approval is required for:

1. The catalog boundary: **238 association-ready, 3 held for publisher authority, and 17 outside the Smart Target population**.
2. The immutable version-bound generic route model: `/t/{publisherRouteId}/{productRouteId}`.
3. The exact shared implementation scope in Section 9.

Before production QR handoff, SCZN3 batch publication approval and GunFun acceptance of the generated association/placement package are also required.

## 13. Governed conclusion

The catalog can become a governed Publisher OS package without individual target implementations:

> Catalog in → publisher authority preserved → SCZN3 relationship registered → immutable catalog entry → governed route → QR package out

For the fixed GunFun population, **238 of 258 products are ready for that association**. The missing reusable mechanism is one shared publisher/SKU catalog index, one generic version-bound fail-closed resolver, and one integrity-bearing batch QR package generator—not 238 target implementations.

No code, catalog publication, QR asset, production change, commit, push, or deployment was created by this specification.
