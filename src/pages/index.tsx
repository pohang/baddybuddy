import { Button } from '~/components/ui/button';
import { api } from '~/utils/api';
import Head from 'next/head';
import { useRouter } from 'next/router';
import * as React from 'react';

export default function Home() {
  const router = useRouter();
  const [createGroupError, setCreateGroupError] = React.useState<
    string | null
  >();

  const createGroupMutation = api.groups.createGroup.useMutation({
    onMutate: () => {
      console.log('Creating group...');
      setCreateGroupError(null);
    },
    onSuccess: async (data) => {
      console.log(`Created group ${data.id}, redirecting to group page.`);
      await router.push(`/groups/${data.id}`);
    },
    onError: (error) => {
      console.log(`Error while creating group: ${error.message}.`);
      setCreateGroupError(error.message);
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
        >
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
