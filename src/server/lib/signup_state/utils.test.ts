import { type Rectangle } from '~/server/lib/signup_state/rectangle';
import {
  findTopLeftVerticesOfLargestText,
  verticesAsGrid,
} from '~/server/lib/signup_state/utils';
import { describe, expect, it } from 'vitest';

describe('findTopLeftVerticesOfLargestText', () => {
  it('throws an error without sufficient number of occurrences', () => {
    const input = {
      textAnnotations: [
        {
          description: 'foo',
          rectangle: makeRectangle(10, 20, 30, 40),
        },
      ],
      word: 'foo',
      n: 2,
    };
    expect(() => findTopLeftVerticesOfLargestText(input)).toThrowError(
      /Expected at least 2 instances/,
    );
  });

  it('base case: works with 1 instance', () => {
    const input = {
      textAnnotations: [
        {
          description: 'foo',
          rectangle: makeRectangle(10, 20, 30, 40),
        },
      ],
      word: 'foo',
      n: 1,
    };
    const result = findTopLeftVerticesOfLargestText(input);
    expect(result).toEqual([{ x: 10, y: 30 }]);
  });

  it('identifies the top n by area', () => {
    const input = {
      textAnnotations: [
        {
          description: 'foo',
          // area = 100
          rectangle: makeRectangle(10, 20, 30, 40),
        },
        {
          description: 'foo',
          // area = 300
          rectangle: makeRectangle(50, 80, 20, 30),
        },
        {
          description: 'bar',
          // area = 800
          rectangle: makeRectangle(0, 80, 20, 30),
        },
        {
          description: 'foo',
          // area = 50
          rectangle: makeRectangle(0, 10, 0, 5),
        },
      ],
      word: 'foo',
      n: 2,
    };
    const result = findTopLeftVerticesOfLargestText(input);
    expect(result).toEqual([
      { x: 50, y: 20 },
      { x: 10, y: 30 },
    ]);
  });
});

describe('verticesAsGrid', () => {
  it('works with empty input', () => {
    const result = verticesAsGrid({ vertices: [], perRow: 0 });
    expect(result).toEqual([]);
  });

  it('can convert to grid', () => {
    const result = verticesAsGrid({
      vertices: [
        { x: 30, y: 50 },
        { x: 10, y: 20 },
        { x: 50, y: 21 },
        { x: 20, y: 49 },
        { x: 40, y: 70 },
      ],
      perRow: 2,
    });
    expect(result).toEqual([
      [
        { x: 10, y: 20 },
        { x: 50, y: 21 },
      ],
      [
        { x: 20, y: 49 },
        { x: 30, y: 50 },
      ],
      [{ x: 40, y: 70 }],
    ]);
  });
});

const makeRectangle = (
  x1: number,
  x2: number,
  y1: number,
  y2: number,
): Rectangle => {
  return {
    topLeft: { x: x1, y: y1 },
    topRight: { x: x2, y: y1 },
    bottomLeft: { x: x1, y: y2 },
    bottomRight: { x: x2, y: y2 },
  };
};
