import AddPlayerDialog from '~/components/groups/AddPlayerDialog';
import ImageUploadDialog from '~/components/groups/ImageUploadDialog';
import NeedsSignupList from '~/components/groups/NeedsSignupList';
import OurCourtsList from '~/components/groups/OurCourtsList';
import ShowAllPlayersDialog from '~/components/groups/ShowAllPlayersDialog';
import SignupTable from '~/components/groups/SignupTable';
import { Button } from '~/components/ui/button';
import { useToast } from '~/components/ui/use-toast';
import { api } from '~/utils/api';
import { formatTime } from '~/utils/time';
import { useRouter } from 'next/router';
import * as React from 'react';

type Props = {
  groupId: string;
};

const GroupOverview = (props: Props) => {
  const router = useRouter();
  const { groupId } = props;
  const groupQuery = api.groups.getGroup.useQuery(
    { groupId },
    {
      enabled: !!groupId,
    },
  );
  const playerQuery = api.players.getPlayers.useQuery(
    { groupId },
    {
      refetchInterval: 30 * 1000,
      enabled: !!groupId,
    },
  );
  const signupStateQuery = api.signups.getSignupState.useQuery(
    { groupId },
    {
      refetchInterval: 30 * 1000,
      enabled: !!groupId,
    },
  );

  const { toast } = useToast();

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.toString());
    toast({
      title: 'Copied link to clipboard.',
      description: 'Share it with your group!',
    });
  };

  if (groupQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (groupQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center">
        <p>Something went wrong!</p>
        <p>{groupQuery.error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-stretch justify-center gap-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4 mx-auto justify-center">
          <div className="flex flex-col">
            <h1 className="text-4xl">{groupId}</h1>
            <p className="mx-auto">
              {groupQuery.data.createdAt.toLocaleDateString()}
            </p>
          </div>
          <Button onClick={handleCopyLink}>Copy link</Button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p>{playerQuery.data?.length} players</p>
        </div>
        <div className="flex gap-2">
          <ShowAllPlayersDialog
            groupId={groupId}
            playerQuery={playerQuery}
            signupStateQuery={signupStateQuery}
          />
          <AddPlayerDialog
            groupId={groupId}
            onPlayerAdd={playerQuery.refetch}
          />
        </div>
      </div>
      <div className="flex flex-col">
        <h2 className="text-2xl">Needs signup</h2>
        <NeedsSignupList
          playerQuery={playerQuery}
          signupStateQuery={signupStateQuery}
        />
      </div>
      <div className="flex flex-col">
        <h2 className="text-2xl">Our courts</h2>
        <OurCourtsList
          playerQuery={playerQuery}
          signupStateQuery={signupStateQuery}
        />
      </div>
      <div>
        <div className="flex flex-col items-stretch justify-center gap-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl">All Courts</h2>
            <div className="flex items-center gap-2">
              <ImageUploadDialog
                groupId={groupId}
                onUploadSuccess={signupStateQuery.refetch}
              />
            </div>
          </div>
          {signupStateQuery.data ? (
            <SignupTable
              playerQuery={playerQuery}
              signupStateQuery={signupStateQuery}
            />
          ) : null}
          {signupStateQuery.data?.imageUri ? (
            <div className="flex flex-col items-center justify-center gap-4">
              <img src={signupStateQuery.data?.imageUri} alt="signup state" />
              {signupStateQuery.data?.takenAt ? (
                <p>
                  Picture taken at {formatTime(signupStateQuery.data?.takenAt)}
                </p>
              ) : null}
              <Button
                onClick={async () => {
                  await router.push(
                    `/debug?fileName=${signupStateQuery.data?.fileName || ''}`,
                  );
                }}
              >
                Debug
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default GroupOverview;
