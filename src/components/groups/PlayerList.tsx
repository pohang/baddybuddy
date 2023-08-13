import { type TRPCClientErrorLike } from '@trpc/client';
import { type UseTRPCQueryResult } from '@trpc/react-query/shared';
import { type inferRouterOutputs } from '@trpc/server';
import RemovePlayerDialog from '~/components/groups/RemovePlayerDialog';
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
  groupId: string;
  playerQuery: UseTRPCQueryResult<
    inferRouterOutputs<AppRouter>['players']['getPlayers'],
    TRPCClientErrorLike<AppRouter>
  >;
  signupStateQuery: UseTRPCQueryResult<
    inferRouterOutputs<AppRouter>['signups']['getSignupState'],
    TRPCClientErrorLike<AppRouter>
  >;
};

const PlayerList = (props: Props) => {
  const { groupId, playerQuery, signupStateQuery } = props;

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

  const players = playerQuery.data;
  const playerStatus = new Map<
    string,
    { court: number; startsAt: Date | null; endsAt: Date | null }
  >();
  players.forEach((player) => {
    signupStateQuery.data?.signupsByCourt.forEach((signups, court) => {
      signups.forEach((signup) => {
        if (signup.players.includes(player.username.toLowerCase())) {
          playerStatus.set(player.username.toLowerCase(), {
            court,
            startsAt: signup.startsAt,
            endsAt: signup.endsAt,
          });
          return;
        }
      });
    });
  });

  const formattedPlayers = players.map((p) => {
    const signup = playerStatus.get(p.username.toLowerCase());
    let status;

    if (signup == null) {
      status = 'Needs sign up';
    } else {
      const { startsAt, endsAt, court } = signup;
      if (startsAt == null) {
        status = `On ${court} after res`;
      } else if (startsAt < new Date()) {
        status = `On ${court} until ${formatTime(endsAt!)}`;
      } else {
        status = `Waiting for ${court}, on at ${formatTime(startsAt)}`;
      }
    }

    return {
      username: p.username,
      password: p.password,
      status,
    };
  });

  formattedPlayers.sort((a, b) =>
    new Intl.Collator().compare(a.username, b.username),
  );

  return (
    <Table className="block overflow-y-scroll max-h-96">
      <TableHeader>
        <TableRow>
          <TableHead>Username</TableHead>
          <TableHead>Password</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {formattedPlayers.map((player, i) => (
          <TableRow key={i}>
            <TableCell>{player.username}</TableCell>
            <TableCell>{player.password}</TableCell>
            <TableCell>{player.status}</TableCell>
            <TableCell>
              <RemovePlayerDialog
                groupId={groupId}
                username={player.username}
                onPlayerRemove={playerQuery.refetch}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default PlayerList;
