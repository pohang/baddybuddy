import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';
import { GoogleVisionAiClient } from '~/server/lib/image_parser/google_vision_ai_client';
import ImageStorage from '~/server/lib/image_storage/google_storage';
import { processAnnotations } from '~/server/lib/signup_state/bintang_burlingame';
import { type CourtSignup } from '~/server/lib/signup_state/court_signup';
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
      const annotations = await imageParser.parseImage({ fileName });

      const { courtSignups } = processAnnotations({ annotations, takenAt });
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
      }),
    )
    .query(async ({ input }) => {
      const { fileName } = input;
      const annotations = await imageParser.parseImage({ fileName });

      const imageUri = await imageStorage.getPresignedUrlForDownload(fileName);

      const { courtDebugInfo, courtSignups } = processAnnotations({
        annotations,
        takenAt: new Date(),
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

      const signupsByCourt = new Map<
        number,
        {
          startsAt: Date | null;
          endsAt: Date | null;
          players: string[];
        }[]
      >();
      const courtSignups: CourtSignup[] = (
        signupState.courtSignupState as Prisma.JsonArray
      ).map((val) => {
        const obj = val as Prisma.JsonObject;
        return {
          court: obj['court'] as number,
          startsAt: obj['startsAt']
            ? new Date(obj['startsAt'] as string)
            : null,
          endsAt: obj['endsAt'] ? new Date(obj['endsAt'] as string) : null,
          queuePosition: obj['queuePosition'] as number,
          players: obj['players'] as string[],
        };
      });
      courtSignups.forEach((signup) => {
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
        signupsByCourt,
        takenAt: signupState.takenAt,
        fileName: signupState.fileName,
        imageUri,
      };
    }),
});
