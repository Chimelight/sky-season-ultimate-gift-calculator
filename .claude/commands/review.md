Review the pending changes on the current branch.

Run these in parallel to gather context:
- `git status` — see changed/untracked files
- `git diff main...HEAD` — full diff vs main
- `git log main..HEAD --oneline` — commits on this branch

Read CLAUDE.md to refresh project conventions (spacing, control heights, typography, responsive rules, colors). For each non-trivial changed file, read it in full — diffs lose context.

Produce a review organized by severity:

1. **Bugs / correctness** — logic errors, broken types, missing null checks, race conditions, off-by-one.
2. **Convention violations** — deviations from CLAUDE.md design tokens (spacing, `h-8`/`h-9`, typography roles, `text-fluid-*`, container queries, `ch` units, no inline `style={}`, no `hidden sm:*`, no truncation of user/translated content).
3. **Regression / lost functionality** — features silently removed or behavior quietly changed. This happens often with AI edits. Cross-check the diff for:
   - Deleted branches, handlers, effects, or props that had real callers before.
   - Reducer actions, i18n keys, or exports removed but still referenced elsewhere — grep the codebase for each removed identifier.
   - Conditions narrowed (e.g. `if (a && b)` → `if (a)`), early returns added, loops shortened, fallbacks stripped.
   - Removed `useEffect` dependencies, event listeners, or cleanup functions.
   For every `-` line that isn't obvious cleanup, ask: "was this load-bearing?" If unsure, flag it and ask the user to confirm intent.
4. **Redundancy / 屎山 (dead or duplicated code)** — now-unused functions, imports, state fields, props, types, i18n keys, or branches that the current diff made dead. Also flag near-duplicated logic that should collapse into a shared helper in `src/lib/`. Grep to confirm something is truly unused before recommending deletion.
5. **Architecture / reuse** — components not following the `config/` `spirits/` `ultimates/` `result/` split, state mutations outside the reducer, i18n strings hardcoded instead of going through `t()`.
6. **Responsive / i18n risk** — anything that could break at 280px or under a 1.6×-expansion language (Bengali). Flag fixed-width slots holding translated text.
7. **Nits** — naming, stray comments, minor simplifications.

For each finding, cite `file:line` with a markdown link and quote the offending snippet. Propose a concrete fix, not a vague suggestion. If a finding depends on runtime behavior you can't verify, say so.

End with a one-line verdict: ship / fix-then-ship / rework.

Do not edit files — this is review only. If the user asks to apply fixes afterward, do it in a follow-up turn.
