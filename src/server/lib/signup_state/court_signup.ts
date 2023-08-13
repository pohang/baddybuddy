export type CourtSignup = {
  court: number;
  // null if court is reserved
  startsAt: Date | null;
  // null if court is reserved
  endsAt: Date | null;
  // queuePosition == 0 means on court
  queuePosition: number;
  players: string[];
};

export const formatSignups = (signups: CourtSignup[]) => {
  signups.sort((a, b) => {
    if (a.court != b.court) {
      return a.court - b.court;
    }
    return a.queuePosition - b.queuePosition;
  });

  let currentCourt = -1;
  const output: string[] = [];
  for (let i = 0; i < signups.length; i++) {
    const courtSignup = signups[i]!;
    if (courtSignup.court != currentCourt) {
      currentCourt = courtSignup.court;
      output.push(`Court ${currentCourt}`);
    }
    const startsAt = courtSignup.startsAt
      ? formatDate(courtSignup.startsAt)
      : 'reserved';
    const endsAt = courtSignup.endsAt
      ? ` - ${formatDate(courtSignup.endsAt)}`
      : '';
    output.push(`${courtSignup.players.join(' ')} ${startsAt}${endsAt}`);
  }
  return output.join('\n');
};

const formatDate = (date: Date) => {
  return date.toLocaleTimeString('en-US', { timeStyle: 'short' });
};
