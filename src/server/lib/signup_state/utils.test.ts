import { type Rectangle } from '~/server/lib/signup_state/rectangle';
import {
  findTopLeftVerticesOfLargestText,
  groupAnnotationsAsLines,
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

describe('groupAnnotationsAsLines', () => {
  // Coordinates taken from a real screenshot: the "Reserved at:" row ends at
  // y=407 and the "Current Players" row starts at y=407, so the two rows touch
  // exactly. Note the differing text heights within a row - the label is in a
  // smaller font than the value beside it.
  it('splits rows whose bounding boxes touch', () => {
    const lines = groupAnnotationsAsLines([
      { description: 'Reserved', rectangle: makeRectangle(2111, 2195, 377, 393) },
      { description: 'at', rectangle: makeRectangle(2201, 2221, 379, 394) },
      { description: 'Challenge', rectangle: makeRectangle(2314, 2433, 377, 405) },
      { description: 'Court', rectangle: makeRectangle(2442, 2511, 378, 406) },
      { description: 'at', rectangle: makeRectangle(2517, 2540, 379, 407) },
      { description: '2pm', rectangle: makeRectangle(2546, 2596, 380, 407) },
      { description: 'Current', rectangle: makeRectangle(2111, 2179, 407, 426) },
      { description: 'Players', rectangle: makeRectangle(2184, 2249, 410, 429) },
    ]);

    expect(lines).toEqual([
      ['Reserved', 'at', 'Challenge', 'Court', 'at', '2pm'],
      ['Current', 'Players'],
    ]);
  });

  // A reserved court has nobody on the court, but players can still be queued
  // for it. Those names must stay on their own row rather than being absorbed
  // into the reservation notice above them.
  it('keeps queued names separate from the reservation notice above', () => {
    const lines = groupAnnotationsAsLines([
      { description: 'Reserved', rectangle: makeRectangle(2111, 2195, 377, 393) },
      { description: '2pm', rectangle: makeRectangle(2546, 2596, 380, 407) },
      { description: '1', rectangle: makeRectangle(2109, 2123, 407, 426) },
      { description: 'Alice', rectangle: makeRectangle(2140, 2260, 407, 429) },
      { description: 'Bob', rectangle: makeRectangle(2270, 2350, 409, 430) },
    ]);

    expect(lines).toEqual([
      ['Reserved', '2pm'],
      ['1', 'Alice', 'Bob'],
    ]);
  });

  it('groups words on the same row despite differing text heights', () => {
    const lines = groupAnnotationsAsLines([
      { description: 'Players', rectangle: makeRectangle(133, 230, 371, 390) },
      { description: 'Tayzar', rectangle: makeRectangle(268, 360, 371, 396) },
      { description: 'Yelin', rectangle: makeRectangle(481, 560, 374, 399) },
    ]);

    expect(lines).toEqual([['Players', 'Tayzar', 'Yelin']]);
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
