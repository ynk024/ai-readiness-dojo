# Firebase Firestore Persistence Layer - Hexagonal Architecture

This document describes the Firebase Firestore persistence layer implementation following hexagonal architecture (ports and adapters) principles.

## Architecture Overview

The implementation follows **hexagonal architecture** to keep the domain logic independent of infrastructure concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│                    (Driving Adapters)                        │
│  - REST API Routes (/items, /health)                        │
│  - DTOs for API contracts                                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  - Use Cases (future)                                       │
│  - Application Services                                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│                    (Core Business Logic)                     │
│  - Entities: Item                                           │
│  - Value Objects: ItemId, ItemName                          │
│  - Repository Interfaces (OUTBOUND PORTS)                   │
│  - Domain Errors                                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│                    (Driven Adapters)                        │
│  - Firestore Repository Implementation                      │
│  - Firestore Client Wrapper                                │
│  - Domain ↔ Firestore Mappers                              │
│  - Firebase Configuration                                   │
│  - Environment Configuration                                │
│  - Dependency Injection Container                           │
└─────────────────────────────────────────────────────────────┘
```

## Key Benefits

### 1. **Database Independence**

The domain layer has **zero knowledge** of Firestore. You can swap Firestore for MongoDB, PostgreSQL, or any other database by simply creating a new adapter that implements the repository interface.

### 2. **Testability**

- Mock repositories at the domain boundary for unit tests
- Test Firestore adapter in isolation with emulator
- No need to mock Firestore in domain/application tests

### 3. **Maintainability**

- Clear separation of concerns
- Each layer has a single responsibility
- Changes to database structure don't affect domain logic

### 4. **Type Safety**

- Full TypeScript support throughout
- Domain entities enforce business rules
- Value objects prevent invalid state

## Directory Structure

```
apps/server/src/
├── domain/                           # Core business logic (no dependencies)
│   ├── entities/
│   │   └── item.ts                  # Item entity with business logic
│   ├── value-objects/
│   │   └── item-value-objects.ts    # ItemId, ItemName value objects
│   └── repositories/
│       ├── base-repository.ts        # Generic repository interface (OUTBOUND PORT)
│       └── item-repository.ts        # Item-specific repository interface
│
├── application/                      # Use cases / Application services
│   └── use-cases/                   # (Future: business workflows)
│
├── infrastructure/                   # External concerns
│   ├── persistence/
│   │   └── firestore/               # FIRESTORE ADAPTER (DRIVEN ADAPTER)
│   │       ├── firestore-client.ts  # Firestore SDK wrapper
│   │       ├── repositories/
│   │       │   └── firestore-item-repository.ts  # Implements ItemRepository
│   │       └── mappers/
│   │           └── item-mapper.ts    # Domain ↔ Firestore transformations
│   ├── config/
│   │   ├── firebase.config.ts       # Firebase initialization
│   │   └── environment.ts           # Environment variables validation
│   └── di/
│       └── container.ts             # Dependency injection (Fastify decorators)
│
├── presentation/                    # HTTP layer (DRIVING ADAPTERS)
│   ├── routes/
│   │   ├── health.ts               # Health check endpoint
│   │   └── items.routes.ts         # Items CRUD endpoints
│   └── dto/
│       └── item.dto.ts             # Data transfer objects for API
│
├── shared/                          # Shared utilities
│   └── errors/
│       └── domain-errors.ts        # Custom error types
│
└── index.ts                         # Composition root (wires dependencies)
```

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in `apps/server/`:

```bash
# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id

# For production: Path to Firebase service account JSON file
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json

# For development/testing: Firestore emulator host
FIRESTORE_EMULATOR_HOST=localhost:8080
```

### 2. Firebase Project Setup

#### Option A: Use Firestore Emulator (Development)

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Start Firestore emulator
firebase emulators:start --only firestore
```

Set environment variable:

```bash
FIRESTORE_EMULATOR_HOST=localhost:8080
```

#### Option B: Use Production Firestore

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Generate a service account key:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file securely

4. Set environment variables:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run the Server

```bash
# Development mode with hot reload
pnpm --filter server dev

# Production build
pnpm --filter server build
pnpm --filter server start
```

### 5. Run Tests

```bash
# Run all tests
pnpm test

# Run only server tests
pnpm test --project=server

# Run tests in watch mode
pnpm test --project=server
```

## API Endpoints

### Items Resource

#### Create Item

```http
POST /items
Content-Type: application/json

{
  "id": "item-001",
  "name": "Example Item",
  "description": "This is an example item",
  "quantity": 100
}
```

Response: `201 Created`

```json
{
  "id": "item-001",
  "name": "Example Item",
  "description": "This is an example item",
  "quantity": 100,
  "createdAt": "2024-01-31T21:00:00.000Z",
  "updatedAt": "2024-01-31T21:00:00.000Z",
  "inStock": true
}
```

#### Get All Items

```http
GET /items
```

Response: `200 OK`

```json
[
  {
    "id": "item-001",
    "name": "Example Item",
    "description": "This is an example item",
    "quantity": 100,
    "createdAt": "2024-01-31T21:00:00.000Z",
    "updatedAt": "2024-01-31T21:00:00.000Z",
    "inStock": true
  }
]
```

#### Get Item by ID

```http
GET /items/:id
```

Response: `200 OK` or `404 Not Found`

#### Update Item

```http
PATCH /items/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "quantity": 50
}
```

Response: `200 OK` or `404 Not Found`

#### Delete Item

```http
DELETE /items/:id
```

Response: `204 No Content` or `404 Not Found`

#### Search Items by Name

```http
GET /items/search?name=example
```

Response: `200 OK`

#### Find Low Stock Items

```http
GET /items/low-stock?threshold=10
```

Response: `200 OK`

## Domain Model

### Item Entity

The `Item` entity encapsulates business logic and enforces invariants:

```typescript
const item = Item.create({
  id: ItemId.create('item-001'),
  name: ItemName.create('Example Item'),
  description: 'This is an example item',
  quantity: 100,
});

// Business methods
item.increaseQuantity(50); // Validates amount > 0
item.decreaseQuantity(30); // Validates sufficient quantity
item.updateName(ItemName.create('New Name'));
item.updateDescription('New description');

// Read-only properties
console.log(item.id.value); // 'item-001'
console.log(item.name.value); // 'Example Item'
console.log(item.quantity); // 100
console.log(item.isInStock()); // true
```

### Value Objects

Value objects ensure validity and immutability:

```typescript
// ItemId - validates length and format
const itemId = ItemId.create('item-001');

// ItemName - validates min/max length
const itemName = ItemName.create('Example Item');

// Both throw ValidationError if invalid
```

## Swapping the Database

To replace Firestore with another database:

1. **Create a new adapter** implementing `ItemRepository`:

```typescript
export class MongoDBItemRepository implements ItemRepository {
  async findById(id: ItemId): Promise<Item | null> {
    // MongoDB-specific implementation
  }
  // ... implement other methods
}
```

2. **Create mappers** for the new database:

```typescript
export function itemToMongoDB(item: Item): MongoDocument {
  // Convert domain Item to MongoDB document
}

export function itemFromMongoDB(doc: MongoDocument): Item {
  // Convert MongoDB document to domain Item
}
```

3. **Update the DI container** (`infrastructure/di/container.ts`):

```typescript
// Replace this:
const itemRepository = new FirestoreItemRepository(firestoreClient);

// With this:
const itemRepository = new MongoDBItemRepository(mongoClient);
```

**That's it!** The domain layer, application layer, and presentation layer remain completely unchanged.

## Testing Strategy

### Unit Tests

- Test domain entities and value objects in isolation
- Mock repository interfaces
- No database required

### Integration Tests

- Test repository adapters with Firestore emulator
- Test full request-response cycle with test database
- Test error handling and edge cases

### Example Test Setup

```typescript
// Set environment for tests
FIREBASE_PROJECT_ID=test-project
FIRESTORE_EMULATOR_HOST=localhost:8080
NODE_ENV=test
```

## Best Practices

### 1. **Always Use Domain Methods**

```typescript
// ✅ Good - uses domain method
item.updateQuantity(50);

// ❌ Bad - direct property access (readonly anyway)
item.quantity = 50; // TypeScript error!
```

### 2. **Validate at Domain Boundaries**

```typescript
// Value objects validate on creation
const name = ItemName.create(userInput); // Throws ValidationError if invalid
```

### 3. **Handle Domain Errors in Presentation Layer**

```typescript
try {
  const item = await repository.findById(itemId);
} catch (error) {
  if (error instanceof EntityNotFoundError) {
    return reply.code(404).send({ error: error.message });
  }
  throw error;
}
```

### 4. **Keep Domain Pure**

- No imports from infrastructure or presentation in domain layer
- Domain entities should have no knowledge of HTTP, databases, or frameworks
- All external concerns belong in infrastructure layer

## Future Enhancements

### Completed Optional Tasks ✅

1. **ESLint Boundary Enforcement** ✅
   - Configured ESLint to enforce hexagonal architecture layer dependencies
   - Domain layer cannot import infrastructure or presentation code
   - Presentation layer cannot import infrastructure directly
   - Shared layer remains isolated from all other layers
   - Test files and composition root can import from all layers
   - See `eslint.config.js` for boundary configuration

2. **Firestore Emulator Setup** ✅
   - Added `firebase.json` configuration for Firestore emulator
   - Emulator runs on port 8080, UI on port 4000
   - Added npm scripts: `emulator:start`, `emulator:export`, `emulator:import`
   - Configured automatic emulator startup for integration tests
   - Added emulator data to `.gitignore`

3. **Integration Tests** ✅
   - Created test helpers for Firestore setup/teardown
   - Implemented lightweight integration tests for create and read operations
   - Tests use Firestore emulator for isolation
   - Test data factory provides consistent test entities
   - Run with: `FIRESTORE_EMULATOR_HOST=localhost:8080 pnpm test:integration`
   - All tests passing with proper cleanup between runs

### Additional Features (Not Yet Implemented)

4. **Advanced Features** (Optional - not prioritized)
   - Pagination support (limit, offset, cursor-based)
   - Complex sorting and filtering
   - Batch operations (createMany, updateMany, deleteMany)
   - Transaction support for multi-document operations
   - Event sourcing
   - CQRS pattern

## References

- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Fastify Documentation](https://www.fastify.io/docs/latest/)

## License

Private project - All rights reserved
