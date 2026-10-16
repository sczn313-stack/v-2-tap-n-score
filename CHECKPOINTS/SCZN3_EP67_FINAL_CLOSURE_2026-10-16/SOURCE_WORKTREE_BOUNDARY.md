# Source Worktree Boundary

The authoritative source checkout contained extensive preexisting modified, deleted, and untracked work before Episode 67 closure. Closure therefore uses an explicit file manifest and never stages the repository wholesale.

The closure operation must not stash, reset, delete, overwrite, or silently absorb unrelated work. Master #407 practice-scoring implementation files that are not required to preserve the three package contracts remain outside the closure commit.

Clean-worktree verification is performed in a fresh detached worktree at the Episode 67 restore tag. The original source checkout is expected to remain dirty because its unrelated work is intentionally preserved in place.
