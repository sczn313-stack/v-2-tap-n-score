# SCZN3 History

This directory is the living historical record for SCZN3. It separates the story of how the platform developed from the engineering and governance checkpoints that changed what the platform could safely claim.

## Indexes

- [Episode Index](./episodes/README.md) — the narrative history of SCZN3
- [Milestone Index](./milestones/README.md) — major engineering and governance checkpoints

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
