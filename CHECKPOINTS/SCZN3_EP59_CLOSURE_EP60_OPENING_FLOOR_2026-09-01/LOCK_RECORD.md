# Lock Record

The closure is locked when:

- Registry shows Episode 59 locked and Episode 60 active;
- SCMM v1.8, Snapshot 17, and both Episode 60 handoffs agree;
- production identities remain unchanged from Snapshot 16;
- Keepsakes #20 and #21 are indexed, checksummed, and restore-verified;
- closure archive, Git bundle, manifests, checksum, and fresh restore pass;
- a clean persistent Episode 60 worktree starts from the closure receipt commit;
- unrelated `.episode59-review-venv/` remains outside the admitted floor.
