export function getRecordHref(date: string) {
  return `/records?date=${encodeURIComponent(date)}`;
}
