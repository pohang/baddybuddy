import GroupOverview from '~/components/groups/GroupOverview';
import { Toaster } from '~/components/ui/toaster';
import Head from 'next/head';
import { useRouter } from 'next/router';
import * as React from 'react';

const GroupPage = () => {
  const router = useRouter();
  const groupId = router.query.id as string;

  return (
    <>
      <Head>
        <title>Baddy Buddy</title>
        <meta
          name="description"
          content={`Badminton signups for group ${groupId}`}
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="mx-auto p-4">
        <GroupOverview groupId={groupId} />
      </main>
      <Toaster />
    </>
  );
};

export default GroupPage;
