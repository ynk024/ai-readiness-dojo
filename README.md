# AI Readiness Dojo

A monorepo demonstrating AI-readiness best practices with Svelte and Fastify.

## Overview

This repository showcases a minimal, production-ready monorepo setup optimized for maximum AI-readiness. It follows the best practices outlined in the AI-Readiness Action integration guide.

## Project Structure

```
ai-readiness-dojo/
├── apps/
│   ├── client/              # Svelte + Vite frontend
│   │   ├── src/
│   │   │   ├── lib/         # Reusable components
│   │   │   ├── App.svelte   # Root component
│   │   │   └── main.ts      # Entry point
│   │   ├── tests/           # Component tests
│   │   └── package.json
│   │
│   └── server/              # Fastify backend
│       ├── src/
│       │   ├── routes/      # API routes
│       │   └── index.ts     # Server entry point
│       ├── tests/           # API tests
│       └── package.json
│
├── .github/                 # GitHub configuration (future)
├── pnpm-workspace.yaml      # PNPM workspace config
├── package.json             # Root package with scripts
├── tsconfig.json            # Base TypeScript config
├── .prettierrc.json         # Prettier config
├── eslint.config.js         # ESLint config
├── vitest.workspace.ts      # Vitest workspace config
└── README.md
```

## AI-Readiness Features

This repository achieves maximum AI-readiness for JavaScript/TypeScript projects:

### ✅ Code Quality Tools

- **Prettier** - Code formatting with Svelte support
- **ESLint** - Linting with TypeScript support
- **eslint-plugin-boundaries** - Architecture enforcement
- **TypeScript** - Type checking with strict mode
- **Vitest** - Testing with coverage reporting

### ✅ Monorepo Architecture

- **PNPM Workspaces** - Efficient dependency management
- **Project References** - TypeScript workspace support
- **Shared Configuration** - Centralized tooling setup
- **Boundary Enforcement** - Prevents cross-app imports

### ✅ Testing & Coverage

- Vitest configured for both client and server
- Coverage reports in Jest format
- Example tests with full coverage
- Workspace mode for running all tests

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- PNPM >= 9.0.0

### Installation

```bash
# Install all dependencies
pnpm install
```

### Development

```bash
# Run client in development mode
pnpm dev:client

# Run server in development mode
pnpm dev:server

# Run both in separate terminals
```

The client will be available at http://localhost:5173 and the server at http://localhost:3000.

### Building

```bash
# Build client
pnpm build:client

# Build server
pnpm build:server
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test --watch
```

Coverage reports are generated in `coverage/` directory with:
- `coverage-summary.json` - Summary in Jest format (for AI-readiness checks)
- Detailed HTML reports for manual inspection

### Code Quality

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Format code
pnpm format

# Check formatting
pnpm format:check
```

## Package Scripts

### Root Scripts

- `pnpm dev:client` - Start client dev server
- `pnpm dev:server` - Start server dev server
- `pnpm build:client` - Build client for production
- `pnpm build:server` - Build server for production
- `pnpm test` - Run all tests
- `pnpm test:coverage` - Run tests with coverage
- `pnpm type-check` - Type check all packages
- `pnpm lint` - Lint all packages
- `pnpm format` - Format all files
- `pnpm format:check` - Check formatting

### Client Scripts

- `pnpm dev` - Start Vite dev server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm type-check` - Type check

### Server Scripts

- `pnpm dev` - Start server with hot reload
- `pnpm build` - Build TypeScript
- `pnpm start` - Start production server
- `pnpm type-check` - Type check

## Architecture

### Client (Svelte + Vite)

- **Framework**: Svelte 5 with runes API
- **Build Tool**: Vite for fast development and optimized builds
- **Type Safety**: TypeScript with strict mode
- **Testing**: Vitest + Testing Library
- **Styling**: Scoped CSS in Svelte components

### Server (Fastify)

- **Framework**: Fastify for high performance
- **Type Safety**: TypeScript with strict mode
- **Logging**: Pino with pretty printing in dev
- **CORS**: Enabled for cross-origin requests
- **Testing**: Vitest with Fastify inject

### Boundary Rules

The `eslint-plugin-boundaries` enforces:

- Client code can only import from client
- Server code can only import from server
- No cross-app imports allowed

This ensures clean separation of concerns and prevents architectural drift.

## CI/CD Readiness

This repository is ready for AI-readiness checks via GitHub Actions:

### Expected Files (Present)

- ✅ `package.json` - Dependencies and scripts
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `.prettierrc.json` - Prettier configuration
- ✅ `eslint.config.js` - ESLint configuration
- ✅ Coverage files generated by `pnpm test:coverage`

### Checklist for AI-Readiness Action

1. Run `pnpm install`
2. Run `pnpm test:coverage`
3. Run AI-readiness check
4. Coverage files will be in `coverage/coverage-summary.json`

## Technology Stack

### Frontend

- **Svelte 5** - UI framework with runes API
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Vitest** - Unit testing
- **@testing-library/svelte** - Component testing utilities

### Backend

- **Fastify** - Web framework
- **TypeScript** - Type safety
- **Pino** - Logging
- **Vitest** - Unit testing
- **@fastify/cors** - CORS support

### Development Tools

- **PNPM** - Package manager
- **TypeScript** - Type checking
- **Prettier** - Code formatting
- **ESLint** - Code linting
- **eslint-plugin-boundaries** - Architecture enforcement
- **Vitest** - Testing framework

## Contributing

This is a demonstration repository. Feel free to use it as a template for your own AI-ready monorepos.

## License

MIT

## Resources

- [AI-Readiness Action](https://github.com/your-org/ai-readiness-action)
- [Svelte Documentation](https://svelte.dev)
- [Fastify Documentation](https://fastify.dev)
- [PNPM Documentation](https://pnpm.io)
- [Vitest Documentation](https://vitest.dev)
