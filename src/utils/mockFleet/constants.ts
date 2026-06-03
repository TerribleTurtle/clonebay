/* eslint-disable no-restricted-syntax */
 
export const nowMs = Date.now();
export const MINUTES_IN_HOUR = 60;
export const SECONDS_IN_MINUTE = 60;
export const MS_IN_SECOND = 1000;
export const HOURS_IN_DAY = 24;

export const msPerHour = MINUTES_IN_HOUR * SECONDS_IN_MINUTE * MS_IN_SECOND;
export const msPerDay = HOURS_IN_DAY * msPerHour;
export const TWO_DAYS = 2;
export const TEN_DAYS = 10;
export const TWENTY_HOURS = 20;
export const FIFTEEN_HOURS = 15;
export const FIVE_HOURS = 5;
export const MOCK_IMPLANT_ID = 22118;

// Clone helper to avoid mutating the imported raw JSON
export const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const shiftDate = (dateStr: string, offsetMs: number) => {
  return new Date(new Date(dateStr).getTime() + offsetMs).toISOString();
};
