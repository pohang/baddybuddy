import { faClone } from '@fortawesome/free-regular-svg-icons/faClone';
import { faSquarePlus } from '@fortawesome/free-regular-svg-icons/faSquarePlus';
import { faBars } from '@fortawesome/free-solid-svg-icons/faBars';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AddPlayerDialog from '~/components/groups/AddPlayerDialog';
import ImageUploadDialog from '~/components/groups/ImageUploadDialog';
import OurCourtsList from '~/components/groups/OurCourtsList';
import ReportIssueDialog from '~/components/groups/ReportIssueDialog';
import SignupTable from '~/components/groups/SignupTable';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { useToast } from '~/components/ui/use-toast';
import { api } from '~/utils/api';
import { formatTime } from '~/utils/time';
import { useRouter } from 'next/router';
import * as React from 'react';
import PlayerList from './PlayerList';

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
  const createGroupMutation = api.groups.createGroup.useMutation({
    onSuccess: async (data) => {
      await router.push(`/groups/${data.id}`);
    },
  });

  const { toast } = useToast();

  const handleCopyLink = async () => {
    const urlWithoutQueryParams = window.location.href.replace(
      window.location.search,
      '',
    );
    await navigator.clipboard.writeText(urlWithoutQueryParams);
    toast({
      title: 'Copied link to clipboard.',
      description: 'Share it with your group!',
    });
  };

  React.useEffect(() => {
    if (router.query.copiedGroupLink) {
      toast({
        title: 'Copied link to clipboard.',
        description: 'Share it with your group!',
      });
      delete router.query.copyGroupLink;
      router.push(router).catch(console.error);
    }
  }, [toast, router]);

  const handleCreateNewGroup = () => {
    createGroupMutation.mutate();
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FontAwesomeIcon icon={faBars} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={handleCopyLink}
              >
                <FontAwesomeIcon className="pr-2" icon={faClone} />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={handleCreateNewGroup}
              >
                <FontAwesomeIcon className="pr-2" icon={faSquarePlus} />
                Create new group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
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
        <div className="flex flex-col items-stretch justify-center gap-4">
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
                <p>Uploaded at {formatTime(signupStateQuery.data?.takenAt)}</p>
              ) : null}
              <div className="flex flex-row gap-4">
                <ReportIssueDialog
                  groupId={groupId}
                  trigger={<Button>Report issue</Button>}
                />
                <Button
                  onClick={async () => {
                    await router.push(`/debug?groupId=${groupId}`);
                  }}
                >
                  Debug
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default GroupOverview;
