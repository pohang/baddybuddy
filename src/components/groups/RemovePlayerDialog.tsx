import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { api } from '~/utils/api';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle } from '@fortawesome/free-regular-svg-icons';

type Props = {
  groupId: string;
  username: string;
  onPlayerRemove: () => void;
};

const RemovePlayerDialog = (props: Props) => {
  const { groupId, username, onPlayerRemove } = props;
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const removePlayerMutation = api.players.removePlayer.useMutation();

  const onSubmit = async () => {
    setLoading(true);
    await removePlayerMutation.mutateAsync(
      {
        groupId,
        username,
      },
      {
        onSettled: () => {
          setLoading(false);
        },
      },
    );

    onPlayerRemove();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost"><FontAwesomeIcon icon={faTimesCircle}></FontAwesomeIcon></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove player</DialogTitle>
        </DialogHeader>
        <p>Remove {username}?</p>
        <DialogFooter>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button disabled={loading} variant="destructive" onClick={onSubmit}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Remove
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RemovePlayerDialog;
