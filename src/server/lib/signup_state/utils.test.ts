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
          boundingPoly: {
            vertices: makeRectangleVertices(10, 20, 30, 40),
          },
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
          boundingPoly: {
            vertices: makeRectangleVertices(10, 20, 30, 40),
          },
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
          boundingPoly: {
            // area = 100
            vertices: makeRectangleVertices(10, 20, 30, 40),
          },
        },
        {
          description: 'foo',
          boundingPoly: {
            // area = 300
            vertices: makeRectangleVertices(50, 80, 20, 30),
          },
        },
        {
          description: 'bar',
          boundingPoly: {
            // area = 800
            vertices: makeRectangleVertices(0, 80, 20, 30),
          },
        },
        {
          description: 'foo',
          boundingPoly: {
            // area = 50
            vertices: makeRectangleVertices(0, 10, 0, 5),
          },
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

const makeRectangleVertices = (
  x1: number,
  x2: number,
  y1: number,
  y2: number,
) => {
  return [
    { x: x1, y: y1 },
    { x: x1, y: y2 },
    { x: x2, y: y1 },
    { x: x2, y: y2 },
  ];
};
