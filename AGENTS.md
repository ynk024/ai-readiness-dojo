# Agent Guide for AI Readiness Dojo

This document provides essential information for AI coding agents working in this repository.

## Project Overview

This is a **pnpm monorepo** with TypeScript, featuring:

- **Client**: Svelte 5 + Vite frontend (apps/client)
- **Server**: Fastify backend with Hexagonal Architecture (apps/server)
- **Architecture**: Hexagonal (Ports & Adapters) with strict layer boundaries
- **Database**: Firebase Firestore
- **Testing**: Vitest with coverage reporting
- **Node**: >=20.0.0, **pnpm**: >=9.0.0

## Build, Lint, and Test Commands

### Root-level Commands

```bash
# Development
pnpm dev:client              # Start Svelte dev server (port 5173)
pnpm dev:server              # Start Fastify dev server (port 3000)

# Building
pnpm build                   # Build both client and server
pnpm build:client            # Build client only
pnpm build:server            # Build server only (TypeScript compilation)

# Testing
pnpm test                    # Run all tests in watch mode
pnpm test:coverage           # Run tests with coverage report
vitest run                   # Run tests once (CI mode)
vitest run --reporter=verbose # Run with detailed output

# Type Checking
pnpm type-check              # Check types in all packages

# Linting & Formatting
pnpm lint                    # Lint all packages
pnpm format                  # Format all files with Prettier
pnpm format:check            # Check formatting without modifying

# Dependency Analysis
pnpm circular:check          # Check both client and server for circular dependencies
pnpm circular:check:client   # Check client only (includes .ts and .svelte files)
pnpm circular:check:server   # Check server only (includes .ts files)
pnpm deps:graph              # Generate full dependency graphs for both apps
pnpm deps:graph:client       # Generate client dependency graph
pnpm deps:graph:server       # Generate server dependency graph
pnpm deps:check-coupling     # Analyze coupling and warn about complexity
```

### Running a Single Test File

```bash
# Run specific test file
pnpm test apps/server/tests/domain/entities/team.test.ts

# Run with pattern matching
pnpm test team.test

# Run integration tests only
pnpm --filter server test:integration
```

### Server-specific Commands

```bash
# Firebase emulator
pnpm --filter server emulator:start      # Start Firestore emulator
pnpm --filter server emulator:export     # Export emulator data
pnpm --filter server emulator:import     # Import emulator data

# Integration tests
pnpm --filter server test:integration    # Run integration tests
```

## Code Style Guidelines

### Imports

- **Order**: builtin → external → internal → parent → sibling → index → object → type
- **Newlines**: Always use newlines between import groups
- **Alphabetize**: Sort alphabetically, case-insensitive
- **No duplicates**: Combine imports from the same module
- **Extensions**: Use `.js` extension in imports (TypeScript ESM requirement)

Example:

```typescript
import { readFile } from 'fs/promises';

import fastify from 'fastify';
import { z } from 'zod';

import { Team } from '../../domain/entities/team.js';
import { TeamRepository } from '../../domain/repositories/team-repository.js';

import type { FastifyInstance } from 'fastify';
```

### Formatting (Prettier)

- **Semicolons**: Yes
- **Quotes**: Single quotes
- **Trailing commas**: All
- **Print width**: 100 characters
- **Tab width**: 2 spaces
- **Arrow parens**: Always

### TypeScript

- **Strict mode**: Enabled with all strict checks
- **Return types**: Explicit return types required for all functions
- **Module boundary types**: Must be exported
- **No `any`**: Forbidden - use proper types
- **No unsafe operations**: No unsafe assignments, calls, or returns
- **Index access**: Must check for undefined (`noUncheckedIndexedAccess`)

### Naming Conventions

- **Variables**: camelCase, UPPER_CASE (constants), PascalCase (components/classes)
- **Functions**: camelCase or PascalCase
- **Classes/Interfaces/Types**: PascalCase
- **Enum members**: PascalCase or UPPER_CASE
- **Leading underscore**: Allowed for unused parameters
- **Trailing underscore**: Forbidden

### Complexity Limits

- **Cyclomatic complexity**: Max 10
- **Cognitive complexity**: Max 15
- **Max depth**: 4 levels
- **Max lines per function**: 100 (excluding blanks/comments)
- **Max statements**: 30 per function
- **Max parameters**: 4 per function
- **Max file lines**: 500 (excluding blanks/comments)

### Code Quality Rules

- **No magic numbers**: Extract to named constants (except 0, 1, -1)
- **No console.log**: Use console.warn or console.error only
- **Prefer const**: Use const over let when possible
- **No var**: Always use const or let
- **Prefer template literals**: Use template strings over concatenation
- **No nested ternaries**: Keep conditionals simple
- **Early returns**: Prefer early returns over else blocks
- **Async/await**: Always await promises, no floating promises

### Error Handling

- **Custom errors**: Use domain-specific errors from `shared/errors/domain-errors.js`
- **Types**: ValidationError, BusinessRuleViolationError, NotFoundError
- **Error messages**: Clear, descriptive messages
- **No silent failures**: Always handle or propagate errors

## Architecture Rules (Server)

### Hexagonal Architecture Layers

The server follows strict hexagonal architecture with enforced boundaries:

```
domain/              → Core business logic (entities, value objects, repository interfaces)
├── entities/        → Business entities (Team, Repo, ScanRun, Item)
├── repositories/    → Repository interfaces (ports)
└── value-objects/   → Value objects (TeamId, RepoId, etc.)

application/         → Use cases and application services
├── use-cases/       → Business use cases (orchestration)
├── services/        → Application services
└── mappers/         → Application-level mapping

infrastructure/      → External adapters (database, config)
├── persistence/     → Database implementations
├── config/          → Configuration
└── di/              → Dependency injection container

presentation/        → HTTP layer (routes, DTOs)
├── routes/          → Fastify routes
└── dto/             → Data transfer objects

shared/              → Shared utilities (errors, types)
```

### Layer Import Rules (STRICTLY ENFORCED)

- **Domain**: Can only import from `domain/` and `shared/`
- **Application**: Can import from `domain/`, `application/`, `shared/`
- **Infrastructure**: Can import from all layers (outermost)
- **Presentation**: Can import from `domain/`, `application/`, `presentation/`, `shared/` (NOT infrastructure)
- **Shared**: Cannot import from any other layer (isolated)
- **Tests**: Can import from all layers
- **Composition root** (`index.ts`): Can wire all layers together

### Entity Patterns

- **Private constructor**: Use static factory methods (`create`, `reconstitute`)
- **Immutable props**: Use getters, private properties
- **Value objects**: For domain identifiers and validated values
- **No anemic models**: Entities contain business logic

Example:

```typescript
export class Team {
  private constructor(private props: TeamProps) {}

  static create(input: Omit<TeamProps, 'createdAt' | 'updatedAt'>): Team {
    // Validation logic
    return new Team({ ...input, createdAt: now, updatedAt: now });
  }

  static reconstitute(props: TeamProps): Team {
    return new Team(props);
  }

  get id(): TeamId {
    return this.props.id;
  }

  addRepo(repoId: RepoId): void {
    // Business logic here
    this.props.updatedAt = new Date();
  }
}
```

## Testing Conventions

- **Test files**: `*.test.ts` or `*.spec.ts`
- **Location**: Mirror source structure in `tests/` directory
- **Relaxed rules**: Magic numbers, duplicate strings, function length allowed in tests
- **Integration tests**: Located in `tests/integration/`, use real Firestore emulator
- **Test helpers**: Use factories from `tests/helpers/test-data-factory.ts`
- **Mocking**: Use Vitest's `vi.fn()` for mocking

## Dependency Analysis with Madge

This project uses **madge** to analyze module dependencies, enforce architectural quality, and detect coupling issues.

### Three modes of operation

1. **Circular Dependency Detection** (`circular:check`) - Fast, blocking, runs in pre-commit
2. **Dependency Graph Generation** (`deps:graph`) - Full analysis, runs in pre-commit, committed to repo
3. **Coupling Analysis** (`deps:check-coupling`) - Warns about complexity, runs in pre-push

### Git Hooks Integration

**Pre-commit hook:**

- ✅ Runs `deps:graph` (generates graphs and stages them)
- ✅ Runs `circular:check` (blocking - prevents commit if circular deps found)
- ✅ Graphs are committed alongside code changes

**Pre-push hook:**

- ✅ Runs `deps:check-coupling` (warnings only - non-blocking)

### Circular Dependency Checks

```bash
# Check both apps (runs in pre-commit hook)
pnpm circular:check

# Check specific app
pnpm circular:check:client
pnpm circular:check:server
```

**Exit codes:**

- `0` - No circular dependencies found ✅
- `1` - Circular dependencies detected ❌ (blocks commit)

**Reports:** `docs/dependencies/client-circular.json` and `docs/dependencies/server-circular.json`

- Empty array `[]` = No circular dependencies
- Non-empty array = Circular dependency chains found

**Example circular dependency report:**

```json
[
  ["src/components/A.svelte", "src/components/B.svelte", "src/components/A.svelte"],
  ["src/services/foo.ts", "src/services/bar.ts", "src/services/foo.ts"]
]
```

### Dependency Graph Generation

```bash
# Generate graphs for both apps (runs in pre-commit hook)
pnpm deps:graph

# Generate for specific app
pnpm deps:graph:client
pnpm deps:graph:server
```

**Reports:** `docs/dependencies/client-deps.json` and `docs/dependencies/server-deps.json`

**JSON structure:**

```json
{
  "apps/server/src/index.ts": [
    "apps/server/src/infrastructure/config/environment.js",
    "apps/server/src/infrastructure/di/container.js"
  ],
  "apps/server/src/domain/entities/team.ts": [
    "apps/server/src/domain/value-objects/team-value-objects.js",
    "apps/server/src/shared/errors/domain-errors.js"
  ]
}
```

Each key is a source file, value is array of files it imports.

### Coupling Analysis

```bash
# Analyze coupling (runs in pre-push hook)
pnpm deps:check-coupling
```

**What it checks:**

- ⚠️ **High coupling**: Files importing >10 modules
- 🔴 **Critical coupling**: Files importing >20 modules
- ℹ️ **Core modules**: Files imported by >15 other files (high centrality)
- 🔴 **Critical centrality**: Files imported by >30 other files
- ℹ️ **Orphaned files**: Files with no imports/exports (potential dead code)

**Output is non-blocking** - provides warnings and suggestions for improvement.

**Example output:**

```
⚠️  Files with high coupling (imports >10 modules):
  ⚠️  infrastructure/di/container.ts: 15 imports
  🔴 presentation/routes/scan-runs.ts: 22 imports

  💡 Consider: Extract shared logic, use dependency injection, or split into smaller modules

⚠️  Core modules (imported by >15 files):
  ℹ️  shared/errors/domain-errors.ts: imported by 18 files
  🔴 domain/value-objects/team-value-objects.ts: imported by 32 files

  💡 These are core modules - changes here have wide impact. Consider careful testing.

📈 Server Summary:
  • Total modules: 45
  • High coupling: 2 files
  • Core modules: 2 files
  • Isolated files: 3 files
```

### Use Cases for Dependency Graphs

**For AI agents:**

- Understand module relationships before making changes
- Identify impact radius of refactoring (core modules)
- Find highly coupled modules that need decoupling
- Verify layer boundaries are respected (hexagonal architecture)
- Discover orphaned or isolated modules (dead code candidates)

**For CI/CD:**

- Graphs are committed with code changes (in git history)
- Track coupling metrics over time via git log
- Analyze dependency evolution between commits
- Detect architectural drift in pull requests

### Analyzing Dependency Graphs with jq

**Note:** These examples require `jq` (JSON query tool) to be installed separately.

```bash
# Find files with most dependencies (coupling hotspots)
cat docs/dependencies/server-deps.json | jq 'to_entries | map({file: .key, deps: (.value | length)}) | sort_by(.deps) | reverse | .[0:10]'

# Find files imported by many others (core modules)
cat docs/dependencies/server-deps.json | jq '[.[] | .[] ] | group_by(.) | map({file: .[0], importedBy: length}) | sort_by(.importedBy) | reverse'

# Check specific file's dependencies
cat docs/dependencies/server-deps.json | jq '.["apps/server/src/domain/entities/team.ts"]'

# Count total modules
cat docs/dependencies/server-deps.json | jq 'keys | length'

# Find orphaned files (no dependencies)
cat docs/dependencies/server-deps.json | jq 'to_entries | map(select(.value | length == 0)) | map(.key)'
```

### Common Circular Dependency Patterns to Avoid

1. **Entity ↔ Repository cycles**: Entities should NOT import repositories
2. **Service ↔ Service cycles**: Break with interfaces or events
3. **Component ↔ Component cycles**: Extract shared logic to utilities
4. **Layer boundary violations**: Respect hexagonal architecture layers (see above)

### When to Generate Dependency Graphs

- Automatically on every commit (pre-commit hook)
- Before major refactoring to understand impact
- When reviewing architecture for AI-readiness
- During code reviews to assess coupling
- When onboarding to understand system structure
- After adding new features to verify layer boundaries

### Coupling Thresholds

These are configured in `scripts/check-coupling.js`:

**Dependency count (outbound coupling):**

- `COUPLING_THRESHOLDS.high: 10` - Warning threshold
- `COUPLING_THRESHOLDS.critical: 20` - Critical threshold

**Centrality (inbound coupling):**

- `CENTRALITY_THRESHOLDS.high: 15` - Warning threshold
- `CENTRALITY_THRESHOLDS.critical: 30` - Critical threshold

Adjust these based on your project's complexity and architectural goals.

## Common Patterns

### Use Case Structure

```typescript
export class SomeUseCase {
  constructor(
    private readonly repository: SomeRepository,
    private readonly service: SomeService,
  ) {}

  async execute(input: SomeInput): Promise<SomeOutput> {
    // 1. Validate input
    // 2. Fetch/resolve entities
    // 3. Execute business logic
    // 4. Persist changes
    // 5. Return result
  }
}
```

### Repository Pattern

```typescript
export interface SomeRepository {
  findById(id: SomeId): Promise<SomeEntity | null>;
  save(entity: SomeEntity): Promise<void>;
  findAll(): Promise<SomeEntity[]>;
}
```

### Value Objects

```typescript
export class SomeId {
  private constructor(private readonly _value: string) {}

  static create(value: string): SomeId {
    if (!value.trim()) throw new ValidationError('Cannot be empty');
    return new SomeId(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: SomeId): boolean {
    return this._value === other._value;
  }
}
```

## Important Notes

- **No Cursor/Copilot rules**: This repo has no special AI rules files yet
- **File extensions**: Always use `.js` in imports (TS ESM requirement)
- **Boundary violations**: Will fail lint - respect architecture layers
- **Type safety**: Strict mode violations will fail CI
- **Coverage**: Aim for high coverage, reports in `coverage/`
