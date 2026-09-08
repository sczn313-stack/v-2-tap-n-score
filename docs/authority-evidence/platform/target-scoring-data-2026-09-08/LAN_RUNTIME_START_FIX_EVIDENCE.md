# Shared Target Road — LAN Runtime Start Fix Evidence

Date: 2026-09-08  
Founder LAN origin: `http://192.168.1.90:8093`  
Source floor: `f2c75395f3468decc97c96fed67aa142fa7a8682`

## Root cause

The shared Target Execution runtime called secure-context-only Web Crypto surfaces directly:

- `crypto.randomUUID()` during session start and staged-action creation;
- `crypto.subtle.digest()` during target-image ingestion.

Loopback browser validation concealed the defect because browsers treat `localhost` as a trustworthy origin. The ordinary HTTP LAN origin did not expose `randomUUID`, so the road stopped before Session Authority with `crypto.randomUUID is not a function`.

## Shared correction

- One shared UUID function retains native `crypto.randomUUID()` when available and otherwise creates an RFC 4122 version-4 identifier using `crypto.getRandomValues()` (with a final uniqueness fallback).
- One shared SHA-256 function retains native SubtleCrypto when available and otherwise computes the same SHA-256 digest in the browser.
- Private-LAN target execution and Ballistic Vault requests use the existing same-origin review proxy.
- The existing curated Node review host admits the shared target page and stylesheet. No evidence directories are admitted by the review host.

No target IDs, scoring contracts, target-specific scoring code, new shooter road, or authority relaxation was added.

## Actual LAN browser evidence

All runs used the ordinary `192.168.1.90` origin at a 1180 × 900 viewport and uploaded the exact governed representation through the visible **LOAD / CAPTURE TARGET** control.

| Product | Actual LAN result | SEC | Exact reopen | Ballistic Vault |
|---|---:|---:|---:|---:|
| GunFun `22200` B27E Black | Numeric score `27` from three observations | PASS | PASS | PASS |
| Baker `SL-ST2` IDPA Silhouette | Penalty total `-3` | PASS | PASS | PASS |
| GunFun `22740` Vital Dude | `not_applicable`; printer defines no score | PASS | PASS | PASS |

This proves the corrected shared path across numeric scoring, penalty scoring, and truthful non-scoring preservation without changing target-specific production behavior.

## Regression evidence

- LAN runtime contract: PASS — UUID fallback, SHA-256 fallback, private-LAN same-origin authority, curated review-host admission.
- SHA-256 fallback matches Node cryptographic SHA-256 for empty, `abc`, and a 4,097-byte multi-block fixture.
- Nine-target shared-road browser suite at 1180px: 9/9 PASS.
- Nine-target shared-road browser suite at 390px: 9/9 PASS.
- Target Execution Contract routing/build admission: PASS.
- Production build: 426 public files plus M4 authority adapter.
