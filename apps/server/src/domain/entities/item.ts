import { ItemId, ItemName } from '../value-objects/item-value-objects.js';

// Business rule constants
const MAX_DESCRIPTION_LENGTH = 1000;

/**
 * Item Entity Properties
 */
export interface ItemProps {
  id: ItemId;
  name: ItemName;
  description: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Item Entity
 *
 * A generic domain entity representing an item in the system.
 * This serves as an example for demonstrating the hexagonal architecture.
 *
 * Domain entities encapsulate business logic and maintain invariants.
 * They use value objects for identity and key attributes.
 */
export class Item {
  private constructor(private readonly props: ItemProps) {
    this.validate();
  }

  /**
   * Creates a new Item entity
   * @param props Item properties
   * @returns A new Item instance
   */
  static create(props: {
    id: ItemId;
    name: ItemName;
    description: string;
    quantity: number;
    createdAt?: Date;
    updatedAt?: Date;
  }): Item {
    const now = new Date();
    return new Item({
      ...props,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    });
  }

  /**
   * Reconstructs an Item from persistence
   * Used by repositories when loading entities from database
   */
  static reconstitute(props: ItemProps): Item {
    return new Item(props);
  }

  /**
   * Validates the entity invariants
   * @throws {Error} If any business rule is violated
   */
  private validate(): void {
    if (this.props.quantity < 0) {
      throw new Error('Item quantity cannot be negative');
    }

    if (this.props.description.length > MAX_DESCRIPTION_LENGTH) {
      throw new Error(`Item description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`);
    }
  }

  /**
   * Updates the item name
   */
  updateName(name: ItemName): void {
    this.props.name = name;
    this.markAsUpdated();
  }

  /**
   * Updates the item description
   */
  updateDescription(description: string): void {
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      throw new Error(`Item description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`);
    }
    this.props.description = description;
    this.markAsUpdated();
  }

  /**
   * Updates the item quantity
   */
  updateQuantity(quantity: number): void {
    if (quantity < 0) {
      throw new Error('Item quantity cannot be negative');
    }
    this.props.quantity = quantity;
    this.markAsUpdated();
  }

  /**
   * Increases the quantity by the specified amount
   */
  increaseQuantity(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount to increase must be positive');
    }
    this.updateQuantity(this.props.quantity + amount);
  }

  /**
   * Decreases the quantity by the specified amount
   */
  decreaseQuantity(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount to decrease must be positive');
    }
    const newQuantity = this.props.quantity - amount;
    if (newQuantity < 0) {
      throw new Error('Insufficient quantity');
    }
    this.updateQuantity(newQuantity);
  }

  /**
   * Marks the entity as updated
   */
  private markAsUpdated(): void {
    this.props.updatedAt = new Date();
  }

  // Getters
  get id(): ItemId {
    return this.props.id;
  }

  get name(): ItemName {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Checks if the item is in stock
   */
  isInStock(): boolean {
    return this.props.quantity > 0;
  }

  /**
   * Converts the entity to a plain object
   * Useful for serialization
   */
  toObject(): {
    id: string;
    name: string;
    description: string;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.props.id.value,
      name: this.props.name.value,
      description: this.props.description,
      quantity: this.props.quantity,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
