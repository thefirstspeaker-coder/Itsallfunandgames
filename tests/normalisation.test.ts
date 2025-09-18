// tests/normalisation.test.ts
import { describe, it, expect } from 'vitest';
import { normaliseNullishString } from '../lib/loadGames';

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