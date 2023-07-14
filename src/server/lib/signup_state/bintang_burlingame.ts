import { type google } from '@google-cloud/vision/build/protos/protos';
import { type TextAnnotationsResponse } from '~/server/lib/image_parser/google_vision_ai_client';
import { asRectangle, type Vertex } from '~/server/lib/signup_state/rectangle';
import {
  findTopLeftVerticesOfLargestText,
  verticesAsGrid,
} from '~/server/lib/signup_state/utils';
import { type Prisma } from '.prisma/client';

const EXPECTED_NUM_GROUPS = 14;
// These values were obtained by inspecting the pixel values for a single group section.
// The ratios denote a horizontal line. For instance, {x: [0.1, 0.9], y: 0.3}
// represents a line from 10% to 90% of the width at 30% of the height for a single
// section.
const LANDMARK_RATIOS = {
  minutesLeftOrReserved: { x: [0.1743341404, 0.9322033898], y: 0.2631578947 },
  currentPlayers: { x: [0.1743341404, 0.9322033898], y: 0.4436090226 },
  queue1: { x: [0.02179176755, 0.9322033898], y: 0.6616541353 },
  queue2: { x: [0.02179176755, 0.9322033898], y: 0.7593984962 },
  queue3: { x: [0.02179176755, 0.9322033898], y: 0.8646616541 },
} satisfies { [key: string]: LineRatio };
const VERTICAL_TOLERANCE = 0;
const COURT_SIGNUP_DURATION_MINUTES = 30;

type LineRatio = {
  x: [number, number];
  y: number;
};

export const processAnnotations = ({
  annotations,
  takenAt,
}: {
  annotations: TextAnnotationsResponse;
  takenAt: Date;
}): Prisma.CourtSignupCreateWithoutSignupStateInput[] => {
  const { textAnnotations } = annotations;
  if (textAnnotations == null) {
    throw new Error('textAnnotations was null in response from Google Cloud.');
  }
  const topLeftVerticesOfLargestInstancesOfCourt =
    findTopLeftVerticesOfLargestText({
      textAnnotations,
      word: 'Court',
      n: EXPECTED_NUM_GROUPS,
    });

  const topLeftVerticesOfCourtGrid = verticesAsGrid({
    vertices: topLeftVerticesOfLargestInstancesOfCourt,
    perRow: 4,
  });

  const court1 = topLeftVerticesOfCourtGrid[0]![0]!;
  const court2 = topLeftVerticesOfCourtGrid[0]![1]!;
  const court5 = topLeftVerticesOfCourtGrid[1]![0]!;
  const sectionWidth = court2.x - court1.x;
  const sectionHeight = court5.y - court1.y;

  const courtSignups: Prisma.CourtSignupCreateWithoutSignupStateInput[] = [];

  for (let row = 0; row < topLeftVerticesOfCourtGrid.length; row += 1) {
    for (let col = 0; col < topLeftVerticesOfCourtGrid[row]!.length; col += 1) {
      const court = row * 4 + (col + 1);
      const topLeftOfSection = topLeftVerticesOfCourtGrid[row]![col]!;

      const baseArgs = {
        court,
        textAnnotations,
        topLeft: topLeftOfSection,
        sectionWidth,
        sectionHeight,
      };

      const minutesLeftOrReserved = getMinutesLeftOrReserved(baseArgs);
      [
        LANDMARK_RATIOS.currentPlayers,
        LANDMARK_RATIOS.queue1,
        LANDMARK_RATIOS.queue2,
        LANDMARK_RATIOS.queue3,
      ].forEach((ratio, i) => {
        const names = getNamesOnLine({
          ...baseArgs,
          ratio: ratio,
        });
        const courtSignup = getCourtSignup({
          court,
          names,
          takenAt,
          queuePosition: i,
          minutesLeftOrReserved,
        });
        if (courtSignup) {
          courtSignups.push(courtSignup);
        }
      });
    }
  }

  return courtSignups;
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

const getMinutesLeftOrReserved = ({
  textAnnotations,
  topLeft,
  sectionWidth,
  sectionHeight,
}: {
  court: number;
  textAnnotations: google.cloud.vision.v1.IEntityAnnotation[];
  topLeft: Vertex;
  sectionWidth: number;
  sectionHeight: number;
}): number | 'reserved' => {
  const annotations = findAnnotationsOnLine({
    textAnnotations,
    topLeft,
    sectionWidth,
    sectionHeight,
    ratio: LANDMARK_RATIOS.minutesLeftOrReserved,
  });
  for (const annotation of annotations) {
    const description = (annotation.description || '').trim().toLowerCase();
    if (description === 'reserved') {
      return 'reserved';
    }
    if (!isNaN(Number(description))) {
      return parseInt(description);
    }
  }
  return 0;
};

const getNamesOnLine = ({
  textAnnotations,
  topLeft,
  sectionWidth,
  sectionHeight,
  ratio,
}: {
  court: number;
  textAnnotations: google.cloud.vision.v1.IEntityAnnotation[];
  topLeft: Vertex;
  sectionWidth: number;
  sectionHeight: number;
  ratio: LineRatio;
}): string[] => {
  const annotations = findAnnotationsOnLine({
    textAnnotations,
    topLeft,
    sectionWidth,
    sectionHeight,
    ratio: ratio,
  });
  const names: string[] = [];
  for (const annotation of annotations) {
    const description = cleanDescription(annotation.description);
    if (/^[a-z]+$/.test(description)) {
      names.push(description);
    }
  }
  return names;
};

const cleanDescription = (description: string | null | undefined) => {
  if (description == null) {
    return '';
  }
  return description
    .replaceAll(/-|1\.|2\.|3\./g, '')
    .trim()
    .toLowerCase();
};

const findAnnotationsOnLine = ({
  textAnnotations,
  topLeft,
  sectionWidth,
  sectionHeight,
  ratio,
}: {
  textAnnotations: google.cloud.vision.v1.IEntityAnnotation[];
  topLeft: Vertex;
  sectionWidth: number;
  sectionHeight: number;
  ratio: LineRatio;
}) => {
  return textAnnotations.filter((annotation) => {
    const rect = asRectangle(annotation.boundingPoly);
    if (rect == null) {
      return false;
    }

    const leftBound = topLeft.x + ratio.x[0] * sectionWidth;
    const rightBound = topLeft.x + ratio.x[1] * sectionWidth;
    const yBound = topLeft.y + ratio.y * sectionHeight;

    // check if bottom of element is above the yBound
    if (rect.bottomLeft.y < yBound - sectionHeight * VERTICAL_TOLERANCE) {
      return false;
    }

    // check if top of element is below the yBound
    if (rect.topLeft.y > yBound + sectionHeight * VERTICAL_TOLERANCE) {
      return false;
    }

    // check that left side of rectangle isn't already to the right of the right bound.
    if (rect.topLeft.x > rightBound) {
      return false;
    }

    // check that right side of rectangle isn't to the left of the left bound.
    if (rect.topRight.x < leftBound) {
      return false;
    }

    // check that the element is not wider than the bound itself
    if (rect.topLeft.x < leftBound && rect.topRight.x > rightBound) {
      return false;
    }

    return true;
  });
};
