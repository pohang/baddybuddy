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
import { getMinRemaining } from '~/utils/time';
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
  timeOverride?: Date | null;
};

const PlayerList = (props: Props) => {
  const { groupId, playerQuery, signupStateQuery, timeOverride } = props;
  const now = timeOverride || new Date();

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

  const formattedPlayers = players
    .map((p) => {
      const signup = playerStatus.get(p.username.toLowerCase());
      let status;
      let end = new Date(0);

      if (signup == null) {
        status = '🚫';
      } else {
        const { startsAt, endsAt, court } = signup;
        if (endsAt) {
          end = endsAt;
        }
        if (startsAt == null) {
          status = `${court} (after res)`;
        } else if (startsAt < now && endsAt) {
          status = `${court} (${getMinRemaining(endsAt, now)}m left)`;
        } else {
          status = `${court} in ${getMinRemaining(startsAt, now)}m`;
        }
      }

      return {
        username: p.username,
        password: p.password,
        status,
        end,
      };
    })
    .sort((a, b) => a.end.getTime() - b.end.getTime());

  console.log(formattedPlayers);

  if (!formattedPlayers.length) {
    return <div className="mx-auto text-gray-500">No players yet</div>;
  }

  return (
    <Table className="overflow-y-scroll max-h-96 table-auto">
      <TableHeader>
        <TableRow>
          <TableHead className="p-1"></TableHead>
          <TableHead className="p-1">User</TableHead>
          <TableHead className="p-1">Animal</TableHead>
          <TableHead className="p-1">Court</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {formattedPlayers.map((player) => (
          <TableRow key={player.username}>
            <TableCell className="p-0">
              <RemovePlayerDialog
                groupId={groupId}
                username={player.username}
                onPlayerRemove={playerQuery.refetch}
              />
            </TableCell>
            <TableCell className="p-1">
              <div style={{ overflowWrap: 'anywhere' }}>{player.username}</div>
            </TableCell>
            <TableCell className="p-1" style={{ whiteSpace: 'nowrap' }}>
              {player.password}
            </TableCell>
            <TableCell className="p-1">{player.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default PlayerList;
