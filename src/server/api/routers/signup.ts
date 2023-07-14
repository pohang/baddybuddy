import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';
import { GoogleVisionAiClient } from '~/server/lib/image_parser/google_vision_ai_client';
import ImageStorage from '~/server/lib/image_storage/google_storage';
import { processAnnotations } from '~/server/lib/signup_state/bintang_burlingame';
import { z } from 'zod';
import { Prisma } from '.prisma/client';

const imageParser = GoogleVisionAiClient.forProd();
const imageStorage = new ImageStorage();

const includeClause = {
  courtSignups: {
    include: { players: true },
  },
};

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

      const courtSignups = processAnnotations({ annotations, takenAt });
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
          courtSignups: {
            create: courtSignups,
          },
        },
        include: includeClause,
      });
    }),

  getSignupState: publicProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { groupId } = input;
      const signupState = await ctx.prisma.signupState.findFirst({
        where: {
          groupId,
          active: true,
        },
        orderBy: {
          createdAt: Prisma.SortOrder.desc,
        },
        take: 1,
        include: includeClause,
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
      signupState.courtSignups.forEach((signup) => {
        if (signup.endsAt && signup.endsAt < new Date()) {
          return;
        }

        if (!signupsByCourt.has(signup.court)) {
          signupsByCourt.set(signup.court, []);
        }

        const players = signup.players;
        players.sort((a, b) => a.position - b.position);

        signupsByCourt.get(signup.court)!.push({
          startsAt: signup.startsAt,
          endsAt: signup.endsAt,
          players: players.map((p) => p.player),
        });
      });

      const imageUri = await imageStorage.getPresignedUrlForDownload(
        signupState.fileName,
      );

      return {
        signupsByCourt,
        takenAt: signupState.takenAt,
        imageUri,
      };
    }),
});
