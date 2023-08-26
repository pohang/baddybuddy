import AddPlayerDialog from '~/components/groups/AddPlayerDialog';
import ImageUploadDialog from '~/components/groups/ImageUploadDialog';
import OurCourtsList from '~/components/groups/OurCourtsList';
import SignupTable from '~/components/groups/SignupTable';
import { Button } from '~/components/ui/button';
import { useToast } from '~/components/ui/use-toast';
import { api } from '~/utils/api';
import { formatTime } from '~/utils/time';
import { useRouter } from 'next/router';
import * as React from 'react';
import PlayerList from './PlayerList';
import { useLocalStorage } from "usehooks-ts";
import { faClone, faUser } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type Props = {
  groupId: string;
};

const GroupOverview = (props: Props) => {
  const router = useRouter();
  const { groupId } = props;

  const [onlyShowUnsigned, setOnlyShowUnsigned] = useLocalStorage('onlyShowUnsignedPlayers', false);

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
        <div className="flex items-center gap-4 justify-between">
          <AddPlayerDialog
            groupId={groupId}
            playerCount={playerQuery.data?.length || 0}
            onPlayerAdd={playerQuery.refetch}
          />
          <div className="flex flex-col">
            <h1 className="text-4xl">{groupId}</h1>
          </div>
          <Button variant='outline' onClick={handleCopyLink}><FontAwesomeIcon icon={faClone} /></Button>
        </div>
      </div>
      {/* <div className="flex items-center justify-between">
        <Button onClick={() => setOnlyShowUnsigned(!onlyShowUnsigned)}>
          {onlyShowUnsigned ? 'All users' : 'Hide signed'}
        </Button>
      </div> */}
      <div className="flex flex-col">
        <PlayerList
          groupId={groupId}
          playerQuery={playerQuery}
          signupStateQuery={signupStateQuery}
        />
      </div>
      <div className="flex flex-col">
        <h2 className="text-2xl">Our slots</h2>
        <OurCourtsList
          playerQuery={playerQuery}
          signupStateQuery={signupStateQuery}
        />
      </div>
      <div>
        <div className="flex flex-col items-stretch justify-center gap-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl">All courts</h2>
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
                  Uploaded at {formatTime(signupStateQuery.data?.takenAt)}
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
