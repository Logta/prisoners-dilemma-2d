// ========================================
// SimulationId Value Object
// ========================================

export class SimulationId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('SimulationId cannot be empty');
    }

    if (!this.isValidFormat(value)) {
      throw new Error('SimulationId must be a valid UUID format');
    }

    this._value = value.trim();
  }

  private isValidFormat(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: SimulationId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  static generate(): SimulationId {
    // Simple UUID v4 generation
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

    return new SimulationId(uuid);
  }

  static fromString(value: string): SimulationId {
    return new SimulationId(value);
  }
}
