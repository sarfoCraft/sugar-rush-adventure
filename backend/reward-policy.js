// Shared, deterministic server-side rewards policy (all days and windows in UTC).
export const FREE_WINDOW_MS = 3 * 60 * 60 * 1000;
export const FREE_CLAIM_LIMIT = 5;
export const FREE_REWARD = 2500;
export const DAILY_REWARDS = Object.freeze([500,1000,1500,2000,3000,4000,10000]);
export const EVENT_REWARD = 5000;
export const utcDate = date => new Date(date).toISOString().slice(0,10);
export const dayBefore = date => utcDate(new Date(Date.parse(utcDate(date)+'T00:00:00Z')-86400000));
export function freeWindow(date) {
  const id=Math.floor(new Date(date).getTime()/FREE_WINDOW_MS);
  return {id, start:new Date(id*FREE_WINDOW_MS),end:new Date((id+1)*FREE_WINDOW_MS)};
}
export function weekendWindow(date) {
  const now = new Date(date);
  const d = new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
  const day = d.getUTCDay();
  const saturday = new Date(d.getTime()-(day===0?1:day===6?0:(day+1))*86400000);
  const monday = new Date(saturday.getTime()+2*86400000);
  return { active:day===0||day===6, key:utcDate(saturday), start:saturday,end:monday};
}
export function dailyStreakNext(lastDay,previousStreak,now) {
  if (lastDay === utcDate(now)) return Math.max(1,previousStreak);
  return lastDay === dayBefore(now) ? Math.max(1,previousStreak+1) : 1;
}
