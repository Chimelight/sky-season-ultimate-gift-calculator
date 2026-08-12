Run `git status` and `git diff HEAD` to see all changed and untracked files.

Present the full file list to the user clearly. Then suggest a logical grouping
into separate commits based on what each file does (e.g. refactor, new feature,
docs, bug fix). Show the suggested groups and proposed commit messages.

Ask the user to confirm the grouping or adjust it. Once confirmed, execute the
commits one at a time using `git add <specific files>` followed by `git commit` —
never use `git add .` or `git add -A`.

If any file needs to be partially staged (e.g. two unrelated changes in the same
file), flag it to the user and ask how to handle it rather than guessing.

## Also check the branch, not just the commits

Grouping a dirty tree into tidy commits does not help if they all land on a
branch whose name does not cover them. That has already happened here: eleven
commits shipped under `feat/react`, most of which had nothing to do with React.

Before committing, compare what is about to be added against what the branch
name promises:

```bash
git branch --show-current
git log --oneline main..HEAD
```

If the new work is a different theme, say so and offer to cut a new branch at
the current tip rather than widening the current one. The full convention —
stacking, splitting an existing branch, and verifying each branch in a stack
independently — is in CLAUDE.md under "Commits and Branches".

Commit messages end with the co-author line for the model doing the work, e.g.
`Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
