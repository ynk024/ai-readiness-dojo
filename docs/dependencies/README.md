# Dependency Graphs

This directory contains automatically generated dependency graphs for the AI Readiness Dojo monorepo.

## Files

| File                  | Description                          | Updated                            |
| --------------------- | ------------------------------------ | ---------------------------------- |
| `client-deps.json`    | Full dependency graph for client app | Every commit (via pre-commit hook) |
| `server-deps.json`    | Full dependency graph for server app | Every commit (via pre-commit hook) |
| `client-metrics.json` | Code quality metrics for client app  | Every commit (via pre-commit hook) |
| `server-metrics.json` | Code quality metrics for server app  | Every commit (via pre-commit hook) |

## What's in these files?

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

### Metrics Reports

JSON object containing comprehensive code quality metrics:

```json
{
  "metadata": {
    "timestamp": "2026-02-01T14:30:00.000Z",
    "app": "server",
    "generator": "generate-metrics.js v1.0.0"
  },
  "summary": {
    "totalModules": 37,
    "totalDependencies": 142,
    "graphDensity": 0.107,
    "avgFanOut": 3.84,
    "avgFanIn": 3.84,
    "healthScore": 85,
    "status": "PASS"
  },
  "circular": {
    "cycleCount": 0,
    "avgCycleLength": 0,
    "modulesInCycles": 0,
    "percentageInCycles": 0,
    "cycles": []
  },
  "coupling": {
    "avgFanOut": 3.84,
    "maxFanOut": 12,
    "criticalCoupling": [],
    "highCoupling": [...],
    "godModules": []
  },
  "depth": {
    "longestChain": 6,
    "avgDepth": 2.3,
    "criticalDepth": [],
    "deepModules": [...]
  },
  "cohesion": {
    "byDirectory": {
      "domain/": {
        "totalModules": 12,
        "internalImports": 45,
        "externalImports": 3,
        "cohesionScore": 93.8
      }
    }
  },
  "graph": {
    "nodeCount": 37,
    "edgeCount": 142,
    "density": 0.107
  },
  "topModules": {
    "mostCoupled": [...],
    "mostDepended": [...],
    "deepest": [...]
  },
  "violations": {
    "critical": [],
    "warnings": [...]
  },
  "healthScore": {
    "overall": 85,
    "breakdown": {
      "coupling": 90,
      "depth": 85,
      "cohesion": 95,
      "modularity": 75
    }
  }
}
```

#### Metrics Explained

**Circular Dependencies:**

- Number of circular dependency cycles detected
- Average cycle length (number of modules in a cycle)
- Percentage of modules involved in cycles
- List of all cycles with module paths

**Coupling Metrics (Fan-in/Fan-out):**

- **Fan-out**: Number of dependencies a module imports
- **Fan-in**: Number of modules that depend on a module
- **Critical coupling**: Modules with >20 imports (blocks commit)
- **High coupling**: Modules with 10-20 imports (warning)
- **God modules**: Modules with both fan-in and fan-out >15 (blocks commit)

**Dependency Depth:**

- **Longest chain**: Maximum depth of dependency chains
- **Average depth**: Mean depth across all modules
- **Critical depth**: Chains >8 levels (blocks commit)
- **Deep modules**: Chains 6-8 levels (warning)

**Cohesion (per directory):**

- **Internal imports**: Imports within the same directory
- **External imports**: Imports from other directories
- **Cohesion score**: Percentage of internal vs total imports
- Higher cohesion (>80%) indicates well-defined module boundaries

**Graph Complexity:**

- **Node count**: Total number of modules
- **Edge count**: Total number of import relationships
- **Density**: Percentage of actual vs possible connections
- **Critical density**: >30% (blocks commit)
- **High density**: 20-30% (warning)

**Health Score:**

- Overall score (0-100) based on four categories:
  - **Coupling**: Based on average fan-out
  - **Depth**: Based on average dependency depth
  - **Cohesion**: Based on directory cohesion scores
  - **Modularity**: Based on graph density
- Score bands:
  - 90-100: Excellent
  - 75-89: Good
  - 50-74: Needs attention
  - 0-49: Critical

#### Quality Gates

**🔴 BLOCKING (Exit Code 1):**

- Fan-out >20 (critical coupling)
- Dependency chain depth >8 (excessive depth)
- Graph density >30% (everything depends on everything)
- God modules (both fan-in and fan-out >15)

**⚠️ WARNING (Exit Code 0):**

- Fan-out 10-20 (high coupling)
- Fan-in >15 (high centrality)
- Dependency chain depth 6-8 (moderate depth)
- Graph density 20-30% (high density)

**Exemptions:**

- DI containers (`**/di/container.ts`)
- Entry points (`index.ts`, `main.ts`)

These files are composition roots and naturally have high coupling.

## What about circular dependency reports?

Circular dependency checks (`*-circular.json`) are **NOT persisted** because:

- They would always be empty arrays `[]` for successful commits
- The pre-commit hook blocks any commits with circular dependencies
- No value in tracking empty arrays in git history

Circular checks are run on every commit but output to `/tmp/` (not committed).

## How are these generated?

These files are **automatically generated and committed** by the pre-commit git hook using [madge](https://github.com/pahen/madge).

**Workflow:**

1. Developer runs `git commit`
2. Pre-commit hook runs `pnpm deps:graph`
3. Madge analyzes the codebase and generates JSON dependency graphs
4. Pre-commit hook runs `pnpm circular:check` (blocks commit if any found)
5. Pre-commit hook runs `pnpm deps:metrics` (may block on critical violations)
6. Metrics generation script analyzes dependency graphs
7. Code quality metrics reports are generated
8. Dependency graphs and metrics are staged and included in the commit
9. Pre-commit hook runs `pnpm deps:check-coupling` (warnings only, non-blocking)
10. Commit proceeds if no critical issues

## Why commit these files?

1. **Historical tracking** - Track how dependencies and code quality evolve over time
2. **Code review** - Reviewers can see dependency and quality changes in PRs
3. **AI context** - AI agents can read graphs and metrics to understand module relationships and identify refactoring opportunities
4. **Documentation** - Living documentation of system architecture and health
5. **Diff visibility** - See when new dependencies are introduced or quality degrades
6. **Trend analysis** - Compare metrics across commits to track improvements or regressions

## Manual regeneration

To manually regenerate these files:

```bash
# Generate dependency graphs
pnpm deps:graph

# Generate code quality metrics
pnpm deps:metrics

# Generate both at once
pnpm deps:graph && pnpm deps:metrics

# Check for circular dependencies (output to /tmp/)
pnpm circular:check

# Analyze coupling (console output only)
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

Using `jq` to query code quality metrics:

```bash
# Check overall health score
jq '.summary.healthScore' docs/dependencies/server-metrics.json

# Get status (PASS/WARN/FAIL)
jq '.summary.status' docs/dependencies/server-metrics.json

# Find most coupled modules (top 5)
jq '.topModules.mostCoupled[0:5]' docs/dependencies/server-metrics.json

# Find most depended-on modules (core modules)
jq '.topModules.mostDepended[0:5]' docs/dependencies/server-metrics.json

# Check for critical violations
jq '.violations.critical | length' docs/dependencies/server-metrics.json

# List all warnings
jq '.violations.warnings[] | {file: .file, message: .message}' docs/dependencies/server-metrics.json

# Directory cohesion scores (sorted)
jq '.cohesion.byDirectory | to_entries | map({dir: .key, score: .value.cohesionScore}) | sort_by(.score)' docs/dependencies/server-metrics.json

# Find refactoring candidates (high coupling)
jq '[.coupling.highCoupling[], .coupling.criticalCoupling[]] | map(.file)' docs/dependencies/server-metrics.json

# Compare health scores between client and server
jq -s '.[0].summary.healthScore as $client | .[1].summary.healthScore as $server | {client: $client, server: $server, diff: ($server - $client)}' docs/dependencies/client-metrics.json docs/dependencies/server-metrics.json

# Find modules with longest dependency chains
jq '.topModules.deepest[0:5]' docs/dependencies/server-metrics.json

# Get health score breakdown
jq '.healthScore.breakdown' docs/dependencies/server-metrics.json

# Check if any circular dependencies exist
jq '.circular.cycleCount' docs/dependencies/server-metrics.json

# List all God modules (if any)
jq '.coupling.godModules' docs/dependencies/server-metrics.json

# Find directories with low cohesion (<60%)
jq '.cohesion.byDirectory | to_entries | map(select(.value.cohesionScore < 60)) | map({dir: .key, score: .value.cohesionScore})' docs/dependencies/server-metrics.json
```

## See also

- Root `README.md` - Full dependency analysis documentation
- `AGENTS.md` - AI agent guide with madge usage
- `scripts/check-coupling.js` - Coupling analysis script
