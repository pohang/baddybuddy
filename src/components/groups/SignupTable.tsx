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

const PlayerList = (props: Props) => {
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

  const playerNames =
    playerQuery.data?.map((p) => p.username.toLowerCase()) || [];

  const renderCourt = (court: number) => {
    const signups = signupStateQuery.data?.signupsByCourt?.get(court) || [];
    console.log(signups);
    let minutesLeft;
    if (signups.length === 0) {
      minutesLeft = '';
    } else if (signups[0]!.endsAt == null) {
      minutesLeft = 'reserved';
    } else {
      const endsAt = signups[0]!.endsAt;
      minutesLeft = Math.ceil((endsAt.getTime() - Date.now()) / 1000 / 60);
    }
    return (
      <div className="flex flex-col text-xs">
        <div className="font-bold">Court {court}</div>
        <div>Minutes left: {minutesLeft}</div>
        <div>
          {signups.map((signup, signupI) => {
            return (
              <div key={`${court}-${signupI}`} className="flex gap-1">
                {signup.players.map((player, playerI) => {
                  const key = `${court}-${signupI}-${playerI}`;
                  if (playerNames.includes(player)) {
                    return (
                      <div key={key} className="text-green-300">
                        {player}
                      </div>
                    );
                  } else {
                    return <div key={key}>{player}</div>;
                  }
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 14 }, (_, i) => {
        return renderCourt(i + 1);
      })}
    </div>
  );
};

export default PlayerList;
