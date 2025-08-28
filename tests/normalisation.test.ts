// tests/normalisation.test.ts
import { describe, it, expect } from 'vitest';
// Note: You would need to export your normalisation logic to test it directly.
// For this example, let's assume `normaliseNullishString` is exported.

// Dummy function for demonstration
const normaliseNullishString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return ['', 'null', 'null,'].includes(trimmed.toLowerCase()) ? null : trimmed;
};

describe('Data Normalisation', () => {
  it('should convert "null," to null', () => {
    expect(normaliseNullishString('null,')).toBeNull();
  });

  it('should trim whitespace', () => {
    expect(normaliseNullishString('  hello world  ')).toBe('hello world');
  });
  
  it('should return null for empty strings', () => {
    expect(normaliseNullishString('')).toBeNull();
  });
});