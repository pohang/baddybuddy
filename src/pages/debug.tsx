import { type TRPCClientErrorLike } from '@trpc/client';
import { type UseTRPCQueryResult } from '@trpc/react-query/shared';
import { type inferRouterOutputs } from '@trpc/server';
import OurCourtsList from '~/components/groups/OurCourtsList';
import PlayerList from '~/components/groups/PlayerList';
import SignupTable from '~/components/groups/SignupTable';
import { Input } from '~/components/ui/input';
import { getVenueConfig } from '~/lib/venues';
import { type AppRouter } from '~/server/api/root';
import { api } from '~/utils/api';
import { formatTime } from '~/utils/time';
import Head from 'next/head';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';

const loadImage = (
  setImageDimensions: ({
    height,
    width,
  }: {
    height: number;
    width: number;
  }) => void,
  imageUrl: string,
) => {
  const img = new Image();
  img.src = imageUrl;

  img.onload = () => {
    setImageDimensions({
      height: img.height,
      width: img.width,
    });
  };
  img.onerror = (err) => {
    console.error(err);
  };
};

type DebugData = {
  debugSignupStateImageQuery: UseTRPCQueryResult<
    inferRouterOutputs<AppRouter>['signups']['debugSignupStateImage'],
    TRPCClientErrorLike<AppRouter>
  >;
  width: number;
  height: number;
};

const Canvas = (props: DebugData) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const { debugSignupStateImageQuery, width, height } = props;

  React.useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx == null) {
        return;
      }
      const img = new Image();
      img.src = debugSignupStateImageQuery.data?.imageUri || '';

      img.onload = () => {
        ctx.drawImage(img, 0, 0);

        const data = debugSignupStateImageQuery.data;
        if (data == null) {
          return;
        }

        data.courtDebugInfo
          .flatMap((x) => x.boundingPolys)
          .forEach((rect) => {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(rect[0]!.x, rect[0]!.y);
            ctx.lineTo(rect[1]!.x, rect[1]!.y);
            ctx.lineTo(rect[2]!.x, rect[2]!.y);
            ctx.lineTo(rect[3]!.x, rect[3]!.y);
            ctx.lineTo(rect[0]!.x, rect[0]!.y);
            ctx.stroke();
          });

        data.courtDebugInfo
          .map((x) => x.boundingPolyForCourt)
          .forEach((rect) => {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(rect[0]!.x, rect[0]!.y);
            ctx.lineTo(rect[1]!.x, rect[1]!.y);
            ctx.lineTo(rect[2]!.x, rect[2]!.y);
            ctx.lineTo(rect[3]!.x, rect[3]!.y);
            ctx.lineTo(rect[0]!.x, rect[0]!.y);
            ctx.stroke();
          });
      };
    }
  }, [
    debugSignupStateImageQuery.data,
    debugSignupStateImageQuery.data?.imageUri,
  ]);

  return <canvas ref={canvasRef} width={width} height={height} />;
};

export default function Debug() {
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId') || '';
  const [imageDimensions, setImageDimensions] = React.useState<{
    height: number;
    width: number;
  } | null>(null);
  const [timeOverrideValue, setTimeOverrideValue] = React.useState('');
  const [timeOverride, setTimeOverride] = React.useState<Date | null>(null);

  const groupQuery = api.groups.getGroup.useQuery(
    { groupId },
    { enabled: !!groupId },
  );
  const uploadTimesQuery = api.signups.getUploadTimes.useQuery({ groupId });
  const playerQuery = api.players.getPlayers.useQuery({ groupId });
  const signupStateQuery = api.signups.getSignupState.useQuery({
    groupId,
    currentTime: timeOverride ?? undefined,
  });

  const venueConfig = getVenueConfig(groupQuery.data?.venue ?? 'bintang_burlingame');

  const debugSignupStateImageQuery = api.signups.debugSignupStateImage.useQuery(
    {
      fileName: signupStateQuery?.data?.fileName || '',
    },
    {
      enabled: !!signupStateQuery?.data?.fileName,
    },
  );

  React.useEffect(() => {
    if (debugSignupStateImageQuery.data?.imageUri) {
      loadImage(setImageDimensions, debugSignupStateImageQuery.data?.imageUri);
    }
  }, [debugSignupStateImageQuery]);

  const handleTimeOverrideChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeOverrideValue(e.target.value);
    const parsed = Date.parse(e.target.value);
    // must be valid timestamp and past 2024
    if (!isNaN(parsed) && parsed >= 1704067200000) {
      setTimeOverride(new Date(parsed));
    }

    if (e.target.value.length === 0) {
      setTimeOverride(null);
    }
  };

  const renderContent = () => {
    if (debugSignupStateImageQuery.isError) {
      return (
        <div>
          Something went wrong: {debugSignupStateImageQuery.error.message}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <div className="flex">
          <Input
            type="text"
            placeholder="Time override: 2024-01-01 10:00:00"
            onChange={handleTimeOverrideChange}
            value={timeOverrideValue}
          />
        </div>
        {imageDimensions ? (
          <>
            <Canvas
              width={imageDimensions.width}
              height={imageDimensions.height}
              debugSignupStateImageQuery={debugSignupStateImageQuery}
            />
            {signupStateQuery.data?.takenAt ? (
              <p>
                Uploaded at{' '}
                {formatTime(signupStateQuery.data?.takenAt, timeOverride)}
              </p>
            ) : null}
            {debugSignupStateImageQuery.data?.courtDebugInfo.map((info, i) => {
              return (
                <div key={i}>
                  <p>Court {info.court}</p>
                  {info.lines.map((l, j) => {
                    return <p key={j}>{JSON.stringify(l)}</p>;
                  })}
                </div>
              );
            })}
          </>
        ) : null}
        <PlayerList
          groupId={groupId}
          playerQuery={playerQuery}
          signupStateQuery={signupStateQuery}
          timeOverride={timeOverride}
        />
        <OurCourtsList
          playerQuery={playerQuery}
          signupStateQuery={signupStateQuery}
          timeOverride={timeOverride}
        />
        {signupStateQuery.data ? (
          <SignupTable
            playerQuery={playerQuery}
            signupStateQuery={signupStateQuery}
            timeOverride={timeOverride}
            courtCount={venueConfig.courtCount}
          />
        ) : null}
        {JSON.stringify(debugSignupStateImageQuery.data?.courtSignups)}
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Baddy Buddy</title>
        <meta name="description" content="Helps with badminton signups" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>{renderContent()}</main>
    </>
  );
}
