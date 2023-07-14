import { type google } from '@google-cloud/vision/build/protos/protos';

export type Vertex = {
  x: number;
  y: number;
};

type Rectangle = {
  topLeft: Vertex;
  topRight: Vertex;
  bottomLeft: Vertex;
  bottomRight: Vertex;
};

export const asRectangle = (
  boundingPoly: google.cloud.vision.v1.IBoundingPoly | undefined | null,
): Rectangle | null => {
  if (boundingPoly == null) {
    return null;
  }

  const vertices = (boundingPoly.vertices || []).map((v) => toVertex(v));
  if (vertices.length != 4) {
    return null;
  }

  vertices.sort((a, b) => a.x - b.x);
  const leftPoints = [vertices[0]!, vertices[1]!];
  const rightPoints = [vertices[2]!, vertices[3]!];

  leftPoints.sort((a, b) => a.y - b.y);
  rightPoints.sort((a, b) => a.y - b.y);
  return {
    topLeft: leftPoints[0]!,
    bottomLeft: leftPoints[1]!,
    topRight: rightPoints[0]!,
    bottomRight: rightPoints[1]!,
  };
};

const toVertex = (v: google.cloud.vision.v1.IVertex): Vertex => {
  if (v.x == null || v.y == null) {
    throw new Error('Unexpected null value for x or y in vertex.');
  }
  return {
    x: v.x,
    y: v.y,
  };
};

export const calculateArea = (r: Rectangle): number => {
  const x = r.topRight.x - r.topLeft.x;
  const y = r.bottomLeft.y - r.topLeft.y;
  return x * y;
};

export const calculateMid = (r: Rectangle): Vertex => {
  return {
    x: (r.topRight.x + r.topLeft.x) / 2,
    y: (r.bottomLeft.y + r.topLeft.y) / 2,
  };
};
