import { formatTime } from '~/utils/time';
import { describe, expect, it } from 'vitest';

describe('formatTime', () => {
  it('works for time in past', () => {
    const time = new Date(2023, 1, 1, 4, 40);
    const now = new Date(2023, 1, 1, 4, 50);
    const result = formatTime(time, now);
    expect(result).toEqual('4:40 (10 minutes ago)');
  });

  it('works for time that is now', () => {
    const time = new Date(2023, 1, 1, 4, 40);
    const now = new Date(2023, 1, 1, 4, 40);
    const result = formatTime(time, now);
    expect(result).toEqual('4:40 (this minute)');
  });

  it('works for time in future', () => {
    const time = new Date(2023, 1, 1, 4, 50);
    const now = new Date(2023, 1, 1, 4, 40);
    const result = formatTime(time, now);
    expect(result).toEqual('4:50 (in 10 minutes)');
  });

  it('works for pm', () => {
    const time = new Date(2023, 1, 1, 15, 40);
    const now = new Date(2023, 1, 1, 15, 50);
    const result = formatTime(time, now);
    expect(result).toEqual('3:40 (10 minutes ago)');
  });

  it('shows 12 instead of 0', () => {
    const time = new Date(2023, 1, 1, 12, 40);
    const now = new Date(2023, 1, 1, 15, 50);
    const result = formatTime(time, now);
    expect(result).toEqual('12:40 (190 minutes ago)');
  });
});
