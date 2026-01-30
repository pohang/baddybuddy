import { getVenueConfig } from '~/lib/venues';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';
import { GoogleVisionAiClient } from '~/server/lib/image_parser/google_vision_ai_client';
import ImageStorage from '~/server/lib/image_storage/google_storage';
import { processAnnotations } from '~/server/lib/signup_state/bintang_burlingame';
import {
  parseCourtSignupState,
  type CourtSignup,
} from '~/server/lib/signup_state/court_signup';
import _ from 'lodash';
import { z } from 'zod';
import { Prisma } from '.prisma/client';

const imageParser = GoogleVisionAiClient.forProd();
const imageStorage = new ImageStorage();

export const signupRouter = createTRPCRouter({
  createPresignedUploadUrl: publicProcedure.mutation(async () => {
    const fileName = `${new Date().toISOString().replace(/:/g, '_')}.jpeg`;
    const presignedUrl = await imageStorage.getPresignedUrlForUpload(fileName);
    return {
      fileName,
      presignedUrl,
    };
  }),

  processSignupStateImage: publicProcedure
    .input(
      z.object({
        groupId: z.string(),
        fileName: z.string(),
        takenAt: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { groupId, fileName, takenAt } = input;
      const group = await ctx.prisma.group.findUniqueOrThrow({
        where: { id: groupId },
      });
      const venueConfig = getVenueConfig(group.venue);
      const annotations = await imageParser.parseImage({ fileName });

      const { courtSignups } = processAnnotations({
        annotations,
        takenAt,
        expectedNumCourts: venueConfig.courtCount,
        courtsPerRow: venueConfig.courtsPerRow,
      });
      await ctx.prisma.signupState.create({
        data: {
          fileName,
          takenAt,
          group: {
            connect: {
              id: groupId,
            },
          },
          active: true,
          courtSignupState: courtSignups as Prisma.JsonArray,
        },
      });
    }),

  debugSignupStateImage: publicProcedure
    .input(
      z.object({
        fileName: z.string().min(1),
        venue: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { fileName, venue } = input;
      const venueConfig = getVenueConfig(venue ?? 'bintang_burlingame');
      const annotations = await imageParser.parseImage({ fileName });

      const imageUri = await imageStorage.getPresignedUrlForDownload(fileName);

      const { courtDebugInfo, courtSignups } = processAnnotations({
        annotations,
        takenAt: new Date(),
        expectedNumCourts: venueConfig.courtCount,
        courtsPerRow: venueConfig.courtsPerRow,
      });

      return {
        imageUri,
        courtDebugInfo,
        courtSignups,
      };
    }),

  getSignupState: publicProcedure
    .input(z.object({ groupId: z.string(), currentTime: z.optional(z.date()) }))
    .query(async ({ ctx, input }) => {
      const { groupId, currentTime = new Date() } = input;
      const signupState = await ctx.prisma.signupState.findFirst({
        where: {
          groupId,
          active: true,
          createdAt: {
            lte: currentTime,
          },
        },
        orderBy: {
          createdAt: Prisma.SortOrder.desc,
        },
        take: 1,
      });
      if (signupState == null) {
        return null;
      }

      const players = await ctx.prisma.player.findMany({
        where: {
          groupId: groupId,
        },
      });
      const usernames = players.map((p) => p.username);

      const courtsWithIssues: Set<number> = new Set();

      const signupsByCourt = new Map<
        number,
        {
          startsAt: Date | null;
          endsAt: Date | null;
          players: string[];
        }[]
      >();
      const courtSignups = parseCourtSignupState(signupState.courtSignupState);
      courtSignups.forEach((signup) => {
        if (signup.endsAt?.getTime() === signupState.takenAt.getTime()) {
          if (_.intersection(usernames, signup.players).length > 0) {
            courtsWithIssues.add(signup.court);
          }
        }

        if (signup.endsAt && signup.endsAt < currentTime) {
          return;
        }

        if (!signupsByCourt.has(signup.court)) {
          signupsByCourt.set(signup.court, []);
        }

        const players = signup.players;

        signupsByCourt.get(signup.court)!.push({
          startsAt: signup.startsAt,
          endsAt: signup.endsAt,
          players,
        });
      });

      const imageUri = await imageStorage.getPresignedUrlForDownload(
        signupState.fileName,
      );

      return {
        id: signupState.id,
        signupsByCourt,
        takenAt: signupState.takenAt,
        fileName: signupState.fileName,
        imageUri,
        courtsWithIssues,
      };
    }),

  getUploadTimes: publicProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { groupId } = input;
      const signupStates = await ctx.prisma.signupState.findMany({
        where: {
          groupId,
        },
        orderBy: {
          createdAt: Prisma.SortOrder.desc,
        },
      });
      return {
        uploadTimes: signupStates.map((s) => s.takenAt),
      };
    }),

  getSignupStateForCourt: publicProcedure
    .input(
      z.object({
        id: z.number(),
        court: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id, court } = input;
      const signupState = await ctx.prisma.signupState.findUnique({
        where: { id },
      });
      if (signupState == null) {
        throw new Error(`could not find signup state ${id}`);
      }

      const courtSignups = parseCourtSignupState(signupState.courtSignupState);
      const courtSignupsForCourt = courtSignups.filter(
        (c) => c.court === court,
      );
      let minutesLeft = 0;
      const firstSignupEndsAt = courtSignupsForCourt[0]?.endsAt;
      if (firstSignupEndsAt) {
        minutesLeft =
          (firstSignupEndsAt.getTime() - signupState.takenAt.getTime()) /
          1000 /
          60;
      }
      return {
        minutesLeft,
        courtSignups: courtSignupsForCourt,
      };
    }),

  updateSignupState: publicProcedure
    .input(
      z.object({
        id: z.number(),
        court: z.number(),
        minutesLeft: z.number(),
        players: z.array(z.array(z.string())),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, court, minutesLeft, players } = input;
      const signupState = await ctx.prisma.signupState.findUnique({
        where: { id },
      });
      if (signupState == null) {
        throw new Error(`could not find signup state ${id}`);
      }

      const courtSignups = parseCourtSignupState(signupState.courtSignupState);

      const courtSignupsWithoutModifiedCourt = courtSignups.filter((signup) => {
        return signup.court !== court;
      });

      const takenAt = signupState.takenAt;
      const newCourtSignups: CourtSignup[] = players.map((p, i) => {
        const offset = i * 30 + minutesLeft;
        const endsAt = new Date(takenAt);
        endsAt.setMinutes(endsAt.getMinutes() + offset);
        const startsAt = new Date(endsAt);
        startsAt.setMinutes(startsAt.getMinutes() - 30);
        return {
          court,
          startsAt,
          endsAt,
          queuePosition: i,
          players: p,
        };
      });

      const updatedCourtSignupState =
        courtSignupsWithoutModifiedCourt.concat(newCourtSignups);

      await ctx.prisma.signupState.update({
        where: { id },
        data: {
          courtSignupState: updatedCourtSignupState as Prisma.JsonArray,
        },
      });

      return null;
    }),
});
