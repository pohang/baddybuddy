// Find the N biggest (by bounding poly size) occurrences of the word "Court".
import { type google } from '@google-cloud/vision/build/protos/protos';
import {
  asRectangle,
  calculateArea,
  type Rectangle,
  type Vertex,
} from '~/server/lib/signup_state/rectangle';

export type AnnotationWithRectangle = {
  description: string;
  rectangle: Rectangle;
};

export const findTopLeftVerticesOfLargestText = ({
  textAnnotations,
  word,
  n,
}: {
  textAnnotations: AnnotationWithRectangle[];
  word: string;
  n: number;
}) => {
  const matchingTextAnnotations = textAnnotations
    .filter((entity) => entity.description === word)
    .map((entity) => {
      return {
        entity,
        rectangle: entity.rectangle,
      };
    });

  if (matchingTextAnnotations.length < n) {
    throw new Error(
      `Expected at least ${n} instances of "Court" but only got ${matchingTextAnnotations.length}. Is the whole screen in the picture?`,
    );
  }

  matchingTextAnnotations.sort(
    (a, b) => calculateArea(b.rectangle!) - calculateArea(a.rectangle!),
  );

  return matchingTextAnnotations.slice(0, n).map((annotation) => {
    return annotation.rectangle.topLeft;
  });
};

export const verticesAsGrid = ({
  vertices,
  perRow,
}: {
  vertices: Vertex[];
  perRow: number;
}) => {
  const sortedVertices = [...vertices].sort((a, b) => a.y - b.y);
  const grid: Vertex[][] = [];
  for (let i = 0; i < sortedVertices.length; i += perRow) {
    grid.push(
      [...sortedVertices.slice(i, i + perRow)].sort((a, b) => a.x - b.x),
    );
  }
  return grid;
};

export const getRectangleForCourt = ({
  topLeftVertices,
  row,
  col,
}: {
  topLeftVertices: Vertex[][];
  row: number;
  col: number;
}): Rectangle => {
  const baseWidth = topLeftVertices[0]![1]!.x - topLeftVertices[0]![0]!.x;
  const baseHeight = topLeftVertices[1]![0]!.y - topLeftVertices[0]![0]!.y;

  const topLeft = topLeftVertices[row]![col]!;
  let topRight;
  if (topLeftVertices[row]![col + 1]) {
    topRight = topLeftVertices[row]![col + 1]!;
  } else {
    topRight = { x: topLeft.x + baseWidth, y: topLeft.y };
  }

  let bottomLeft;
  if (topLeftVertices[row + 1]?.[col]) {
    bottomLeft = topLeftVertices[row + 1]![col]!;
  } else {
    bottomLeft = { x: topLeft.x, y: topLeft.y + baseHeight };
  }

  let bottomRight;
  if (topLeftVertices[row + 1]?.[col + 1]) {
    bottomRight = topLeftVertices[row + 1]![col + 1]!;
  } else {
    bottomRight = {
      x: topRight.x,
      y: bottomLeft.y,
    };
  }
  return { topLeft, topRight, bottomRight, bottomLeft };
};

export const groupAnnotationsAsLines = (
  annotations: AnnotationWithRectangle[],
) => {
  annotations.sort((a, b) => {
    return a.rectangle.topLeft.y - b.rectangle.topLeft.y;
  });

  const outputAsLine = (annotations: AnnotationWithRectangle[]): string[] => {
    annotations.sort((a, b) => a.rectangle.topLeft.x - b.rectangle.topLeft.x);
    return annotations.map((a) => a.description || '');
  };

  const lines: string[][] = [];
  let currentLine: AnnotationWithRectangle[] = [];
  let lastRectangle: Rectangle | null = null;
  annotations.forEach((annotation) => {
    const { rectangle, description } = annotation;
    if (!/[a-zA-Z0-9]/.test(description)) {
      // ignore strings that are entirely punctuation
      return;
    }

    if (lastRectangle && lastRectangle.bottomLeft.y < rectangle.topLeft.y) {
      lines.push(outputAsLine(currentLine));
      currentLine = [];
    }
    currentLine.push(annotation);
    lastRectangle = rectangle;
  });

  if (currentLine.length > 0) {
    lines.push(outputAsLine(currentLine));
  }

  return lines;
};
