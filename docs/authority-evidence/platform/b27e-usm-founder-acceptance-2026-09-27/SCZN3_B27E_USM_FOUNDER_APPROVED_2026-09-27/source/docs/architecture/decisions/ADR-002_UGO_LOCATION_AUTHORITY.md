# ADR-002 — UGO Location Authority

**Episode:** 64  
**Date:** 2026-09-24  
**Status:** Founder Approved · Architecture Locked  
**Runtime reference:** QT 5-Spot Founder-approved location behavior

## Decision

SCZN3 adopts this permanent location invariant:

```text
physical point on target
→ UGO/canonical target coordinate
→ TARGET
→ RESULT
→ SEC
→ VAULT
→ EXACT REOPEN
```

> **UGO/canonical target coordinate is location truth. Pixels and rendered geometry are display projection only.**

A shooter interaction may use the actual visible source-image content box once, at capture, to convert the selected physical target point into the registered canonical coordinate system. The resulting canonical coordinate is then immutable. Every later lifecycle view projects that same stored coordinate onto the actual rendered target image.

No later stage may infer, renormalize, replace, or repair target location from a marker's pixels, an image element's outer box, a wrapper, a viewport, CSS dimensions, letterboxing, or any other presentation geometry.

## Canonical point contract

The approved normalized-source-image UGO point is:

```json
{
  "schemaVersion": "sczn3.ugo.normalized-source-image-point.v1",
  "coordinateSystem": "normalized_source_image_top_left",
  "targetProfileId": "<governed target identity>",
  "sourceImageSha256": "<registered source-image digest>",
  "sourceImageWidthPx": 0,
  "sourceImageHeightPx": 0,
  "xNorm": 0.0,
  "yNorm": 0.0
}
```

The target identity, source-image digest, canonical coordinate system, source dimensions, and normalized point together form the durable location binding. A point with mismatched identity, digest, dimensions, coordinate system, or numeric coordinates is invalid; it must not be silently translated or accepted.

## Capture rule

The browser converts a click into UGO exactly once:

1. Resolve the visible content rectangle of the registered target image, excluding border, padding, and `object-fit` letterboxing.
2. Reject clicks outside that visible target content.
3. Normalize the click within that content rectangle into the registered source-image coordinate system.
4. Bind the normalized point to target identity, source digest, source dimensions, schema, and coordinate system.
5. Persist that canonical object unchanged.

Presentation geometry is permitted at step 1 only as the observation-to-UGO conversion boundary. It never becomes durable target authority.

## Lifecycle projection rule

TARGET, RESULT, SEC, Vault, and exact reopen must each perform:

```text
stored UGO/canonical coordinate
→ actual visible rendered target-image content rectangle
→ transient marker pixels
```

The projection must use the target image's visible content, not the surrounding element or container. Scaling, responsive reflow, viewport changes, padding, borders, `object-fit`, and letterboxing may change transient marker pixels but may not change the represented physical target point. Cropping is allowed only when the Registration Package supplies an explicit governed mapping; a display crop cannot silently redefine canonical coordinates.

No lifecycle stage may create a new durable coordinate from a rendered marker position.

## Backend enforcement

Backend execution validates the complete canonical binding against the resolved Target Execution Contract and registered evidence image. It rejects conflicts instead of repairing them. Authoritative result observations preserve and return the supplied canonical object so SEC and Vault consume the same location truth captured at TARGET.

Legacy observations without the canonical object may be admitted only by an explicitly governed compatibility boundary that synthesizes the same schema from already-canonical normalized source coordinates and the resolved contract identity. Presentation pixels are never a compatibility source.

## Shared implementation

- Capture and projection: `docs/target_execution_runtime.js`
  - `sourceImagePoint`
  - `renderedImageContentBox`
  - `syncProjectionLayerToImage`
  - `normalizedEvidencePoint`
  - `preservedObservations`
- Vault projection: `docs/records.html`
- Backend validation/preservation:
  - `docs/backend/executors/declarative_target_score.py`
  - `docs/backend/executors/smart_evidence_capture.py`

These are shared target-execution roads. A target-specific CSS offset, geometry enlargement, coordinate rewrite, or 5-Spot exception is forbidden.

## Regression gate

`docs/production/ugo_location_authority_lock_test.mjs` protects the architecture record, identity binding, actual-image-content projection, canonical-coordinate preference, backend validation, and lifecycle projection seams.

The existing browser lifecycle regression remains the rendered-road proof across TARGET, RESULT, SEC, Vault, and exact reopen. Automated checks protect the invariant; Founder visual inspection remains acceptance for whether a stored UGO point projects onto the intended physical target point.

## Acceptance reference

The Founder-approved QT 5-Spot behavior is the visual acceptance reference. That approval applies to the result of this UGO projection road. It does not authorize a pixel-based location system.

