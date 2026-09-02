# Baker M4 mechanical authority evidence

Date: 2026-09-02  
Status: Founder Approved authority closure / evidence preserved / runtime implementation pending

## Exact scope

- Publisher product: Baker Targets `ST-M16A2/M4`, M4 face
- Intended configuration: M4/M4A1 carbine, detachable carrying handle and standard front sight post
- Printed procedure: rear sight at the 300-meter `6/3` setting; do not use the `Z` mark
- Face geometry: ±21 horizontal and ±8 vertical grid extent

This evidence does not govern the separate Fort Benning `m4_25m_zero` Target Profile or replace its Founder-approved `1.75/0.75` authority.

## Primary authority

| Evidence | Exact support |
|---|---|
| FM 3-22.9, Change 1, 10 February 2011, Figure 5-19, document page 5-18 | M4 carbine face, ±21/±8 geometry, 300-meter `6/3` setting, and instruction not to use the elevation knob's `Z` mark |
| FM 3-22.9, Change 1, Table 5-5, document page 5-23 | M4 front sight post `1.5 MOA` per click and rear windage knob `0.75 MOA` per click |

- Official source: `https://api.army.mil/e2/c/downloads/363931.pdf`
- Verified source SHA-256: `56c9c9c32e1f19aaff4c8f6bf220208ce54960dadd62dff8a4b59db0b5a1d532`
- Publisher product page: `https://bakertargets.com/product/2-sided-25-meter-m16a2m4-zeroing-target/`
- Publisher M4 face image: `https://bakertargets.com/wp-content/uploads/2017/08/ST_M4-Carbine.jpg`

## Governed mechanics

| Desired result | Control | Value | Rotation and observer view |
|---|---|---:|---|
| Move POI up | Front sight post | `1.5 MOA/click` | Clockwise, viewed from above the post |
| Move POI down | Front sight post | `1.5 MOA/click` | Counterclockwise, viewed from above the post |
| Move POI right | Rear windage knob | `0.75 MOA/click` | Clockwise, viewed squarely at the exposed right-side knob face |
| Move POI left | Rear windage knob | `0.75 MOA/click` | Counterclockwise, viewed squarely at the exposed right-side knob face |

The observer-view phrases are the Founder-approved SCZN3 normalization of the physical operation. They remove ambiguity without changing the Army values or target procedure.

## Admission boundary

Authority is closed for architecture and future implementation specification. Final runtime admission still requires Baker production artwork or a physical specimen, exact registration evidence, an immutable Baker M4 QR identity, a Target Profile, and applicable road gates. No runtime registry or product behavior is changed by this record.

