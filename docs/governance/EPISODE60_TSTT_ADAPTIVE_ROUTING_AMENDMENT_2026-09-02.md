# Episode 60 — TSTT Adaptive Routing Amendment

Date: 2026-09-02

Status: Founder Approved / architecture amendment / implementation prohibited

## Decision

Snapshot 21 established the clean TSTT floor. This amendment adds two required dimensions before runtime implementation:

1. **Equipment-adaptive TSTT:** the exact target chooses the lesson, while the shooter's governed equipment/sight configuration chooses the applicable lesson branch.
2. **Result-adaptive TSTT:** governed results decide advancement; correction, adjustment, and confirmation repeat until the applicable confirmation standard is satisfied or a narrow governed hold prevents continuation.

> **Target determines the lesson.**
>
> **Equipment determines the branch.**
>
> **Results determine advancement.**

## Authority boundary

- Equipment Authority owns reusable mechanical facts for the resolved configuration.
- Target Authority owns whether that configuration applies to the exact target, target-specific procedure and overrides, calculation, execution, and confirmation requirements.
- Tap-n-Score owns evidence, measurement, authoritative correction/result packages, and confirmation classification.
- TSTT selects and explains only supported instruction. It does not infer equipment applicability, calculate corrections, define confirmation tolerances, or promote a shooter to confirmed status.

## Branch governance

- Irrelevant instruction is omitted. A shooter using an admitted optic branch does not receive unrelated iron-sight setup or adjustment teaching, and vice versa.
- Similar equipment names, shared click values, or a saved profile alone do not establish target applicability.
- Branch selection must be driven by governed configuration data and preserved authority identities.
- A change in dependent equipment/configuration requires branch resolution again.
- This is content/data routing through reusable owners. It is not authority to create target-, SKU-, firearm-, or optic-specific application-code branching.

## Result-loop governance

After each group, Tap-n-Score returns the governed state. TSTT then:

- returns for missing or insufficient evidence;
- enters the applicable equipment-adjustment branch when correction is required;
- remains at adjustment when application has not been acknowledged or recorded;
- repeats **Measure → Adjust → Confirm** when confirmation is not satisfied;
- advances only after authoritative confirmation;
- stops narrowly when authority is unavailable, contradictory, or mismatched.

The loop has no arbitrary number of attempts and no TSTT-authored pass standard. Every attempt uses new governed evidence and remains traceable through SEC, Vault, and exact reopen.

## Product-map effect

- **Universal MOA:** branch selection occurs at sight-row/configuration resolution; only the admitted CCO, M150/RCO, M4/M4A1 iron, M16-family iron, or later authority-complete branch is taught.
- **Baker M4:** the current admitted branch is standard detachable-carrying-handle/front-sight-post equipment. Other sight/optic configurations remain held pending exact target applicability and branch authority.
- **Baker M16A2:** the current admitted branch is the standard rear-sight/front-sight-post configuration. Rear-drum setup and return-to-300 finalization are shown only in that applicable branch.

All three maps loop from an unconfirmed confirmation result back through evidence, measurement, any newly returned correction, adjustment, and confirmation. Preservation is not the automatic next chapter after the first confirmation group.

## Implementation prohibition

This amendment authorizes governance records, map amendments, gap identification, and Snapshot 22 preservation only. It authorizes no TSTT runtime, Target Profile, QR, artwork, media, correction logic, Home availability, push, deployment, or commercial execution.

Snapshot 21 remains intact as the clean pre-amendment floor. Victory #2 and Snapshot 20 remain protected.
