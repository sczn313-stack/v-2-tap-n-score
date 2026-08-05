# Future Backend Session Numbering Authority

## Status

Future architecture item. Not part of the current SEC / Ballistic Vault build.

## Current Founder-Approved Exception

The current build retains the existing device-local counter and zero-padded display format (`Session #001`). This identifier is temporary and non-authoritative. It must not be represented as an account-wide sequence.

## Future Authority Requirement

Backend-issued per-shooter session numbering requires a separately governed contract covering:

- authoritative shooter-account identity;
- server-owned number allocation;
- account-bound uniqueness and ordering;
- offline creation and reconciliation;
- collision handling;
- historical stability;
- migration of device-local identifiers; and
- API ownership, authentication, and failure behavior.

No frontend counter or inferred account identity may be promoted to account authority.
