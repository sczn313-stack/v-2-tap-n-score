# Baker M16A2 mechanical authority evidence

Date: 2026-09-02  
Status: Founder Approved authority closure / evidence preserved / runtime implementation pending

## Exact scope

- Publisher product: Baker Targets `ST-M16A2/M4`, M16A2 face
- Intended configuration: M16A2 rifle, standard rear sight and front sight post
- Printed procedure: set the rear elevation knob to 300 meters, rotate clockwise one click past 300 for zeroing, then rotate counterclockwise one click back to 300 after zeroing
- Face geometry: ±27 horizontal and ±10 vertical grid extent

## Primary authority

| Evidence | Exact support |
|---|---|
| FM 3-22.9, Change 1, 10 February 2011, Figure 5-19, document page 5-18 | M16A2 face, ±27/±10 geometry, one-click-past-300 temporary setup, and one-click-back-to-300 finalization |
| FM 3-22.9, Change 1, Table 5-5, document page 5-23 | M16A2 front sight post `1.25 MOA` per click, rear windage knob `0.5 MOA` per click, and rear elevation knob `1 MOA` per click |

- Official source: `https://api.army.mil/e2/c/downloads/363931.pdf`
- Verified source SHA-256: `56c9c9c32e1f19aaff4c8f6bf220208ce54960dadd62dff8a4b59db0b5a1d532`
- Publisher product page: `https://bakertargets.com/product/2-sided-25-meter-m16a2m4-zeroing-target/`
- Publisher M16A2 face image: `https://bakertargets.com/wp-content/uploads/2017/08/ST_M16A2.jpg`

## Governed mechanics

| Desired result | Control | Value | Rotation and observer view | Purpose |
|---|---|---:|---|---|
| Move POI up | Front sight post | `1.25 MOA/click` | Clockwise, viewed from above the post | Shot-group correction |
| Move POI down | Front sight post | `1.25 MOA/click` | Counterclockwise, viewed from above the post | Shot-group correction |
| Move POI right | Rear windage knob | `0.5 MOA/click` | Clockwise, viewed squarely at the exposed right-side knob face | Shot-group correction |
| Move POI left | Rear windage knob | `0.5 MOA/click` | Counterclockwise, viewed squarely at the exposed right-side knob face | Shot-group correction |
| Prepare 25-meter zero | Rear elevation drum | `1 MOA/click` | Clockwise, viewed from above, one click past 300 | Temporary setup |
| Restore 300-meter zero | Rear elevation drum | `1 MOA/click` | Counterclockwise, viewed from above, one click back to 300 | Finalization |

The rear elevation drum is not the M16A2 shot-group elevation-correction control in this procedure. The front sight post owns group elevation correction; the rear drum owns the printed temporary setup and finalization relationship.

The observer-view phrases are the Founder-approved SCZN3 normalization of the physical operation. They remove ambiguity without changing the Army values or target procedure.

## Admission boundary

Authority is closed for architecture and future implementation specification. Final runtime admission still requires Baker production artwork or a physical specimen, exact registration evidence, an immutable Baker M16A2 QR identity, a Target Profile, and applicable road gates. No runtime registry or product behavior is changed by this record.

