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
import { PasswordEmojis } from '~/utils/emoji';
import { getMinRemaining } from '~/utils/time';
import _ from 'lodash';
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
  timeOverride?: Date | null;
};

export const pillStyles: React.CSSProperties = {
  whiteSpace: 'nowrap',
  borderRadius: 32,
  padding: '0 6px',
  backgroundColor: 'ghostwhite',
  border: '1px solid lightgray',
  minWidth: 'fit-content',
};
const ourPlayerPillStyles: React.CSSProperties = {
  ...pillStyles,
  color: 'seagreen',
  backgroundColor: '#e3fae6',
  border: '1px solid green',
};

const OurCourtsList = (props: Props) => {
  const { playerQuery, signupStateQuery, timeOverride } = props;
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

  // Find signups that contain a name that's part of our group.
  const playerData = _.keyBy(
    playerQuery.data.map((player) => ({
      username: player.username,
      password: player.password,
    })),
    'username',
  );
  const ourSignups: {
    court: string;
    players: string[];
    onCourt: boolean;
    sortIndex: number;
    minsRemaining: number;
  }[] = [];
  signupStateQuery.data?.signupsByCourt.forEach((signups, court) => {
    signups.forEach((signup) => {
      if (signup.players.some((player) => player in playerData)) {
        let sortIndex;
        let onCourt = false;
        let minsRemaining = -1;

        if (signup.startsAt === null) {
          sortIndex = Number.MAX_SAFE_INTEGER;
        } else if (signup.startsAt < now && signup.endsAt) {
          sortIndex = signup.startsAt.getTime();
          onCourt = true;
          minsRemaining = getMinRemaining(signup.endsAt, now);
        } else {
          minsRemaining = getMinRemaining(signup.startsAt, now);
          sortIndex = signup.startsAt.getTime();
        }
        ourSignups.push({
          court: `${court}`,
          players: signup.players,
          onCourt,
          sortIndex,
          minsRemaining,
        });
      }
    });
  });

  ourSignups.sort((a, b) => a.sortIndex - b.sortIndex);

  const formatPlayers = (players: string[]) => {
    return (
      <div className="flex gap-px">
        {players.map((player, i) => {
          if (player in playerData) {
            return (
              <div key={i} style={ourPlayerPillStyles}>
                {`${player} ${
                  PasswordEmojis[playerData[player]!.password] ?? ''
                }`}
              </div>
            );
          }
          return (
            <div style={pillStyles} key={i}>
              {player}
            </div>
          );
        })}
      </div>
    );
  };

  if (!ourSignups.length) {
    return <div className="mx-auto text-gray-500">No slots yet</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="p-1">Court</TableHead>
          <TableHead className="p-1">Time</TableHead>
          <TableHead className="p-1">Players</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ourSignups.map((signup, i) => (
          <TableRow key={i}>
            <TableCell className="p-1 py-2">{signup.court}</TableCell>
            <TableCell
              className="p-1 text-green-600"
              style={{ whiteSpace: 'nowrap' }}
            >
              {signup.onCourt
                ? `${signup.minsRemaining}m`
                : `in ${signup.minsRemaining}m`}
            </TableCell>

            <TableCell className="p-1">
              {formatPlayers(signup.players)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default OurCourtsList;
