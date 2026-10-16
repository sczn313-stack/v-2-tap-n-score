# Episode 67 Restore Point

The exact restoration checkpoint is the annotated Git tag:

`episode67-final-closure-2026-10-16`

After the closure commit is created, verify it with:

```bash
git rev-parse episode67-final-closure-2026-10-16^{commit}
git worktree add --detach /tmp/sczn3-episode67-restore-test episode67-final-closure-2026-10-16
```

The detached worktree must be clean and the Episode 67 focused suite must pass there. Restoring this checkpoint does not include unrelated preexisting dirty files from the source worktree.

No remote deployment or push is implied by this restore point.
