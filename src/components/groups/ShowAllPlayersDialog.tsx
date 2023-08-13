import { type TRPCClientErrorLike } from '@trpc/client';
import { type UseTRPCQueryResult } from '@trpc/react-query/dist/shared';
import { type inferRouterOutputs } from '@trpc/server';
import PlayerList from '~/components/groups/PlayerList';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { type AppRouter } from '~/server/api/root';
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

const ShowAllPlayersDialog = (props: Props) => {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Show All</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>All Players</DialogTitle>
        </DialogHeader>
        <PlayerList {...props} />
        <DialogFooter>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShowAllPlayersDialog;
