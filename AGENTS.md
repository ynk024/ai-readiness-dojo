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

## Automated Enforcement

This repository enforces code quality through automated tooling. **When in doubt, run `pnpm lint` and `pnpm format`.**

- **Formatting**: `.prettierrc.json` enforced by Prettier + pre-commit hook
- **Code quality & complexity**: `eslint.config.js` enforced by ESLint
- **Type safety**: `tsconfig.json` and `apps/*/tsconfig.json` enforced by TypeScript compiler
- **Architecture boundaries**: `eslint-plugin-boundaries` in `eslint.config.js` enforces hexagonal layers
- **Circular dependencies**: Pre-commit hook blocks circular imports and critical coupling violations
- **Pre-commit checks**: All formatting, linting, and dependency checks run automatically before commit

**Philosophy**: Let tooling catch mistakes. Focus on understanding the architecture and patterns below.

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
pnpm deps:metrics            # Generate code quality metrics for both apps
pnpm deps:metrics:client     # Generate client metrics only
pnpm deps:metrics:server     # Generate server metrics only
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

**Pattern**: builtin → external → internal → parent → sibling → index → object → type

Always use `.js` extension in imports (TypeScript ESM requirement). Import ordering and grouping enforced by `import/order` rule in `eslint.config.js`.

Example:

```typescript
import { readFile } from 'fs/promises';

import fastify from 'fastify';
import { z } from 'zod';

import { Team } from '../../domain/entities/team.js';
import { TeamRepository } from '../../domain/repositories/team-repository.js';

import type { FastifyInstance } from 'fastify';
```

### Formatting

All code is formatted according to `.prettierrc.json`. Run `pnpm format` before committing. The pre-commit hook enforces this automatically.

### TypeScript

Strict mode enabled with full type safety. See `tsconfig.json` and `apps/*/tsconfig.json` for complete configuration.

**Key principles:**

- Explicit return types required for all functions
- No `any` types allowed
- No unsafe operations (assignments, calls, returns)
- Index access must check for undefined (`noUncheckedIndexedAccess`)

### Complexity & Code Quality

Complexity limits and code quality rules are enforced by ESLint. See `eslint.config.js` for detailed configuration.

**Key principles:**

- Extract complex logic into smaller functions (max complexity: 10)
- Keep functions focused and testable (max 100 lines)
- Use named constants instead of magic numbers
- Prefer `const`, template literals, and early returns
- Always await promises (no floating promises)

### Error Handling

Use domain-specific errors from `shared/errors/domain-errors.js`:

- **ValidationError**: Invalid input or business rule violations
- **BusinessRuleViolationError**: Domain constraint violations
- **NotFoundError**: Resource not found

Always provide clear error messages and handle/propagate errors explicitly. No silent failures.

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

**Key principle**: Dependencies point inward. The domain layer has no external dependencies and contains pure business logic.

**Enforcement**: Boundary violations will fail ESLint. See `eslint-plugin-boundaries` configuration in `eslint.config.js`.

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
- **Firebase emulator**: Start with `pnpm --filter server emulator:start` before running tests (including integration tests), and stop it after tests complete

## Dependency Analysis with Madge

This project uses **madge** to detect circular dependencies, generate dependency graphs, and analyze coupling. See `docs/dependencies/README.md` for detailed documentation.

### Commands

```bash
# Check for circular dependencies (blocks commits)
pnpm circular:check              # Check both client and server
pnpm circular:check:client       # Client only
pnpm circular:check:server       # Server only

# Generate dependency graphs (committed to git)
pnpm deps:graph                  # Generate both graphs
pnpm deps:graph:client           # Client only
pnpm deps:graph:server           # Server only

# Generate code quality metrics (committed to git)
pnpm deps:metrics                # Generate both metrics reports
pnpm deps:metrics:client         # Client only
pnpm deps:metrics:server         # Server only

# Analyze coupling (warnings only)
pnpm deps:check-coupling         # Analyze both apps
```

### Code Quality Metrics

Automatically generated metrics reports analyze code quality based on dependency graphs:

**Metrics included:**

- **Circular dependencies**: Count, cycle length, affected modules
- **Coupling (fan-in/fan-out)**: Import/export relationships, God modules
- **Dependency depth**: Longest chains, average depth
- **Cohesion**: Per-directory internal vs external imports
- **Graph complexity**: Node/edge counts, density, degree
- **Health scores**: Overall and per-category (coupling, depth, cohesion, modularity)

**Files generated:**

- `docs/dependencies/client-metrics.json`
- `docs/dependencies/server-metrics.json`

**Quality gates:**

- ❌ **BLOCKS commits**:
  - Fan-out >20 (critical coupling)
  - Dependency chain depth >8 (excessive depth)
  - Graph density >30% (everything depends on everything)
  - God modules (both fan-in and fan-out >15)
- ⚠️ **Warns**:
  - Fan-out 10-20 (high coupling)
  - Fan-in >15 (high centrality)
  - Dependency chain depth 6-8 (moderate depth)
  - Graph density 20-30% (high density)
- ℹ️ **Tracks**: All other metrics for visibility

**Exemptions:**

- DI containers (`**/di/container.ts`)
- Entry points (`index.ts`, `main.ts`)

These files are composition roots and naturally have high coupling.

**Example queries:**

```bash
# Check overall health score
jq '.summary.healthScore' docs/dependencies/server-metrics.json

# Find refactoring candidates (high coupling)
jq '[.coupling.highCoupling[], .coupling.criticalCoupling[]] | map(.file)' docs/dependencies/server-metrics.json

# Check directory cohesion scores
jq '.cohesion.byDirectory | to_entries | map({dir: .key, score: .value.cohesionScore}) | sort_by(.score)' docs/dependencies/server-metrics.json

# Find deepest dependency chains
jq '.topModules.deepest[0:5]' docs/dependencies/server-metrics.json
```

See `docs/dependencies/README.md` for complete metric explanations and more jq query examples.

### Key Points

- **Pre-commit hook** runs all checks automatically
- **Circular dependencies** block commits (output to `/tmp/`)
- **Dependency graphs** committed to `docs/dependencies/` for historical tracking
- **Metrics reports** committed to `docs/dependencies/` for trend analysis
- **Critical violations** block commits (fan-out >20, depth >8, density >30%, God modules)
- **Coupling analysis** provides non-blocking warnings about complexity
- See `docs/dependencies/README.md` for JSON structure, use cases, and jq query examples

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
