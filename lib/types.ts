// Type definitions for Common

export type ToolType = "availability" | "readiness" | "poll" | "board" | "squares";

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

// Board tool types
export type BoardTemplate = "agenda" | "retro";
export type BoardItemTag = "Topic" | "Decision" | "Question" | "Blocker" | "Kudos";

export interface BoardSettings {
  template: BoardTemplate;
  votingEnabled: boolean;
  closeAt?: string; // ISO string, optional deadline
}

export interface BoardColumn {
  id: string;
  boardId: string;
  name: string;
  order: number;
  createdAt: string; // ISO string
}

export interface BoardItem {
  id: string;
  boardId: string;
  columnId?: string; // Optional, only for Retro template
  text: string; // required, max 180 chars
  details?: string; // optional, max 1000 chars
  tag?: BoardItemTag; // optional
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  createdByToken: string; // client-side token for edit/delete permissions
}

export interface BoardVote {
  id: string;
  boardId: string;
  itemId: string;
  participantToken: string; // client-side token for vote uniqueness
  voteType: "up" | "down"; // upvote or downvote
  createdAt: string; // ISO string
}

export interface BoardTool {
  boardId: string;
  slug: string;
  title: string; // required
  template: BoardTemplate;
  votingEnabled: boolean;
  status: BoardStatus;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  editorTokenHash: string;
  closedAt?: string; // ISO string, nullable
  closeAt?: string; // ISO string, nullable deadline
  expiresAt: number; // epoch seconds (TTL)
  stats: {
    views: number;
    items: number;
    votes: number;
  };
  rateLimit?: {
    items?: {
      count: number;
      windowStart: number;
    };
    votes?: {
      count: number;
      windowStart: number;
    };
  };
}

export interface BoardToolPublicData {
  boardId: string;
  slug: string;
  title: string;
  template: BoardTemplate;
  votingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  closeAt?: string;
  expiresAt: number;
  stats: {
    views: number;
    items: number;
    votes: number;
  };
  computed: {
    expired: boolean;
    closed: boolean;
    columns: Array<{
      id: string;
      name: string;
      order: number;
    }>;
    items: Array<{
      id: string;
      columnId?: string;
      text: string;
      details?: string;
      tag?: BoardItemTag;
      createdAt: string;
      updatedAt: string;
      createdByToken: string;
      upvoteCount: number;
      downvoteCount: number;
      userVote: "up" | "down" | null; // user's current vote, if any
      userCanEdit: boolean;
    }>;
    totalVotes: number;
  };
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

// Football Squares types

export interface SquaresTool {
  squaresId: string;
  slug: string;
  title?: string;
  squares: (string | null)[]; // 100 elements, row-major [0..9][0..9]
  rulesText: string;
  rowsTeam: string;
  colsTeam: string;
  numbersRevealed: boolean;
  rowDigits: number[] | null; // length 10, permutation of 0..9
  colDigits: number[] | null; // length 10, permutation of 0..9
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  editorTokenHash: string;
  expiresAt: number; // epoch seconds (TTL)
  stats: {
    views: number;
  };
}

export interface SquaresToolPublicData {
  squaresId: string;
  slug: string;
  title?: string;
  squares: (string | null)[];
  rulesText: string;
  rowsTeam: string;
  colsTeam: string;
  numbersRevealed: boolean;
  rowDigits: number[] | null;
  colDigits: number[] | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: number;
  stats: {
    views: number;
  };
  computed: {
    expired: boolean;
    filledCount: number;
    totalCount: number;
  };
}

// Metrics aggregation types
export interface MetricsAggregation {
  totals: {
    totalBoards: number;
    totalContributions: number;
    totalViews: number;
    positiveFeedback: number;
    negativeFeedback: number;
  };
  byTool: Record<string, {
    toolType: string;
    boardsCreated: number;
    totalContributions: number;
    totalViews: number;
  }>;
  lastUpdated: string; // ISO string
}
