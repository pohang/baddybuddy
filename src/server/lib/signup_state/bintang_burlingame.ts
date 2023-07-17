import { type TextAnnotationsResponse } from '~/server/lib/image_parser/google_vision_ai_client';
import {
  asRectangle,
  isAWithinB,
  Rectangle,
  type Vertex,
} from '~/server/lib/signup_state/rectangle';
import {
  AnnotationWithRectangle,
  findTopLeftVerticesOfLargestText,
  getRectangleForCourt,
  groupAnnotationsAsLines,
  verticesAsGrid,
} from '~/server/lib/signup_state/utils';
import { type Prisma } from '.prisma/client';

const EXPECTED_NUM_GROUPS = 14;
const COURT_SIGNUP_DURATION_MINUTES = 30;

type CourtDebugInfo = {
  court: number;
  boundingPolyForCourt: Vertex[];
  boundingPolys: Vertex[][];
  lines: string[][];
};

type ProcessAnnotationsResponse = {
  courtSignups: Prisma.CourtSignupCreateWithoutSignupStateInput[];
  courtDebugInfo: CourtDebugInfo[];
};

export const processAnnotations = ({
  annotations,
  takenAt,
}: {
  annotations: TextAnnotationsResponse;
  takenAt: Date;
}): ProcessAnnotationsResponse => {
  const { textAnnotations } = annotations;
  if (textAnnotations == null) {
    throw new Error('textAnnotations was null in response from Google Cloud.');
  }
  const annotationWithRectangles: AnnotationWithRectangle[] = textAnnotations
    .flatMap((annotation) => {
      const rect = asRectangle(annotation.boundingPoly);
      if (rect == null || annotation.description == null) {
        return [];
      }
      return [
        {
          description: annotation.description,
          rectangle: rect,
        },
      ];
    })
    .filter((r) => r != null);

  const topLeftVerticesOfLargestInstancesOfCourt =
    findTopLeftVerticesOfLargestText({
      textAnnotations: annotationWithRectangles,
      word: 'Court',
      n: EXPECTED_NUM_GROUPS,
    });

  const topLeftVerticesOfCourtGrid = verticesAsGrid({
    vertices: topLeftVerticesOfLargestInstancesOfCourt,
    perRow: 4,
  });

  const courtSignups: Prisma.CourtSignupCreateWithoutSignupStateInput[] = [];
  const courtDebugInfo: CourtDebugInfo[] = [];

  for (let row = 0; row < topLeftVerticesOfCourtGrid.length; row += 1) {
    for (let col = 0; col < topLeftVerticesOfCourtGrid[row]!.length; col += 1) {
      const court = row * 4 + (col + 1);
      const boundingPolyForCourt = getRectangleForCourt({
        topLeftVertices: topLeftVerticesOfCourtGrid,
        row,
        col,
      });

      const annotationsForCourt = annotationWithRectangles.filter(
        (annotation) => {
          return isAWithinB(annotation.rectangle, boundingPolyForCourt);
        },
      );

      const boundingPolys = annotationsForCourt.map((annotation) => {
        return rectToVertices(annotation.rectangle);
      });

      const lines = groupAnnotationsAsLines(annotationsForCourt);

      courtDebugInfo.push({
        court,
        boundingPolyForCourt: rectToVertices(boundingPolyForCourt),
        boundingPolys,
        lines,
      });

      let minutesLeftOrReserved: number | 'reserved' = 0;
      let linesSinceQueue = 0;
      lines.forEach((line) => {
        const fullLine = line.filter((s) => s.length > 0).join(' ');
        if (fullLine.includes('Left')) {
          line.find((x) => {
            const asNum = Number(x);
            if (!isNaN(asNum)) {
              minutesLeftOrReserved = asNum;
            }
          });
          return;
        } else if (fullLine.includes('Reserved from')) {
          minutesLeftOrReserved = 'reserved';
          return;
        } else if (fullLine.includes('Players') || linesSinceQueue >= 1) {
          const names = getNamesFromLine(line);
          const courtSignup = getCourtSignup({
            court,
            names,
            takenAt,
            queuePosition: linesSinceQueue,
            minutesLeftOrReserved,
          });
          if (courtSignup) {
            courtSignups.push(courtSignup);
          }
          // this is kind of convoluted but current players and queue 1/2/3 sandwich the
          // "queue" line, so we only want to start counting after we actually see queue.
          if (linesSinceQueue >= 1) {
            linesSinceQueue += 1;
          }
          return;
        } else if (fullLine.includes('Queue')) {
          linesSinceQueue = 1;
          return;
        }
      });
    }
  }

  return {
    courtSignups,
    courtDebugInfo,
  };
};

const getCourtSignup = ({
  court,
  names,
  takenAt,
  queuePosition,
  minutesLeftOrReserved,
}: {
  court: number;
  names: string[];
  takenAt: Date;
  queuePosition: number;
  minutesLeftOrReserved: number | 'reserved';
}): Prisma.CourtSignupCreateWithoutSignupStateInput | null => {
  if (
    names.length === 0 &&
    !(minutesLeftOrReserved === 'reserved' && queuePosition === 0)
  ) {
    return null;
  }
  let startsAt = null;
  let endsAt = null;
  if (typeof minutesLeftOrReserved === 'number') {
    endsAt = new Date(takenAt);
    endsAt.setMinutes(
      endsAt.getMinutes() +
        minutesLeftOrReserved +
        queuePosition * COURT_SIGNUP_DURATION_MINUTES,
    );
    startsAt = new Date(endsAt);
    startsAt.setMinutes(startsAt.getMinutes() - COURT_SIGNUP_DURATION_MINUTES);
  }

  return {
    court,
    startsAt,
    endsAt,
    queuePosition,
    players: {
      createMany: {
        data: names.map((name, i) => ({ player: name, position: i })),
      },
    },
  };
};

const cleanDescription = (description: string) => {
  return description
    .replaceAll(/-|1\.|2\.|3\.|:/g, '')
    .trim()
    .toLowerCase();
};

const getNamesFromLine = (line: string[]): string[] => {
  return line
    .map((l) => cleanDescription(l))
    .filter((w) => {
      return w.length > 0 && w !== 'current' && w !== 'players';
    });
};

const rectToVertices = (rect: Rectangle): Vertex[] => {
  return [rect.topLeft, rect.topRight, rect.bottomRight, rect.bottomLeft];
};
