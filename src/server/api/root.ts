import { groupRouter } from '~/server/api/routers/group';
import { playerRouter } from '~/server/api/routers/player';
import { signupRouter } from '~/server/api/routers/signup';
import { createTRPCRouter } from '~/server/api/trpc';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  groups: groupRouter,
  players: playerRouter,
  signups: signupRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
