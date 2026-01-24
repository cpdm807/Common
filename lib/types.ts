// Type definitions for Common

export type ToolType = "availability" | "readiness" | "poll" | "opinions";

export type BoardStatus = "open" | "closed";

export interface AvailabilitySettings {
  tz: string; // IANA timezone or offset label
  startDate: string; // ISO date string
  days: number;
  dayStart: number; // hour 0-23
  dayEnd: number; // hour 0-23
  slotMinutes: number;
}

export interface Board {
  boardId: string;
  toolType: ToolType;
  title?: string;
  status: BoardStatus;
  createdAt: string; // ISO string
  expiresAtUserVisible: number; // epoch seconds
  expiresAtHard: number; // epoch seconds (TTL)
  settings: AvailabilitySettings | ReadinessSettings | Record<string, unknown>; // extensible
  stats: {
    views: number;
    contributions: number;
  };
  rateLimit?: {
    contributions?: {
      count: number;
      windowStart: number;
    };
  };
}

export interface Contribution {
  contributionId: string;
  createdAt: string;
  name?: string;
  payloadVersion: number;
  payload: AvailabilityPayload | ReadinessPayload | Record<string, unknown>; // extensible
}

export interface AvailabilityPayload {
  selectedSlotIndexes: number[];
}

export interface ReadinessSettings {
  prompt: string;
  leftLabel: string;
  rightLabel: string;
  scaleMin: number;
  scaleMax: number;
  step: number;
}

export interface ReadinessPayload {
  readiness: number; // integer 0..100
}

// Poll types
export interface PollSettings {
  participantsCanAddOptions: boolean;
  votingType: "single" | "multi";
  resultsVisibility: "immediately" | "after-vote" | "after-close";
  anonymous: boolean;
  allowChangeVote: boolean;
  closeAt?: string; // ISO string, optional deadline
  maxSelections?: number; // For multi-choice polls
}

export interface PollOption {
  id: string;
  pollId: string;
  text: string;
  order: number;
  isArchived: boolean;
  createdAt: string; // ISO string
  createdBy: "editor" | "participant";
}

export interface PollVote {
  id: string;
  pollId: string;
  optionId: string;
  voterKeyHash: string;
  voterName?: string;
  createdAt: string; // ISO string
}

export interface Poll {
  pollId: string;
  slug: string;
  question: string;
  description?: string;
  settings: PollSettings;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  editorTokenHash: string;
  closedAt?: string; // ISO string, nullable
  closeAt?: string; // ISO string, nullable deadline
  expiresAt: number; // epoch seconds (TTL)
  stats: {
    views: number;
    votes: number;
  };
  rateLimit?: {
    votes?: {
      count: number;
      windowStart: number;
    };
  };
}

export interface PollPublicData {
  pollId: string;
  slug: string;
  question: string;
  description?: string;
  settings: PollSettings;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  closeAt?: string;
  expiresAt: number;
  stats: {
    views: number;
    votes: number;
  };
  computed: {
    expired: boolean;
    closed: boolean;
    options: Array<{
      id: string;
      text: string;
      order: number;
      isArchived: boolean;
      createdBy: "editor" | "participant";
      voteCount: number;
      percentage: number;
    }>;
    totalVotes: number;
    userVoted: boolean;
    userVotes?: string[]; // optionIds the user voted for
    resultsVisible: boolean;
  };
}

export interface Feedback {
  createdAt: string;
  context: "global" | "board";
  boardId?: string;
  toolType?: ToolType;
  sentiment: "up" | "down";
  comment?: string;
  expiresAtHard: number; // epoch seconds (TTL)
  clientTokenHash?: string;
}

export interface BestWindow {
  dayIndex: number;
  startSlotIndex: number;
  endSlotIndex: number;
  availableCount: number;
  windowLength: number;
}

export interface BoardPublicData {
  boardId: string;
  toolType: ToolType;
  title?: string;
  status: BoardStatus;
  createdAt: string;
  expiresAtUserVisible: number;
  settings: AvailabilitySettings | ReadinessSettings | Record<string, unknown>;
  stats: {
    views: number;
    contributions: number;
  };
  computed: {
    expired: boolean;
    contributorsCount: number;
    // Availability-specific
    slotCounts?: number[];
    bestWindows?: BestWindow[];
    contributors?: Array<{
      contributionId: string;
      name?: string;
      selectedSlots?: number[];
    }>;
    // Readiness-specific
    averageReadiness?: number;
    medianReadiness?: number;
    minReadiness?: number;
    maxReadiness?: number;
    belowThresholdCount?: number;
    distributionBuckets?: Array<{ range: string; count: number }>;
    readinessContributors?: Array<{
      contributionId: string;
      name?: string;
      readiness: number;
    }>;
  };
}
