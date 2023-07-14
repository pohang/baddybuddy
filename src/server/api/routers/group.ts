import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';
import { z } from 'zod';

export const groupRouter = createTRPCRouter({
  createGroup: publicProcedure.mutation(({ ctx }) => {
    const id = Math.random().toString(36).slice(2, 8).toUpperCase();
    return ctx.prisma.group.create({
      data: {
        id,
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
