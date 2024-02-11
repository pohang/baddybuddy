import { type google } from '@google-cloud/vision/build/protos/protos';
import {
  cleanUsername,
  processAnnotations,
} from '~/server/lib/signup_state/bintang_burlingame';
import { formatSignups } from '~/server/lib/signup_state/court_signup';
import bintang_burlingame_1 from '~/server/lib/signup_state/testdata/bintang_burlingame_1.json';
import { describe, expect, it } from 'vitest';

describe('processAnnotations', () => {
  it('bintang_burlingame_1', async () => {
    const annotateImageResponse =
      bintang_burlingame_1 as google.cloud.vision.v1.IAnnotateImageResponse;
    const results = processAnnotations({
      annotations: annotateImageResponse,
      takenAt: new Date(2023, 5, 1, 1),
    });
    const formatted = formatSignups(results.courtSignups);
    await expect(formatted).toMatchFileSnapshot(
      './testdata/bintang_burlingame_1.txt',
    );
  });
});

describe('cleanUsername', () => {
  it('transliterates accented characters', () => {
    const cleaned = cleanUsername('davíyu');
    expect(cleaned).toEqual('daviyu');
  });
});
