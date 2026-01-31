import { Item } from '../../domain/entities/item.js';
import { ItemId, ItemName } from '../../domain/value-objects/item-value-objects.js';
import { EntityNotFoundError, ValidationError } from '../../shared/errors/domain-errors.js';

import type { CreateItemDto, ItemResponseDto, UpdateItemDto } from '../dto/item.dto.js';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

/**
 * Items Routes - Driving Adapter
 *
 * HTTP endpoints that drive the application core through the ItemRepository port.
 * This is the driving side of hexagonal architecture.
 */

// HTTP Status codes
const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;
const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;

// Route paths
const ITEMS_PATH = '/items';

// Error messages
const ERROR_NOT_FOUND = 'Not Found';
const ERROR_BAD_REQUEST = 'Bad Request';
const ERROR_CONFLICT = 'Conflict';

/**
 * Converts a domain Item entity to a response DTO
 */
function itemToResponseDto(item: Item): ItemResponseDto {
  return {
    id: item.id.value,
    name: item.name.value,
    description: item.description,
    quantity: item.quantity,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    inStock: item.isInStock(),
  };
}

/**
 * GET /items - List all items
 */
async function getAllItems(fastify: FastifyInstance): Promise<ItemResponseDto[]> {
  const items = await fastify.itemRepository.findAll();
  return items.map(itemToResponseDto);
}

/**
 * GET /items/:id - Get item by ID
 */
async function getItemById(
  fastify: FastifyInstance,
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<ItemResponseDto | undefined> {
  try {
    const itemId = ItemId.create(request.params.id);
    const item = await fastify.itemRepository.findById(itemId);

    if (!item) {
      return await reply.code(HTTP_NOT_FOUND).send({
        error: ERROR_NOT_FOUND,
        message: `Item with id '${request.params.id}' not found`,
      });
    }

    return itemToResponseDto(item);
  } catch (error) {
    if (error instanceof ValidationError) {
      return await reply.code(HTTP_BAD_REQUEST).send({
        error: ERROR_BAD_REQUEST,
        message: error.message,
      });
    }
    throw error;
  }
}

/**
 * POST /items - Create a new item
 */
async function createItem(
  fastify: FastifyInstance,
  request: FastifyRequest<{ Body: CreateItemDto }>,
  reply: FastifyReply,
): Promise<ItemResponseDto | undefined> {
  try {
    const { id, name, description, quantity } = request.body;

    // Check if item already exists
    const existingItem = await fastify.itemRepository.findById(ItemId.create(id));
    if (existingItem) {
      return await reply.code(HTTP_CONFLICT).send({
        error: ERROR_CONFLICT,
        message: `Item with id '${id}' already exists`,
      });
    }

    // Create domain entity
    const item = Item.create({
      id: ItemId.create(id),
      name: ItemName.create(name),
      description,
      quantity,
    });

    // Save through repository
    const savedItem = await fastify.itemRepository.save(item);

    return await reply.code(HTTP_CREATED).send(itemToResponseDto(savedItem));
  } catch (error) {
    if (error instanceof ValidationError) {
      return await reply.code(HTTP_BAD_REQUEST).send({
        error: ERROR_BAD_REQUEST,
        message: error.message,
      });
    }
    throw error;
  }
}

/**
 * PATCH /items/:id - Update an item
 */
async function updateItem(
  fastify: FastifyInstance,
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateItemDto }>,
  reply: FastifyReply,
): Promise<ItemResponseDto | undefined> {
  try {
    const itemId = ItemId.create(request.params.id);

    // Fetch existing item first
    const existingItem = await fastify.itemRepository.findById(itemId);
    if (!existingItem) {
      return await reply.code(HTTP_NOT_FOUND).send({
        error: ERROR_NOT_FOUND,
        message: `Item with id '${request.params.id}' not found`,
      });
    }

    // Apply updates using domain methods
    if (request.body.name !== undefined) {
      existingItem.updateName(ItemName.create(request.body.name));
    }
    if (request.body.description !== undefined) {
      existingItem.updateDescription(request.body.description);
    }
    if (request.body.quantity !== undefined) {
      existingItem.updateQuantity(request.body.quantity);
    }

    // Save the updated entity
    const updatedItem = await fastify.itemRepository.save(existingItem);
    return itemToResponseDto(updatedItem);
  } catch (error) {
    if (error instanceof EntityNotFoundError) {
      return await reply.code(HTTP_NOT_FOUND).send({
        error: ERROR_NOT_FOUND,
        message: error.message,
      });
    }
    if (error instanceof ValidationError) {
      return await reply.code(HTTP_BAD_REQUEST).send({
        error: ERROR_BAD_REQUEST,
        message: error.message,
      });
    }
    throw error;
  }
}

/**
 * DELETE /items/:id - Delete an item
 */
async function deleteItem(
  fastify: FastifyInstance,
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  try {
    const itemId = ItemId.create(request.params.id);
    await fastify.itemRepository.delete(itemId);
    return await reply.code(HTTP_NO_CONTENT).send();
  } catch (error) {
    if (error instanceof EntityNotFoundError) {
      await reply.code(HTTP_NOT_FOUND).send({
        error: ERROR_NOT_FOUND,
        message: error.message,
      });
      return;
    }
    if (error instanceof ValidationError) {
      await reply.code(HTTP_BAD_REQUEST).send({
        error: ERROR_BAD_REQUEST,
        message: error.message,
      });
      return;
    }
    throw error;
  }
}

/**
 * GET /items/search?name=fragment - Search items by name
 */
async function searchItems(
  fastify: FastifyInstance,
  request: FastifyRequest<{ Querystring: { name?: string } }>,
  reply: FastifyReply,
): Promise<ItemResponseDto[] | undefined> {
  const nameFragment = request.query.name;

  if (!nameFragment) {
    return await reply.code(HTTP_BAD_REQUEST).send({
      error: ERROR_BAD_REQUEST,
      message: 'Query parameter "name" is required',
    });
  }

  const items = await fastify.itemRepository.findByName(nameFragment);
  return items.map(itemToResponseDto);
}

/**
 * GET /items/low-stock?threshold=10 - Find items with low stock
 */
async function getLowStockItems(
  fastify: FastifyInstance,
  request: FastifyRequest<{ Querystring: { threshold?: string } }>,
  reply: FastifyReply,
): Promise<ItemResponseDto[] | undefined> {
  const DEFAULT_THRESHOLD = 10;
  const threshold = request.query.threshold
    ? parseInt(request.query.threshold, 10)
    : DEFAULT_THRESHOLD;

  if (isNaN(threshold) || threshold < 0) {
    return await reply.code(HTTP_BAD_REQUEST).send({
      error: ERROR_BAD_REQUEST,
      message: 'Query parameter "threshold" must be a non-negative number',
    });
  }

  const items = await fastify.itemRepository.findLowStock(threshold);
  return items.map(itemToResponseDto);
}

/**
 * Register all item routes
 */
export function itemsRoutes(fastify: FastifyInstance): void {
  fastify.get(ITEMS_PATH, async () => getAllItems(fastify));

  fastify.get<{ Params: { id: string } }>(`${ITEMS_PATH}/:id`, async (request, reply) =>
    getItemById(fastify, request, reply),
  );

  fastify.post<{ Body: CreateItemDto }>(ITEMS_PATH, async (request, reply) =>
    createItem(fastify, request, reply),
  );

  fastify.patch<{ Params: { id: string }; Body: UpdateItemDto }>(
    `${ITEMS_PATH}/:id`,
    async (request, reply) => updateItem(fastify, request, reply),
  );

  fastify.delete<{ Params: { id: string } }>(`${ITEMS_PATH}/:id`, async (request, reply) =>
    deleteItem(fastify, request, reply),
  );

  fastify.get<{ Querystring: { name?: string } }>(`${ITEMS_PATH}/search`, async (request, reply) =>
    searchItems(fastify, request, reply),
  );

  fastify.get<{ Querystring: { threshold?: string } }>(
    `${ITEMS_PATH}/low-stock`,
    async (request, reply) => getLowStockItems(fastify, request, reply),
  );
}
