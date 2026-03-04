export function getMonthRange(offset: number) {
  const now = new Date();

  const start = new Date(
    now.getFullYear(),
    now.getMonth() + offset,
    1,
    0,
    0,
    0,
    0
  );

  const end = new Date(
    now.getFullYear(),
    now.getMonth() + offset + 1,
    0,
    23,
    59,
    59,
    999
  );

  return { start, end };
}

export function isWithinRange(date: Date, start: Date, end: Date) {
  return date >= start && date <= end;
}
