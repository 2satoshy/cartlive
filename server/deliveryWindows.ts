/**
 * TM-PicknPay delivery time windows — demo-grade (matches this repo's other
 * in-memory/deterministic mocks, no real courier-capacity system behind it).
 * Added 5 Oct 2026 as the prerequisite for a WhatsApp Flow checkout: a Flow
 * delivery-window dropdown needs real options to choose between, and nothing
 * in this codebase offered one before this.
 */

export interface DeliveryWindow {
  id: string;
  label: string;
  day: 'TODAY' | 'TOMORROW';
  startHour: number;
  endHour: number;
}

// Four 2-hour slots a day — enough to feel real, few enough to fit a WhatsApp
// Flow dropdown or a 10-row list without crowding out everything else.
const SLOT_HOURS: Array<[number, number]> = [
  [9, 11],
  [11, 13],
  [14, 16],
  [16, 18],
];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Only today's slots that start at least 2h from now are offered — a 9am
 * slot showing as "available" at 8:55am would be a real order nobody could
 * actually fulfil in time.
 */
export function getAvailableWindows(now: Date = new Date()): DeliveryWindow[] {
  const hour = now.getHours();
  const windows: DeliveryWindow[] = [];
  for (const [start, end] of SLOT_HOURS) {
    if (start >= hour + 2) {
      windows.push({ id: `TODAY_${start}`, label: `Today · ${pad(start)}:00–${pad(end)}:00`, day: 'TODAY', startHour: start, endHour: end });
    }
  }
  for (const [start, end] of SLOT_HOURS) {
    windows.push({ id: `TOMORROW_${start}`, label: `Tomorrow · ${pad(start)}:00–${pad(end)}:00`, day: 'TOMORROW', startHour: start, endHour: end });
  }
  return windows;
}

/**
 * Resolves an already-chosen window id back to its label without depending
 * on "now" again — a window picked at 10am and looked up again at 3pm must
 * still resolve the same way, not silently disappear because the available-
 * windows list moved on.
 */
export function resolveWindowLabel(id: string): string | null {
  const match = /^(TODAY|TOMORROW)_(\d+)$/.exec(id);
  if (!match) return null;
  const [, day, startStr] = match;
  const start = Number(startStr);
  const slot = SLOT_HOURS.find(([s]) => s === start);
  if (!slot) return null;
  return `${day === 'TODAY' ? 'Today' : 'Tomorrow'} · ${pad(slot[0])}:00–${pad(slot[1])}:00`;
}

/** Used by the typed/fallback checkout path, which doesn't ask the user to
 * pick a window — Parkinson's Law: infer the earliest real option rather
 * than add a step the Flow path already exists to handle properly. */
export function getEarliestWindow(now: Date = new Date()): DeliveryWindow {
  const windows = getAvailableWindows(now);
  return windows[0] ?? { id: 'TOMORROW_9', label: 'Tomorrow · 09:00–11:00', day: 'TOMORROW', startHour: 9, endHour: 11 };
}
