const rtf = new Intl.RelativeTimeFormat('en-US', {
  numeric: 'auto',
  style: 'short'
});

export const formatTime = (time: Date, now?: Date) => {
  const nowDate = now || new Date();
  const deltaSeconds = Math.round((time.getTime() - nowDate.getTime()) / 1000);
  const relative = rtf.format(Math.ceil(deltaSeconds / 60), 'minute');
  let hours = time.getHours() % 12;
  if (hours === 0) {
    // show 12:59 instead of 0:59
    hours = 12;
  }
  return `${hours}:${time
    .getMinutes()
    .toString()
    .padStart(2, '0')} (${relative})`;
};

export const getMinRemaining = (time: Date, now?: Date) => {
  const nowDate = now || new Date();
  const deltaSeconds = Math.round((time.getTime() - nowDate.getTime()) / 1000);
  return Math.ceil(deltaSeconds / 60);
};

export type UrgencyStatus = 'urgent' | 'soon' | 'normal';

export const getExpiringUrgency = (mins: number): UrgencyStatus => {
  if (mins <= 3) {
    return 'urgent';
  } else if (mins <= 6) {
    return 'soon';
  } else {
    return 'normal'
  }
}

export const UrgencyColors: Record<UrgencyStatus, React.CSSProperties['color']> = {
  urgent: 'red',
  soon: 'goldenrod',
  normal: 'green'
}
