# /release — Create a GitHub Release and notify Discord

Follow these steps exactly, in order. Do not skip steps.

## Step 1 — Gather context

Run these commands:

```bash
# Last release tag (empty if none)
git describe --tags --abbrev=0 2>/dev/null || echo "NONE"

# GitHub repo name
gh repo view --json nameWithOwner -q .nameWithOwner

# Commits since last tag (or all commits if no tags)
LAST=$(git describe --tags --abbrev=0 2>/dev/null); \
if [ -z "$LAST" ]; then git log --oneline --no-merges; \
else git log "$LAST"..HEAD --oneline --no-merges; fi
```

## Step 2 — Draft release notes

Analyze the commits and produce:
- A short **title** without version number (e.g. "Sky Season Ultimate Gift Calculator"). The version is prepended automatically in the Discord embed, so do not repeat it in the title.
- A **version number** following semver (bump patch for fixes/content, minor for new features, major for breaking changes). Prefix with `v`.
- **Release notes** in English with sections:
  - ✨ New
  - 🐛 Fixed
  - 🔧 Improvements
  - (omit empty sections)

**Read the previous release first** — `gh release view <last-tag> --json body -q .body`.
It is the source of truth for formatting; do not infer the format, copy it.

The exact shape, which the notes must match character for character:

```
✨ New
- Item
- Item

🔧 Improvements
- Item

[Try it ↗](https://chimelight.github.io/sky-season-ultimate-gift-calculator/)
```

- Section headers are a **plain line** — no `##`, no bold. `##` renders as an
  oversized heading inside a Discord embed and swamps the message.
- **No blank line between a header and its items.** One blank line between
  sections.
- Every item starts with `- `. Plain lines with no bullet collapse into a single
  paragraph on GitHub.
- Items are plain text, no bold (`**`).
- Use backticks for technical terms (e.g. `localStorage`, `iOS Safari`, `GitHub Pages`).
- Write for end users — visible behaviour, not implementation details.
- Only list fixes users actually experienced. Regressions introduced and fixed
  within the same unreleased cycle never reached anyone; listing them misleads.

## Step 3 — Confirm with user

Show the proposed version, title, and release notes. Ask:
> "发布这个版本吗？或者需要修改版本号 / 内容？"

Wait for explicit confirmation before proceeding. If the user edits anything, update accordingly.

## Step 4 — Merge main into release

First confirm `main` actually contains the work. If it does not, releasing
publishes nothing and the notes describe code no one can load:

```bash
git fetch origin --quiet
git rev-list --count origin/main..<work-branch>   # must be 0
```

`main` and `release` are both protected and reject direct pushes, so promote
through PRs (`required_approving_review_count` is 0, so they can be self-merged):

```bash
gh pr create --base release --head main --title "Release <VERSION>" --body "..."
gh pr merge <n> --merge
```

Pages builds via `.github/workflows/deploy.yml`, not by serving the branch
verbatim — the repo root holds Vite sources, and publishing those yields a blank
page. Confirm the build type and wait for the deploy before announcing:

```bash
gh api repos/{owner}/{repo}/pages -q .build_type    # must be "workflow"
gh run list --workflow=deploy.yml --limit 1
```

## Step 5 — Create GitHub Release

```bash
gh release create {VERSION} \
  --title "{TITLE}" \
  --notes "{RELEASE_NOTES}"
```

Get the release URL from the output (format: `https://github.com/.../releases/tag/...`).

## Step 6 — Post to Discord

Read the webhook URL:
```bash
grep DISCORD_RELEASES_WEBHOOK .claude/release.env | cut -d= -f2-
```

Get the current UTC timestamp:
```bash
date -u +"%Y-%m-%dT%H:%M:%S.000Z"
```

Post with `?wait=true` and **keep the returned message id**. Without it a
formatting mistake can only be corrected by posting a second message, which
leaves a duplicate in the channel that cannot be removed:

```bash
curl -s -w "\n%{http_code}" \
  -H "Content-Type: application/json" \
  -d '{
    "embeds": [{
      "title": "🚀 {VERSION} — {TITLE}",
      "description": "{RELEASE_NOTES_ESCAPED}",
      "color": 5814783,
      "url": "{RELEASE_URL}",
      "footer": { "text": "Sky Season Ultimate Gift Calculator" },
      "timestamp": "{ISO_TIMESTAMP}"
    }]
  }' \
  "{WEBHOOK_URL}?wait=true"
```

To correct an already-posted release, PATCH it rather than re-posting:

```bash
curl -s -o /dev/null -w "%{http_code}" -X PATCH \
  -H "Content-Type: application/json" -d '{...}' \
  "{WEBHOOK_URL}/messages/{MESSAGE_ID}"
```

**A PATCH replaces the embed wholesale — it does not merge fields.** Any key
left out of the payload is dropped, so omitting `timestamp` silently removes
the date under the message. Fetch the message first and edit the embed you get
back, rather than rebuilding it by hand:

```bash
curl -s "{WEBHOOK_URL}/messages/{MESSAGE_ID}"   # take .embeds[0], change only what is wrong
```

Rules for the JSON payload:
- Escape all `"` inside strings as `\"`
- Escape all newlines as `\n`
- `color` 5814783 = #589EFF (blue)
- `ISO_TIMESTAMP` = output from the `date` command above

`204` (or `200` with `?wait=true`) means success. Report the result.

## Step 7 — Verify, then report

Load the published site before declaring success — a green deploy still serves
whatever was built:

```bash
curl -s https://chimelight.github.io/sky-season-ultimate-gift-calculator/ | grep -o 'src="[^"]*"'
```

The entry script must point at a built asset under `/assets/`. If it points at
`/src/main.tsx`, sources were published and the page will be blank.

Tell the user:
- The GitHub Release URL
- Whether the Discord notification succeeded, and the message id
- That the live site was loaded and renders
