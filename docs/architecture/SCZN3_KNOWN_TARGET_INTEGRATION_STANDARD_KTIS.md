# SCZN3 Known Target Integration Standard — KTIS

**Status:** Founder Approved — Active  
**Standard name:** `KTIS`  
**Recorded:** 2026-08-17

KTIS governs SCZN3 integration of an existing, known, offered-for-sale printer or publisher target.

## Governing rule

> **Use the target as the printer publishes it. Add the SCZN3 QR. Use the printer's Target Profile as physical-target authority. Use UGO to understand that target. Supply only the target-specific digital authority SCZN3 actually needs. Inherit everything the platform already owns. Build, test, and move on.**

## Ownership

The printer or publisher owns:

- the existing target;
- Product identity;
- published dimensions;
- printed geometry and artwork;
- product description;
- SKU/model;
- physical variants.

SCZN3 does not:

- redesign or recreate the target;
- certify the printer;
- re-measure published dimensions;
- second-guess manufacturing tolerances;
- search for superior external physical-target authority;
- require independent metrology;
- invent restrictions the publisher did not state;
- rename the publisher's product;
- add claims such as “official” unless the publisher's authoritative description supports them.

SCZN3 does:

- add the QR;
- register the publisher Target Profile;
- use UGO against that governed profile/representation;
- map shooter evidence into governed target space;
- implement only required target/mission-specific backend authority;
- inherit existing SCZN3 architecture;
- validate the complete shooter experience;
- move to the next target.

## Inheritance presumption

Known targets inherit these existing platform capabilities without repeatedly re-specifying or re-proving them:

- Smart Target Workspace;
- SEC Framework and SEC Components;
- Actions and Processing;
- Navigation and responsive behavior;
- Target Profile Identity framework;
- Partnership and Product Identity framework;
- Save → Vault → exact reopen;
- applicable registered scoring-presentation families.

New platform work is permitted only when the known target exposes a genuine unsupported requirement.

## Stop rule

Implementation stops for Founder judgment only when:

1. required information is actually missing and prevents correct implementation;
2. two authoritative sources genuinely conflict;
3. existing SCZN3 architecture cannot support required behavior;
4. a decision would change Founder-approved governance or architecture; or
5. a decision has significant downstream consequences requiring Founder judgment.

The possibility of collecting more information is not itself a stop condition.

> **Make the most informed implementation decision, document it when necessary, test it, and continue.**

## No Draft University

When KTIS resolves an issue, record **Resolved under KTIS** and continue. Do not create serial Founder gates merely to restate already-established authority. Engineering artifacts, overlays, mappings, fixtures, hashes, uncertainty models, and validation evidence are implementation deliverables unless they expose a genuine KTIS stop condition.

## Baker SL-ST2 application

For Episode 55:

```text
Baker Silhouette Target (IDPA) — SL-ST2
    → Baker Target Profile is physical-target authority
    → 23 × 35 published standard-paper variant
    → SCZN3 QR added
    → UGO maps the governed target representation/profile
    → SCZN3_SL_ST2_TIMED_PAIR_7YD_V1 supplies Mission Authority
    → backend classifies and calculates
    → Episode 54 supplies the inherited shooter experience
```

Gate 3 is resolved under **KTIS + UGO**. Its UGO artifacts, region mappings, fixtures, overlays, uncertainty treatment, hashes, and validation are implementation work rather than separate specification gates.
