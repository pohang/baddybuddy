import { Octokit } from '@octokit/core';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';
import { z } from 'zod';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export const issueRouter = createTRPCRouter({
  createIssue: publicProcedure
    .input(
      z.object({
        description: z.string(),
        groupId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { description, groupId } = input;
      await octokit.request('POST /repos/pohang/baddybuddy/issues', {
        title: description,
        body: `Group ID: ${groupId}, Timestamp: ${new Date().toISOString()}`,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
    }),
});
