import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';
import { z } from 'zod';

export const playerRouter = createTRPCRouter({
  addPlayer: publicProcedure
    .input(
      z.object({
        groupId: z.string(),
        username: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { groupId, username, password } = input;

      return ctx.prisma.player.create({
        data: {
          username,
          password,
          group: {
            connect: { id: groupId },
          },
        },
      });
    }),

  removePlayer: publicProcedure
    .input(z.object({ groupId: z.string(), username: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { groupId, username } = input;
      return ctx.prisma.player.delete({
        where: { groupAndUsername: { groupId, username } },
      });
    }),

  getPlayers: publicProcedure
    .input(z.object({ groupId: z.string() }))
    .query(({ ctx, input }) => {
      const { groupId } = input;
      return ctx.prisma.player.findMany({
        where: { groupId },
      });
    }),
});
