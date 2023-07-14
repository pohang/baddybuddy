// Find the N biggest (by bounding poly size) occurrences of the word "Court".
import { type google } from '@google-cloud/vision/build/protos/protos';
import {
  asRectangle,
  calculateArea,
  type Vertex,
} from '~/server/lib/signup_state/rectangle';

export const findTopLeftVerticesOfLargestText = ({
  textAnnotations,
  word,
  n,
}: {
  textAnnotations: google.cloud.vision.v1.IEntityAnnotation[];
  word: string;
  n: number;
}) => {
  const courtsText = textAnnotations
    .filter((entity) => entity.description === word)
    .map((entity) => {
      return {
        entity,
        rectangle: asRectangle(entity.boundingPoly),
      };
    });

  const sortedCourtsText = courtsText
    .filter((x) => x.rectangle)
    .sort((a, b) => calculateArea(b.rectangle!) - calculateArea(a.rectangle!));

  if (sortedCourtsText.length < n) {
    throw new Error(
      `Expected at least ${n} instances of "Court" but only got ${courtsText.length}. Is the whole screen in the picture?`,
    );
  }

  return sortedCourtsText.slice(0, n).map((courtText) => {
    if (courtText.rectangle == null) {
      throw new Error(
        `Did not expect non-rectangular bounding poly in top ${n}.`,
      );
    }
    return courtText.rectangle.topLeft;
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
