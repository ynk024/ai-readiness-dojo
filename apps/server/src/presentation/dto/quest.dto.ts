/**
 * Quest DTOs (Data Transfer Objects)
 *
 * DTOs for the presentation layer. These decouple the API contracts
 * from the domain models, allowing independent evolution.
 */

export interface QuestResponseDto {
  id: string;
  key: string;
  title: string;
  category: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
