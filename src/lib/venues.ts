export const VENUES = {
  bintang_burlingame: {
    id: 'bintang_burlingame',
    displayName: 'Bintang Burlingame',
    courtCount: 14,
    courtsPerRow: 4,
  },
  bintang_san_carlos: {
    id: 'bintang_san_carlos',
    displayName: 'Bintang San Carlos',
    courtCount: 7,
    courtsPerRow: 4,
  },
} as const;

export type VenueId = keyof typeof VENUES;
export const DEFAULT_VENUE: VenueId = 'bintang_burlingame';
export const getVenueConfig = (venueId: string) =>
  VENUES[venueId as VenueId] ?? VENUES[DEFAULT_VENUE];
