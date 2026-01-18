// Utility functions for validation, computation, and helpers

import type { AvailabilitySettings, BestWindow } from "./types";

// ID generation
export function generateId(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Validation
export function validateAvailabilitySettings(
  settings: unknown
): settings is AvailabilitySettings {
  if (!settings || typeof settings !== "object") return false;
  const s = settings as Record<string, unknown>;

  return (
    typeof s.tz === "string" &&
    typeof s.startDate === "string" &&
    typeof s.days === "number" &&
    s.days > 0 &&
    s.days <= 30 &&
    typeof s.dayStart === "number" &&
    s.dayStart >= 0 &&
    s.dayStart < 24 &&
    typeof s.dayEnd === "number" &&
    s.dayEnd > s.dayStart &&
    s.dayEnd <= 24 &&
    typeof s.slotMinutes === "number" &&
    (s.slotMinutes === 15 || s.slotMinutes === 30 || s.slotMinutes === 60)
  );
}

export function validateSlotIndexes(
  indexes: unknown,
  maxSlots: number
): boolean {
  if (!Array.isArray(indexes)) return false;
  if (indexes.length === 0 || indexes.length > maxSlots) return false;

  const seen = new Set<number>();
  for (const idx of indexes) {
    if (typeof idx !== "number" || idx < 0 || idx >= maxSlots) return false;
    if (seen.has(idx)) return false; // no duplicates
    seen.add(idx);
  }

  return true;
}

export function validateComment(comment: unknown): boolean {
  if (typeof comment !== "string") return false;
  return comment.length <= 280;
}

// Heatmap computation
export function computeSlotCount(settings: AvailabilitySettings): number {
  const hoursPerDay = settings.dayEnd - settings.dayStart;
  const slotsPerDay = (hoursPerDay * 60) / settings.slotMinutes;
  return settings.days * slotsPerDay;
}

export function aggregateSlotCounts(
  slotCount: number,
  contributions: Array<{ payload: { selectedSlotIndexes?: number[] } }>
): number[] {
  const slotCounts = new Array(slotCount).fill(0);

  for (const contrib of contributions) {
    const indexes = contrib.payload.selectedSlotIndexes;
    if (Array.isArray(indexes)) {
      for (const idx of indexes) {
        if (idx >= 0 && idx < slotCount) {
          slotCounts[idx]++;
        }
      }
    }
  }

  return slotCounts;
}

export function findBestWindows(
  slotCounts: number[],
  settings: AvailabilitySettings,
  topN = 3
): BestWindow[] {
  const slotsPerDay = computeSlotsPerDay(settings);
  const minWindowSlots = Math.ceil(60 / settings.slotMinutes); // at least 60 minutes

  const windows: BestWindow[] = [];

  // Find all possible windows
  for (let dayIndex = 0; dayIndex < settings.days; dayIndex++) {
    const dayStartIdx = dayIndex * slotsPerDay;
    const dayEndIdx = dayStartIdx + slotsPerDay;

    for (
      let startIdx = dayStartIdx;
      startIdx <= dayEndIdx - minWindowSlots;
      startIdx++
    ) {
      for (let endIdx = startIdx + minWindowSlots; endIdx <= dayEndIdx; endIdx++) {
        // Calculate minimum availability in this window
        let minAvailable = Infinity;
        for (let i = startIdx; i < endIdx; i++) {
          minAvailable = Math.min(minAvailable, slotCounts[i] || 0);
        }

        if (minAvailable > 0) {
          windows.push({
            dayIndex,
            startSlotIndex: startIdx,
            endSlotIndex: endIdx,
            availableCount: minAvailable,
            windowLength: endIdx - startIdx,
          });
        }
      }
    }
  }

  // Sort by availableCount (desc), then windowLength (desc)
  windows.sort((a, b) => {
    if (b.availableCount !== a.availableCount) {
      return b.availableCount - a.availableCount;
    }
    return b.windowLength - a.windowLength;
  });

  return windows.slice(0, topN);
}

export function computeSlotsPerDay(settings: AvailabilitySettings): number {
  const hoursPerDay = settings.dayEnd - settings.dayStart;
  return (hoursPerDay * 60) / settings.slotMinutes;
}

export function slotIndexToTimeString(
  slotIndex: number,
  settings: AvailabilitySettings
): string {
  const slotsPerDay = computeSlotsPerDay(settings);
  const dayIndex = Math.floor(slotIndex / slotsPerDay);
  const slotInDay = slotIndex % slotsPerDay;

  const minutesFromDayStart = slotInDay * settings.slotMinutes;
  const hour = settings.dayStart + Math.floor(minutesFromDayStart / 60);
  const minute = minutesFromDayStart % 60;

  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

export function getDayLabel(
  dayIndex: number,
  settings: AvailabilitySettings
): string {
  const startDate = new Date(settings.startDate);
  const targetDate = new Date(startDate);
  targetDate.setDate(startDate.getDate() + dayIndex);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return `${days[targetDate.getDay()]} ${months[targetDate.getMonth()]} ${targetDate.getDate()}`;
}

// Hash function for client tokens (simple)
export function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

// Get user's timezone (for server-side defaults)
export function getDefaultTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "America/New_York"; // fallback
  }
}

// Format window description
export function formatWindowDescription(
  window: BestWindow,
  settings: AvailabilitySettings,
  contributorsCount: number
): string {
  const dayLabel = getDayLabel(window.dayIndex, settings);
  const startTime = slotIndexToTimeString(window.startSlotIndex, settings);
  const endTime = slotIndexToTimeString(window.endSlotIndex, settings);

  return `${dayLabel} ${startTime}–${endTime} (${window.availableCount}/${contributorsCount} people)`;
}
