/**
 * Item DTOs (Data Transfer Objects)
 *
 * DTOs for the presentation layer. These decouple the API contracts
 * from the domain models, allowing independent evolution.
 */

export interface CreateItemDto {
  id: string;
  name: string;
  description: string;
  quantity: number;
}

export interface UpdateItemDto {
  name?: string;
  description?: string;
  quantity?: number;
}

export interface ItemResponseDto {
  id: string;
  name: string;
  description: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  inStock: boolean;
}
