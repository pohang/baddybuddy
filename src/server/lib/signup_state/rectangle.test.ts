import {
  asRectangle,
  calculateArea,
} from '~/server/lib/signup_state/rectangle';
import { describe, expect, it } from 'vitest';

describe('asRectangle', () => {
  it('returns null for null or undefined input', () => {
    expect(asRectangle(null)).toBeNull();
    expect(asRectangle(undefined)).toBeNull();
  });

  it('returns null for non 4 sided shape', () => {
    expect(asRectangle({ vertices: [{ x: 0, y: 0 }] })).toBeNull();
  });

  it('correctly identifies points for rectangle', () => {
    const rectangle = asRectangle({
      vertices: [
        { x: 10, y: 10 },
        { x: 50, y: 50 },
        { x: 11, y: 51 },
        { x: 51, y: 11 },
      ],
    });
    expect(rectangle?.topLeft).toEqual({ x: 10, y: 10 });
    expect(rectangle?.topRight).toEqual({ x: 51, y: 11 });
    expect(rectangle?.bottomLeft).toEqual({ x: 11, y: 51 });
    expect(rectangle?.bottomRight).toEqual({ x: 50, y: 50 });
  });
});

describe('calculateArea', () => {
  it('it works', () => {
    const rectangle = asRectangle({
      vertices: [
        { x: 10, y: 10 },
        { x: 50, y: 50 },
        { x: 10, y: 50 },
        { x: 50, y: 10 },
      ],
    });
    expect(calculateArea(rectangle!)).toEqual(1600);
  });
});
