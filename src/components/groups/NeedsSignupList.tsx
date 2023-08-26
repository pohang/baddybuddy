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
import * as React from 'react';
import { PASSWORD_AS_EMOJI } from '~/utils/emoji';

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

const NeedsSignupList = (props: Props) => {
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

  // find players that aren't in the signup

  const players = playerQuery.data;
  const playersSignedUp = new Set<string>();
  signupStateQuery.data?.signupsByCourt.forEach((signups, court) => {
    signups.forEach((signup) => {
      signup.players.forEach((player) =>
        playersSignedUp.add(player.toLowerCase()),
      );
    });
  });

  const playersNotSignedUp: { username: string; password: string }[] = [];
  players.forEach((player) => {
    if (!playersSignedUp.has(player.username.toLowerCase())) {
      playersNotSignedUp.push({
        username: player.username,
        password: player.password,
      });
    }
  });

  playersNotSignedUp.sort((a, b) =>
    new Intl.Collator().compare(a.username, b.username),
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="p-2">Username</TableHead>
          <TableHead className="p-2">Password</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {playersNotSignedUp.map((player, i) => (
          <TableRow key={i}>
            <TableCell className="p-2">{player.username}</TableCell>
            <TableCell className="p-2">{`${PASSWORD_AS_EMOJI[player.password] ?? ''} ${player.password}`}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default NeedsSignupList;
