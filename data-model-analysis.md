Cool — here’s a **simple domain model + Firestore document model** for the “automated-only” MVP:

- **Only automated quests can be completed** (derived from scan reports)
- **No evidence, no manual verification**
- **No “store” mechanics** (no rewards/shop)
- **Quests have levels**
- **Quests are grouped by category** (= quest groups)
- Central platform, team-level tracking, champion-managed (but champion doesn’t verify anything yet)

---

## Domain model (MVP)

### Concepts

- **Quest**: an automated requirement that can be `complete` or `incomplete`
- **QuestGroup**: a set of quests grouped by `category`
- **Level**: an integer maturity step (quests belong to levels; team level is derived)
- **ScanRun**: one ingestion event that yields results for multiple quests
- **CompletionState**: the current completion status of each quest for a team (derived)

### Aggregates

#### 1) `QuestCatalog` (org-owned)

- Holds all quests, each with:
  - `key` (stable)
  - `category`
  - `level`
  - `weight` (optional; can be 1)
  - `automationSpec` (optional, minimal for now)

#### 2) `TeamReadiness` (team-owned)

- Derived from latest scan results across repos in that team:
  - completion map of quest statuses
  - computed team “level”
  - per-category progress

### Domain services

- **IngestScanRun**
  - input: scan report (repo + observations)
  - output: updates team’s `QuestCompletionState` based on observed automated checks

- **ComputeReadinessSummary**
  - computes:
    - completion per quest
    - completion per category
    - overall team level (e.g., highest level where all quests up to that level are complete)

### Rules (simple and deterministic)

- A quest is **complete** if latest known status for that quest is `pass`
- If a quest is never observed → `unknown` (treated as incomplete)
- Team level = **max level L** such that **all quests with level ≤ L are complete**
  - (You can later change to thresholds/percentages)

---

## Firestore data model (MVP)

### Collections

- `teams/{teamId}`
- `repos/{repoId}`
- `quests/{questId}` (catalog)
- `scanRuns/{scanRunId}` (history, optional but helpful)
- `teams/{teamId}/readiness/latest` (derived, query-friendly)
- `repos/{repoId}/readiness/latest` (derived)

This keeps reads cheap and avoids joins.

---

# 1) Quest catalog

### `quests/{questId}`

```json
{
  "key": "docs.agents_md_present",
  "title": "AGENTS.md exists",
  "category": "documentation",
  "level": 1,
  "active": true,

  "automation": {
    "type": "file_exists",
    "params": { "path": "AGENTS.md" }
  },

  "createdAt": "...",
  "updatedAt": "..."
}
```

**Notes**

- `automation` is intentionally tiny; you can grow it later or even ignore it and rely on the scanner to emit `questKey`s.
- `category` is your quest group.

---

# 2) Teams & repos

### `teams/{teamId}`

```json
{
  "name": "Payments Platform",
  "slug": "payments-platform",
  "championUserId": "user_123",
  "repoIds": ["repo_a", "repo_b"],
  "createdAt": "...",
  "updatedAt": "..."
}
```

### `repos/{repoId}`

```json
{
  "provider": "github",
  "fullName": "org/repo",
  "url": "https://github.com/org/repo",
  "defaultBranch": "main",
  "teamId": "team_abc",
  "archived": false,
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

# 3) Scan runs (optional but recommended)

### `scanRuns/{scanRunId}`

```json
{
  "teamId": "team_abc",
  "repoId": "repo_a",
  "commitSha": "7a0137...",
  "refName": "main",
  "providerRunId": "21545800679",
  "runUrl": "https://github.com/.../runs/...",
  "workflowVersion": "1.0.0",
  "scannedAt": "2026-01-31T17:39:21.414Z",

  "questResults": {
    "docs.agents_md_present": "pass",
    "quality.coverage_threshold_met": "fail",
    "security.codeql_present": "pass"
  }
}
```

This is the normalized “only what we need” view—**not** the full raw report.

If you do want raw for debugging, add:

- `scanRuns/{id}.raw` → store separately, or
- `scanRuns/{id}.rawPayload` (careful with size)

---

# 4) Repo readiness snapshot (derived)

### `repos/{repoId}/readiness/latest`

```json
{
  "repoId": "repo_a",
  "teamId": "team_abc",
  "computedFromScanRunId": "scan_999",
  "updatedAt": "...",

  "quests": {
    "docs.agents_md_present": { "status": "complete", "level": 1, "lastSeenAt": "..." },
    "security.codeql_present": { "status": "complete", "level": 2, "lastSeenAt": "..." },
    "quality.coverage_threshold_met": { "status": "incomplete", "level": 2, "lastSeenAt": "..." }
  }
}
```

**Why include `level` here?**
It avoids a catalog lookup for common UI displays. If you want to keep it ultra-pure, omit it and join in app code.

---

# 5) Team readiness snapshot (derived)

### `teams/{teamId}/readiness/latest`

```json
{
  "teamId": "team_abc",
  "updatedAt": "...",

  "level": 1,

  "summary": {
    "totalQuests": 12,
    "completedQuests": 7
  },

  "byCategory": {
    "documentation": { "total": 2, "completed": 2 },
    "quality": { "total": 5, "completed": 3 },
    "security": { "total": 3, "completed": 2 },
    "agent": { "total": 2, "completed": 0 }
  },

  "quests": {
    "docs.agents_md_present": { "status": "complete", "level": 1 },
    "security.codeql_present": { "status": "complete", "level": 2 },
    "quality.coverage_threshold_met": { "status": "incomplete", "level": 2 }
  }
}
```

**Aggregation rule (simple):**

- Team quest status is `complete` if **all repos in the team** satisfy it, OR if **any repo** satisfies it—pick one:
  - **Strict mode (recommended):** require all repos
  - **Pragmatic mode:** require at least one “reference repo”

For MVP, I’d implement **strict**, but you can store the chosen mode in `teams/{teamId}.aggregationMode`.

---

## Derived “Team level” computation (simple)

- Let `L = max level` such that for **every quest with level ≤ L**, team quest status is `complete`.

This gives a clean “unlock” progression.

---

## What to keep flexible for later

- Quest definitions can evolve: add `weight`, `deprecated`, `replacementKey`
- Add regression tracking later: `teams/{teamId}/readiness/history/{date}`
- Add multi-team repos later with a `team_repos` mapping collection

---

## Minimal endpoints implied by this model

- `POST /ingest-scan` → creates `scanRuns/{id}`, updates repo+team readiness snapshots
- `GET /teams/{teamId}/readiness` → returns `teams/{id}/readiness/latest`
- `GET /repos/{repoId}/readiness` → returns `repos/{id}/readiness/latest`
- `GET /quests` → quest catalog for UI grouping by category + level

---

If you want, I can also provide a **tiny TS type set** (domain + DTOs) and a **Firestore repository abstraction** (outbound port) that reads/writes exactly these docs.
