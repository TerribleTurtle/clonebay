export type DashboardStatus = 'Green' | 'Yellow' | 'Red';

export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const MS_PER_SECOND = 1000;
export const HOURS_IN_DAY = 24;
export const YELLOW_THRESHOLD_DAYS = 3;
export const YELLOW_THRESHOLD_PI_PERCENT = 0.85;
export const YELLOW_THRESHOLD_HOURS = 12;
export const DEFAULT_WALLET_MIN_THRESHOLD = 100_000_000;
export const DEFAULT_CLONE_COOLDOWN_HOURS = 24;

export const MS_IN_HOUR = MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;
export const MS_IN_DAY = HOURS_IN_DAY * MS_IN_HOUR;

