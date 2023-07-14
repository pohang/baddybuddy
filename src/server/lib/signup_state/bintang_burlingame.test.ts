import { type google } from '@google-cloud/vision/build/protos/protos';
import { processAnnotations } from '~/server/lib/signup_state/bintang_burlingame';
import data from '~/server/lib/signup_state/test_data.json';
import { describe, expect, it } from 'vitest';

const annotateImageResponse =
  data as google.cloud.vision.v1.IAnnotateImageResponse;
describe('processAnnotations', () => {
  it('does something', () => {
    const results = processAnnotations({
      annotations: annotateImageResponse,
      takenAt: new Date(2023, 5, 1),
    });
    expect(results).toBeTruthy();
    // if you want to see what the results look like, uncomment the next lines
    // expect(results.map((r) => ({
    //   court: r.court,
    //   queuePosition: r.queuePosition,
    //   players: (r.players?.createMany?.data || [])
    //     .map((p) => p.player)
    //     .toString(),
    //   startsAt: r.startsAt,
    //   endsAt: r.endsAt,
    // })).toBeNull();
  });
});
