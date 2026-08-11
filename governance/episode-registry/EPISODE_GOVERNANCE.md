# SCZN3 Episode Governance

## Authoritative owner

`EPISODE_REGISTRY.json` is the single authoritative owner of SCZN3 episode identity.

Narrative indexes, README files, checkpoint folders, ZIP names, Git commit messages, deployment records, and conversational references are projections or evidence. They do not create or renumber an episode.

## Permanent closure rule

> **No episode may be created until the previous episode has been authoritatively closed.**

An episode exists only after its integer number and title are entered in the Episode Registry. Fractional episode numbers are prohibited.

## Ownership fields

Every registered episode owns exactly one authoritative value for:

- Episode Number
- Title
- Status
- Date
- Checkpoint
- ZIP
- Commit or paired commits
- Production Release
- Archive Location

An episode may list historical aliases and related artifacts. An alias never becomes a second authoritative identity.

## Status and concurrency

- At most one episode may have status `active`.
- A new active episode must equal `lastClosedEpisode + 1`.
- The preceding episode must be `closed` or `locked` before the new entry is created.
- Planning documents, Founder-review drafts, snapshots, and milestones do not make another implementation episode active.
- Historical unresolved slots remain reserved. They may be resolved only from evidence and may never be reused for new work.

## Required creation gate

Before creating an episode:

1. Run `node governance/episode-registry/validate_episode_registry.mjs`.
2. Confirm that no episode is active.
3. Confirm that the proposed number equals `nextEpisodeNumber`.
4. Confirm that `lastClosedEpisode` is closed or locked.
5. Add the new episode with status `active`, advance `nextEpisodeNumber` to the following reserved integer, and add no checkpoint, ZIP, commits, production release, or archive claims that do not yet exist.
6. Run the validator again.

## Required closure gate

Before closing an episode, the registry must contain the final title, date, checkpoint identity, archive location, ZIP identity when applicable, commit identity, and production release identity when applicable. Missing fields must remain `null`; they may not be inferred.

Closure changes status to `closed` or `locked`, advances `lastClosedEpisode`, clears `activeEpisode`, and advances `nextEpisodeNumber` by exactly one.

## Checkpoint, archive, ZIP, commit, and release gate

Before any checkpoint, ZIP, commit announcement, archive, or production release is represented as episode-owned, registry validation must confirm:

- no duplicate episode number;
- no skipped episode slot;
- no parallel active episode;
- no conflicting status;
- no duplicate checkpoint identity;
- no duplicate ZIP identity;
- no duplicate archive identity;
- no conflicting production deployment reference;
- the artifact's episode number matches its registry owner.

The artifact name must be generated from the registry number. Existing historical artifacts with incorrect names remain immutable evidence and are recorded under `legacyAliases`.

## Snapshot rule

Development snapshots use their own registry and never assign, advance, close, or reopen an episode. Snapshot numbers and episode numbers are independent namespaces.

## Preservation rule

Historical Git commits, signed tags, ZIP files, and checksum records are immutable. Reconciliation uses registry aliases, supersession notes, or non-destructive canonical copies. It never rewrites Git history or silently replaces a historical archive.

## Validation command

```text
node governance/episode-registry/validate_episode_registry.mjs
```

Validation failure blocks episode creation, checkpoint naming, ZIP naming, commit announcement, archival designation, and production release designation.
