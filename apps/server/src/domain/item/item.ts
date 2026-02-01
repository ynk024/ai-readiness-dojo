import { ItemId, ItemName } from './item-value-objects.js';

const MAX_DESCRIPTION_LENGTH = 1000;

export interface ItemProps {
  id: ItemId;
  name: ItemName;
  description: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Item {
  private constructor(private readonly props: ItemProps) {
    this.validate();
  }

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

  static reconstitute(props: ItemProps): Item {
    return new Item(props);
  }

  private validate(): void {
    if (this.props.quantity < 0) {
      throw new Error('Item quantity cannot be negative');
    }

    if (this.props.description.length > MAX_DESCRIPTION_LENGTH) {
      throw new Error(`Item description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`);
    }
  }

  updateName(name: ItemName): void {
    this.props.name = name;
    this.markAsUpdated();
  }

  updateDescription(description: string): void {
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      throw new Error(`Item description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`);
    }
    this.props.description = description;
    this.markAsUpdated();
  }

  updateQuantity(quantity: number): void {
    if (quantity < 0) {
      throw new Error('Item quantity cannot be negative');
    }
    this.props.quantity = quantity;
    this.markAsUpdated();
  }

  increaseQuantity(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount to increase must be positive');
    }
    this.updateQuantity(this.props.quantity + amount);
  }

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

  private markAsUpdated(): void {
    this.props.updatedAt = new Date();
  }

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

  isInStock(): boolean {
    return this.props.quantity > 0;
  }

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
