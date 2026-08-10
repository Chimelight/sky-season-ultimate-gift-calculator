Run `git status` and `git diff HEAD` to see all changed and untracked files.

Present the full file list to the user clearly. Then suggest a logical grouping into separate commits based on what each file does (e.g. refactor, new feature, docs, bug fix). Show the suggested groups and proposed commit messages.

Ask the user to confirm the grouping or adjust it. Once confirmed, execute the commits one at a time using `git add <specific files>` followed by `git commit` — never use `git add .` or `git add -A`. Each commit message must end with:

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>

If any file needs to be partially staged (e.g. two unrelated changes in the same file), flag it to the user and ask how to handle it rather than guessing.
