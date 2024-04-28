import { Button } from '~/components/ui/button';
import { useToast } from '~/components/ui/use-toast';
import { api } from '~/utils/api';
import { Loader2 } from 'lucide-react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import * as React from 'react';

export default function Home() {
  const router = useRouter();
  const [createGroupLoading, setCreateGroupLoading] = React.useState(false);
  const [createGroupError, setCreateGroupError] = React.useState<
    string | null
  >();
  const { toast } = useToast();

  const copyGroupIdLink = async () => {
    await navigator.clipboard.writeText(window.location.toString());
    toast({
      title: 'Copied link to clipboard.',
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
        <Button
          onClick={() => {
            createGroupMutation.mutate();
          }}
          disabled={createGroupLoading}
        >
          {createGroupLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Create group
        </Button>
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
