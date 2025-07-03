// ========================================
// GenerationNumber Value Object
// ========================================

export class GenerationNumber {
  private readonly _value: number;

  constructor(value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error('GenerationNumber must be a non-negative integer');
    }

    this._value = value;
  }

  get value(): number {
    return this._value;
  }

  next(): GenerationNumber {
    return new GenerationNumber(this._value + 1);
  }

  isInitial(): boolean {
    return this._value === 0;
  }

  isEvolutionThreshold(threshold: number): boolean {
    return this._value > 0 && this._value % threshold === 0;
  }

  equals(other: GenerationNumber): boolean {
    return this._value === other._value;
  }

  compareTo(other: GenerationNumber): number {
    return this._value - other._value;
  }

  toString(): string {
    return this._value.toString();
  }

  static initial(): GenerationNumber {
    return new GenerationNumber(0);
  }

  static fromNumber(value: number): GenerationNumber {
    return new GenerationNumber(value);
  }
}
