import { Button } from '~/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { toast } from 'sonner';
import { DEFAULT_VENUE, VENUES, type VenueId } from '~/lib/venues';
import { api } from '~/utils/api';
import { Loader2 } from 'lucide-react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import * as React from 'react';
import { useLocalStorage } from 'usehooks-ts';

export default function Home() {
  const router = useRouter();
  const [createGroupLoading, setCreateGroupLoading] = React.useState(false);
  const [createGroupError, setCreateGroupError] = React.useState<
    string | null
  >();
  const [selectedVenue, setSelectedVenue] = useLocalStorage<VenueId>(
    'baddybuddy-venue',
    DEFAULT_VENUE,
  );
  const copyGroupIdLink = async () => {
    await navigator.clipboard.writeText(window.location.toString());
    toast('Copied link to clipboard.', {
      description: 'Share it with your group!',
    });
  };

  const createGroupMutation = api.groups.createGroup.useMutation({
    onMutate: () => {
      console.log('Creating group...');
      setCreateGroupLoading(true);
      setCreateGroupError(null);
    },
    onSuccess: async (data) => {
      console.log(`Created group ${data.id}, redirecting to group page.`);
      await router.push(`/groups/${data.id}`);
      await copyGroupIdLink();
    },
    onError: (error) => {
      console.log(`Error while creating group: ${error.message}.`);
      setCreateGroupError(error.message);
    },
    onSettled: () => {
      setCreateGroupLoading(false);
    },
  });

  const handleVenueChange = (value: string) => {
    setSelectedVenue(value as VenueId);
  };

  return (
    <>
      <Head>
        <title>Baddy Buddy</title>
        <meta name="description" content="Helps with badminton signups" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex flex-col items-center justify-center gap-8 max-w-sm md:max-w-lg mx-auto my-8">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-4xl">Baddy Buddy</h1>
        </div>
        <div className="flex flex-col gap-4 items-center">
          <Select value={selectedVenue} onValueChange={handleVenueChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select venue" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(VENUES).map((venue) => (
                <SelectItem key={venue.id} value={venue.id}>
                  {venue.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              createGroupMutation.mutate({ venue: selectedVenue });
            }}
            disabled={createGroupLoading}
          >
            {createGroupLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Create group
          </Button>
        </div>
        {createGroupError ? (
          <p className="text-red-500">{createGroupError}</p>
        ) : null}
        <div className="flex flex-col justify-center items-center">
          <h1 className="text-2xl">Instructions</h1>
          <ol className="list-decimal">
            <li>Create a new group for each badminton session.</li>
            <li>Share the link with the people in your group.</li>
            <li>Everyone should add their username and password.</li>
            <li>
              Update the court state by uploading a picture of the signup
              screen.
            </li>
          </ol>
        </div>
      </main>
    </>
  );
}
