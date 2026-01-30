import { DEFAULT_VENUE } from '~/lib/venues';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';
import { z } from 'zod';

export const groupRouter = createTRPCRouter({
  createGroup: publicProcedure
    .input(z.object({ venue: z.string().optional() }).optional())
    .mutation(({ ctx, input }) => {
      const id = Math.random().toString(36).slice(2, 8).toUpperCase();
      return ctx.prisma.group.create({
        data: {
          id,
          venue: input?.venue ?? DEFAULT_VENUE,
        },
      });
    }),

  getGroup: publicProcedure
    .input(z.object({ groupId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.group.findUniqueOrThrow({
        where: { id: input.groupId },
      });
    }),
});
