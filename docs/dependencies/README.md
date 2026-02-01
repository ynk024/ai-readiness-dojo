# Dependency Graphs

This directory contains automatically generated dependency graphs and circular dependency reports for the AI Readiness Dojo monorepo.

## Files

| File                   | Description                               | Updated                            |
| ---------------------- | ----------------------------------------- | ---------------------------------- |
| `client-circular.json` | Circular dependency report for client app | Every commit (via pre-commit hook) |
| `server-circular.json` | Circular dependency report for server app | Every commit (via pre-commit hook) |
| `client-deps.json`     | Full dependency graph for client app      | Every commit (via pre-commit hook) |
| `server-deps.json`     | Full dependency graph for server app      | Every commit (via pre-commit hook) |

## What's in these files?

### Circular Dependency Reports

Empty array `[]` means no circular dependencies found (good!):

```json
[]
```

If circular dependencies exist, you'll see chains like:

```json
[
  ["src/A.ts", "src/B.ts", "src/A.ts"],
  ["src/X.ts", "src/Y.ts", "src/Z.ts", "src/X.ts"]
]
```

### Dependency Graphs

JSON object mapping each file to its dependencies:

```json
{
  "domain/entities/team.ts": [
    "domain/value-objects/team-value-objects.ts",
    "shared/errors/domain-errors.ts"
  ],
  "application/use-cases/create-team.ts": [
    "domain/entities/team.ts",
    "domain/repositories/team-repository.ts"
  ]
}
```

## How are these generated?

These files are **automatically generated and committed** by the pre-commit git hook using [madge](https://github.com/pahen/madge).

**Workflow:**

1. Developer runs `git commit`
2. Pre-commit hook runs `pnpm deps:graph`
3. Madge analyzes the codebase and generates JSON reports
4. Reports are staged and included in the commit
5. Commit proceeds (or blocked if circular dependencies found)

## Why commit these files?

1. **Historical tracking** - Track how dependencies evolve over time
2. **Code review** - Reviewers can see dependency changes in PRs
3. **AI context** - AI agents can read graphs to understand module relationships
4. **Documentation** - Living documentation of system architecture
5. **Diff visibility** - See when new dependencies are introduced

## Manual regeneration

To manually regenerate these files:

```bash
# Generate all graphs
pnpm deps:graph

# Check for circular dependencies
pnpm circular:check

# Analyze coupling
pnpm deps:check-coupling
```

## Analysis examples

Using `jq` to query dependency graphs:

```bash
# Find files with most dependencies
cat docs/dependencies/server-deps.json | jq 'to_entries | map({file: .key, deps: (.value | length)}) | sort_by(.deps) | reverse | .[0:10]'

# Find most imported files (core modules)
cat docs/dependencies/server-deps.json | jq '[.[] | .[] ] | group_by(.) | map({file: .[0], importedBy: length}) | sort_by(.importedBy) | reverse'

# Check specific file's dependencies
cat docs/dependencies/server-deps.json | jq '.["domain/entities/team.ts"]'
```

## See also

- Root `README.md` - Full dependency analysis documentation
- `AGENTS.md` - AI agent guide with madge usage
- `scripts/check-coupling.js` - Coupling analysis script
