import { type TRPCClientErrorLike } from '@trpc/client';
import { type UseTRPCQueryResult } from '@trpc/react-query/shared';
import { type inferRouterOutputs } from '@trpc/server';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { type AppRouter } from '~/server/api/root';
import { formatTime } from '~/utils/time';
import * as React from 'react';

type Props = {
  playerQuery: UseTRPCQueryResult<
    inferRouterOutputs<AppRouter>['players']['getPlayers'],
    TRPCClientErrorLike<AppRouter>
  >;
  signupStateQuery: UseTRPCQueryResult<
    inferRouterOutputs<AppRouter>['signups']['getSignupState'],
    TRPCClientErrorLike<AppRouter>
  >;
};

const OurCourtsList = (props: Props) => {
  const { playerQuery, signupStateQuery } = props;

  if (playerQuery.isLoading || signupStateQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (playerQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center">
        <p>Something went wrong!</p>
        <p>{playerQuery?.error?.message}</p>
      </div>
    );
  }

  if (signupStateQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center">
        <p>Something went wrong!</p>
        <p>{signupStateQuery?.error?.message}</p>
      </div>
    );
  }

  // Find signups that contain a name that's part of our group.
  const playerNames = new Set<string>(
    playerQuery.data.map((player) => player.username),
  );
  const ourSignups: {
    court: string;
    players: string[];
    onCourt: boolean;
    sortIndex: number;
  }[] = [];
  signupStateQuery.data?.signupsByCourt.forEach((signups, court) => {
    signups.forEach((signup) => {
      if (signup.players.some((player) => playerNames.has(player))) {
        let status;
        let sortIndex;
        let onCourt = false;
        if (signup.startsAt === null) {
          status = 'after res';
          sortIndex = Number.MAX_SAFE_INTEGER;
        } else if (signup.startsAt < new Date()) {
          status = `until ${formatTime(signup.endsAt!)}`;
          sortIndex = signup.startsAt.getTime();
          onCourt = true;
        } else {
          status = `at ${formatTime(signup.startsAt)}`;
          sortIndex = signup.startsAt.getTime();
        }
        ourSignups.push({
          court: `${court} ${status}`,
          players: signup.players,
          onCourt,
          sortIndex,
        });
      }
    });
  });

  ourSignups.sort((a, b) => a.sortIndex - b.sortIndex);

  const formatPlayers = (players: string[]) => {
    return (
      <div className="grid grid-cols-2 gap-1">
        {players.map((player, i) => {
          if (playerNames.has(player)) {
            return (
              <div key={i} className="text-green-300">
                {player}
              </div>
            );
          }
          return <div key={i}>{player}</div>;
        })}
      </div>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="p-2">Court</TableHead>
          <TableHead className="p-2">Players</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ourSignups.map((signup, i) => (
          <TableRow key={i}>
            {signup.onCourt ? (
              <TableCell className="p-2 text-green-300">
                {signup.court}
              </TableCell>
            ) : (
              <TableCell className="p-2">{signup.court}</TableCell>
            )}

            <TableCell className="py-2">
              {formatPlayers(signup.players)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default OurCourtsList;
