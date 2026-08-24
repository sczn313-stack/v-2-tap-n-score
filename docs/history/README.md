# SCZN3 History

This directory is the living historical record for SCZN3. It separates the story of how the platform developed from the engineering and governance checkpoints that changed what the platform could safely claim.

## Indexes

- [Episode Index](./episodes/README.md) — the narrative history of SCZN3
- [Milestone Index](./milestones/README.md) — major engineering and governance checkpoints
- [Episode Registry](../../governance/episode-registry/EPISODE_REGISTRY.json) — the single authoritative owner of episode identity
- [Governance Index](../governance/README.md) — active implementation and presentation governance

## Current locked archive

- [Rate Us + Founder Cleanup Lock](../../CHECKPOINTS/SCZN3_RATE_US_FOUNDER_CLEANUP_LOCK_2026-08-23/CHECKPOINT.md)
- [Rate Us + Founder Cleanup Restore Point](../../CHECKPOINTS/SCZN3_RATE_US_FOUNDER_CLEANUP_LOCK_2026-08-23/RESTORE_POINT.md)
- Episode 57 remains closed under its [Landing Page Closure](../../CHECKPOINTS/SCZN3_EP57_LANDING_PAGE_CLOSURE_2026-08-22/CHECKPOINT.md); the Rate Us lock is a post-closeout canonical platform snapshot and does not reopen the episode.

## Current working knowledge baseline

- [M-014 — Publisher OS 11-Publisher Knowledge Baseline](./milestones/M-014_PUBLISHER_OS_11_PUBLISHER_KNOWLEDGE_BASELINE.md)
- [Publisher OS 11-Publisher Founder Master Summary](../authority-evidence/publisher-os/PUBLISHER_OS_11_PUBLISHER_MASTER_SUMMARY_2026-08-21.md)
- [Thompson — Publisher #12](../authority-evidence/publisher-os/2026-08-23-thompson-publisher-12/REPORT.md) is additive to the historical 11-publisher master summary and establishes the current **12-publisher / 1,792-identity / 2,709-offering** P-OS baseline.

## Current episode

- [Episode 58 — Equipment Library](./episodes/EPISODE_58_EQUIPMENT_LIBRARY.md) is active.
- [Episode 58 New-Agent Handoff](./episodes/EPISODE_58_NEW_AGENT_HANDOFF.md) is the concise starting point.
- [Weapon Library Full-Catalog Intelligence Study](../authority-evidence/publisher-os/2026-08-23-weapon-library-full-catalog-intelligence/README.md) is the starting evidence baseline.
- [Snapshot 12 — Episode 58 Equipment Library Continuity Baseline](./snapshots/SNAPSHOT_012_EPISODE_58_EQUIPMENT_LIBRARY_CONTINUITY_BASELINE.md) locks the Founder-approved Episode 58 starting context.
- Rate Us + Founder cleanup remains the canonical locked implementation state beneath Episode 58. Survey remains not Founder Approved. The continuity lock authorizes no Equipment Library implementation, Publisher #13, push, deployment, or production change.

## Evidence policy

History entries must be supported by repository evidence such as:

- committed source or documentation;
- commit subjects, dates, and diffs;
- committed architecture or roadmap documents;
- committed executable tests;
- committed screenshots or authority proofs.

Conversation memory, filenames without supporting content, and inferred intent are not sufficient on their own. When the repository establishes that work occurred but does not establish its exact chronology, episode assignment, or original rationale, the uncertain field must be marked **Needs Review**.

## Relationship between episodes and milestones

An episode tells the story: the problem, discovery, decisions, and outcome.

A milestone records the checkpoint: why it mattered, how architecture or governance changed, and which committed evidence proves it.

One episode may produce several milestones. One milestone may also represent work spanning several episodes.

## Status vocabulary

- **Completed** — committed evidence establishes that the described checkpoint was delivered.
- **Architecture Baseline** — a governing architecture document has been committed for continued platform use.
- **Architecture Locked** — the governing architecture is committed, but implementation may still be pending.
- **Implementation Pending** — implementation is explicitly outside the completed checkpoint.
- **Needs Review** — chronology, episode numbering, or another historical claim cannot be confirmed from current repository evidence.
- **Superseded** — later work replaced the checkpoint while preserving its historical importance.

## Maintenance rules

1. Add entries in evidence-backed chronological order.
2. Do not renumber historical episodes without documented approval.
3. Milestone numbers are catalog identifiers, not claims about unpublished company chronology.
4. Link related episodes and milestones in both directions.
5. Use full or abbreviated Git commit hashes that resolve in this repository.
6. Never rewrite an uncertain claim as fact without new evidence.
7. Keep historical documentation commits separate from production implementation commits.
