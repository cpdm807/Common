// Utility functions for validation, computation, and helpers

import type {
  AvailabilitySettings,
  BestWindow,
  ReadinessSettings,
  PollSettings,
  PollOption,
  PollVote,
  BoardSettings,
  BoardTemplate,
  BoardItem,
  BoardVote,
} from "./types";

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

export function validateReadinessSettings(
  settings: unknown
): settings is ReadinessSettings {
  if (!settings || typeof settings !== "object") return false;
  const s = settings as Record<string, unknown>;

  return (
    typeof s.prompt === "string" &&
    s.prompt.length <= 200 &&
    typeof s.leftLabel === "string" &&
    s.leftLabel.length <= 50 &&
    typeof s.rightLabel === "string" &&
    s.rightLabel.length <= 50 &&
    typeof s.scaleMin === "number" &&
    s.scaleMin >= 0 &&
    typeof s.scaleMax === "number" &&
    s.scaleMax > s.scaleMin &&
    s.scaleMax <= 1000 &&
    typeof s.step === "number" &&
    s.step > 0 &&
    s.step <= (s.scaleMax as number) - (s.scaleMin as number)
  );
}

export function validateReadinessValue(
  value: unknown,
  settings: ReadinessSettings
): boolean {
  if (typeof value !== "number") return false;
  if (!Number.isInteger(value)) return false;
  if (value < settings.scaleMin || value > settings.scaleMax) return false;
  // Round to nearest step
  const rounded = Math.round(value / settings.step) * settings.step;
  return Math.abs(value - rounded) < 0.01; // Allow small floating point errors
}

export function roundReadinessToStep(
  value: number,
  settings: ReadinessSettings
): number {
  return Math.round(value / settings.step) * settings.step;
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
  // Parse date string as YYYY-MM-DD and create date in local timezone
  // This avoids timezone issues where "2026-01-20" would be interpreted as UTC midnight
  const [year, month, day] = settings.startDate.split("-").map(Number);
  const startDate = new Date(year, month - 1, day); // month is 0-indexed
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

// Readiness aggregation functions
export function aggregateReadiness(
  contributions: Array<{ payload: { readiness?: number } }>,
  settings?: { scaleMin: number; scaleMax: number }
): {
  average: number;
  median: number;
  min: number;
  max: number;
  belowThresholdCount: number;
  distributionBuckets: Array<{ range: string; count: number }>;
  values: number[];
} {
  const scaleMin = settings?.scaleMin ?? 0;
  const scaleMax = settings?.scaleMax ?? 100;
  const readinessValues: number[] = [];

  for (const contrib of contributions) {
    const readiness = contrib.payload.readiness;
    if (
      typeof readiness === "number" &&
      readiness >= scaleMin &&
      readiness <= scaleMax
    ) {
      readinessValues.push(readiness);
    }
  }

  // Create 5 buckets based on scale range
  const range = scaleMax - scaleMin;
  const bucketSize = range / 5;
  const buckets: Array<{ range: string; count: number }> = [];
  for (let i = 0; i < 5; i++) {
    const bucketMin = Math.round(scaleMin + i * bucketSize);
    const bucketMax =
      i === 4
        ? scaleMax
        : Math.round(scaleMin + (i + 1) * bucketSize) - 1;
    buckets.push({
      range: `${bucketMin}-${bucketMax}`,
      count: 0,
    });
  }

  if (readinessValues.length === 0) {
    return {
      average: scaleMin,
      median: scaleMin,
      min: scaleMin,
      max: scaleMin,
      belowThresholdCount: 0,
      distributionBuckets: buckets,
      values: [],
    };
  }

  // Calculate statistics
  const sorted = [...readinessValues].sort((a, b) => a - b);
  const sum = readinessValues.reduce((a, b) => a + b, 0);
  const average = Math.round(sum / readinessValues.length);
  const median =
    sorted.length % 2 === 0
      ? Math.round(
          (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        )
      : sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  // Threshold is 60% of the way from min to max
  const threshold = scaleMin + (scaleMax - scaleMin) * 0.6;
  const belowThresholdCount = readinessValues.filter((v) => v < threshold).length;

  // Distribute values into buckets
  for (const value of readinessValues) {
    const normalized = (value - scaleMin) / range;
    let bucketIndex = Math.floor(normalized * 5);
    if (bucketIndex >= 5) bucketIndex = 4; // Handle edge case
    buckets[bucketIndex].count++;
  }

  return {
    average,
    median,
    min,
    max,
    belowThresholdCount,
    distributionBuckets: buckets,
    values: readinessValues,
  };
}

// Poll validation functions

export function validatePollSettings(settings: unknown): settings is PollSettings {
  if (!settings || typeof settings !== "object") return false;
  const s = settings as Record<string, unknown>;

  return (
    typeof s.participantsCanAddOptions === "boolean" &&
    (s.votingType === "single" || s.votingType === "multi") &&
    (s.resultsVisibility === "immediately" || s.resultsVisibility === "after-vote" || s.resultsVisibility === "after-close") &&
    typeof s.anonymous === "boolean" &&
    typeof s.allowChangeVote === "boolean" &&
    (s.closeAt === undefined || typeof s.closeAt === "string") &&
    (s.maxSelections === undefined || (typeof s.maxSelections === "number" && s.maxSelections > 0))
  );
}

export function validatePollQuestion(question: unknown): boolean {
  if (typeof question !== "string") return false;
  return question.trim().length > 0 && question.length <= 500;
}

export function validatePollDescription(description: unknown): boolean {
  if (description === undefined || description === null) return true;
  if (typeof description !== "string") return false;
  return description.length <= 1000;
}

export function validatePollOptionText(text: unknown): boolean {
  if (typeof text !== "string") return false;
  return text.trim().length > 0 && text.length <= 200;
}

export function validatePollDeadline(closeAt: string | undefined, createdAt: string): boolean {
  if (!closeAt) return true; // No deadline is valid
  
  const closeDate = new Date(closeAt);
  const createDate = new Date(createdAt);
  const now = new Date();
  
  // Must be in the future
  if (closeDate <= now) return false;
  
  // Must be within 7 days of creation
  const maxCloseDate = new Date(createDate);
  maxCloseDate.setDate(maxCloseDate.getDate() + 7);
  
  return closeDate <= maxCloseDate;
}

// Poll aggregation functions

export function aggregatePollResults(
  options: PollOption[],
  votes: PollVote[],
  settings: PollSettings
): {
  optionResults: Array<{
    id: string;
    text: string;
    order: number;
    isArchived: boolean;
    createdBy: "editor" | "participant";
    voteCount: number;
    percentage: number;
  }>;
  totalVotes: number;
} {
  // Filter out archived options
  const activeOptions = options.filter((opt) => !opt.isArchived);
  
  // Count votes per option
  const voteCounts = new Map<string, number>();
  for (const vote of votes) {
    const current = voteCounts.get(vote.optionId) || 0;
    voteCounts.set(vote.optionId, current + 1);
  }

  const totalVotes = votes.length;

  // Build results
  const optionResults = activeOptions
    .sort((a, b) => a.order - b.order)
    .map((option) => {
      const voteCount = voteCounts.get(option.id) || 0;
      const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

      return {
        id: option.id,
        text: option.text,
        order: option.order,
        isArchived: option.isArchived,
        createdBy: option.createdBy,
        voteCount,
        percentage,
      };
    });

  return {
    optionResults,
    totalVotes,
  };
}

export function getUserVotes(
  votes: PollVote[],
  voterKeyHash: string
): string[] {
  return votes
    .filter((vote) => vote.voterKeyHash === voterKeyHash)
    .map((vote) => vote.optionId);
}

export function hasUserVoted(
  votes: PollVote[],
  voterKeyHash: string
): boolean {
  return votes.some((vote) => vote.voterKeyHash === voterKeyHash);
}

export function computePollExpiresAt(createdAt: string, closeAt?: string): number {
  const createDate = new Date(createdAt);
  const now = Math.floor(Date.now() / 1000);

  if (closeAt) {
    const closeDate = new Date(closeAt);
    // Expire 7 days after close date
    const expireDate = new Date(closeDate);
    expireDate.setDate(expireDate.getDate() + 7);
    return Math.floor(expireDate.getTime() / 1000);
  } else {
    // Expire 7 days after creation
    const expireDate = new Date(createDate);
    expireDate.setDate(expireDate.getDate() + 7);
    return Math.floor(expireDate.getTime() / 1000);
  }
}

export function isPollClosed(poll: { closedAt?: string; closeAt?: string }): boolean {
  if (poll.closedAt) {
    return true; // Manually closed
  }

  if (poll.closeAt) {
    const closeDate = new Date(poll.closeAt);
    const now = new Date();
    return now >= closeDate; // Deadline passed
  }

  return false;
}

export function generateSlug(): string {
  // Generate a readable slug similar to boardId but more URL-friendly
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Board validation functions

export function validateBoardSettings(settings: unknown): settings is BoardSettings {
  if (!settings || typeof settings !== "object") return false;
  const s = settings as Record<string, unknown>;

  return (
    (s.template === "agenda" || s.template === "retro") &&
    typeof s.votingEnabled === "boolean" &&
    (s.closeAt === undefined || typeof s.closeAt === "string")
  );
}

export function validateBoardTitle(title: unknown): boolean {
  if (typeof title !== "string") return false;
  return title.trim().length > 0 && title.length <= 100;
}

export function validateBoardItemText(text: unknown): boolean {
  if (typeof text !== "string") return false;
  return text.trim().length > 0 && text.length <= 180;
}

export function validateBoardItemDetails(details: unknown): boolean {
  if (details === undefined || details === null) return true;
  if (typeof details !== "string") return false;
  return details.length <= 1000;
}

export function validateBoardItemTag(tag: unknown): boolean {
  if (tag === undefined || tag === null) return true;
  return tag === "Topic" || tag === "Decision" || tag === "Question" || tag === "Blocker" || tag === "Kudos";
}

export function validateBoardDeadline(closeAt: string | undefined, createdAt: string): boolean {
  if (!closeAt) return true; // No deadline is valid
  
  const closeDate = new Date(closeAt);
  const createDate = new Date(createdAt);
  const now = new Date();
  
  // Must be in the future
  if (closeDate <= now) return false;
  
  // Must be within 7 days of creation
  const maxCloseDate = new Date(createDate);
  maxCloseDate.setDate(maxCloseDate.getDate() + 7);
  
  return closeDate <= maxCloseDate;
}

// Board computation functions

export function computeBoardExpiresAt(createdAt: string, closeAt?: string, closedAt?: string): number {
  const createDate = new Date(createdAt);
  const now = Math.floor(Date.now() / 1000);

  if (closedAt) {
    // If manually closed, expire 7 days after closedAt
    const closedDate = new Date(closedAt);
    const expireDate = new Date(closedDate);
    expireDate.setDate(expireDate.getDate() + 7);
    return Math.floor(expireDate.getTime() / 1000);
  }

  if (closeAt) {
    // If has closeAt deadline, expire 7 days after closeAt
    const closeDate = new Date(closeAt);
    const expireDate = new Date(closeDate);
    expireDate.setDate(expireDate.getDate() + 7);
    return Math.floor(expireDate.getTime() / 1000);
  }

  // Otherwise, expire 7 days after creation
  const expireDate = new Date(createDate);
  expireDate.setDate(expireDate.getDate() + 7);
  return Math.floor(expireDate.getTime() / 1000);
}

export function isBoardClosed(board: { closedAt?: string; closeAt?: string }): boolean {
  if (board.closedAt) {
    return true; // Manually closed
  }

  if (board.closeAt) {
    const closeDate = new Date(board.closeAt);
    const now = new Date();
    return now >= closeDate; // Deadline passed
  }

  return false;
}

export function aggregateBoardVotes(
  items: BoardItem[],
  votes: BoardVote[]
): {
  upvoteCounts: Map<string, number>;
  downvoteCounts: Map<string, number>;
  userVotes: Map<string, Map<string, "up" | "down">>; // participantToken -> itemId -> voteType
} {
  const upvoteCounts = new Map<string, number>();
  const downvoteCounts = new Map<string, number>();
  const userVotes = new Map<string, Map<string, "up" | "down">>();

  for (const vote of votes) {
    if (vote.voteType === "up") {
      const current = upvoteCounts.get(vote.itemId) || 0;
      upvoteCounts.set(vote.itemId, current + 1);
    } else {
      const current = downvoteCounts.get(vote.itemId) || 0;
      downvoteCounts.set(vote.itemId, current + 1);
    }

    // Track user votes
    if (!userVotes.has(vote.participantToken)) {
      userVotes.set(vote.participantToken, new Map());
    }
    userVotes.get(vote.participantToken)!.set(vote.itemId, vote.voteType);
  }

  return { upvoteCounts, downvoteCounts, userVotes };
}
