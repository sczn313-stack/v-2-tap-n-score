# Episode 56 Lock Record

Episode 56 is locked when all of the following are true:

- the Episode Registry identifies Episode 56 as the last closed episode and no active episode;
- Snapshot 8, M-013, and the Founder-approved mental model are indexed;
- the governed validation suite passes;
- the archive directory contains the working overlay, Git bundle, metadata, manifests, and verification evidence;
- the outer ZIP passes `unzip -t` and matches its SHA-256 sidecar;
- clean extraction and internal checksum verification pass.

No commit, push, deployment, production promotion, Publisher OS implementation, or QR publication is part of this lock.
