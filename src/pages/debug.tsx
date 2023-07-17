import { type TRPCClientErrorLike } from '@trpc/client';
import { type UseTRPCQueryResult } from '@trpc/react-query/shared';
import { type inferRouterOutputs } from '@trpc/server';
import { type AppRouter } from '~/server/api/root';
import { api } from '~/utils/api';
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
  const fileName = searchParams.get('fileName') || '';
  const [imageDimensions, setImageDimensions] = React.useState<{
    height: number;
    width: number;
  } | null>(null);
  const debugSignupStateImageQuery = api.signups.debugSignupStateImage.useQuery(
    {
      fileName,
    },
    {
      onSuccess: (data) => {
        loadImage(setImageDimensions, data.imageUri);
      },
    },
  );

  const renderContent = () => {
    if (debugSignupStateImageQuery.isLoading || imageDimensions == null) {
      return <div>Loading...</div>;
    }
    if (debugSignupStateImageQuery.isError) {
      return (
        <div>
          Something went wrong: {debugSignupStateImageQuery.error.message}
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        <Canvas
          width={imageDimensions.width}
          height={imageDimensions.height}
          debugSignupStateImageQuery={debugSignupStateImageQuery}
        />
        {debugSignupStateImageQuery.data.courtDebugInfo.map((info, i) => {
          return (
            <div key={i}>
              <p>Court {info.court}</p>
              {info.lines.map((l, j) => {
                return <p key={j}>{JSON.stringify(l)}</p>;
              })}
            </div>
          );
        })}
        {JSON.stringify(debugSignupStateImageQuery.data.courtSignups)}
      </div>
    );
  };

  if (debugSignupStateImageQuery.isLoading) {
    return <div>Loading...</div>;
  }

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
