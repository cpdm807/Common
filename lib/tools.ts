// Tool registry for extensible tool configuration

import type { ToolType } from "./types";

export interface ToolConfig {
  displayName: string;
  createRoute: string;
  icon: string;
  description: string;
  metadataTitle: (title?: string) => string;
  metadataDescription: (title?: string) => string;
}

export const toolRegistry: Record<ToolType, ToolConfig> = {
  availability: {
    displayName: "Availability",
    createRoute: "/tools/availability/create",
    icon: "📅",
    description: "Find the best time to meet",
    metadataTitle: (title?: string) =>
      title ? `Common – ${title}` : "Common – Availability",
    metadataDescription: (title?: string) =>
      title
        ? `${title}: Find the common time. Add your availability.`
        : "Find the common time. Add your availability.",
  },
  readiness: {
    displayName: "Pulse",
    createRoute: "/tools/readiness",
    icon: "🟢",
    description: "Quick group check-ins on a shared scale",
    metadataTitle: (title?: string) =>
      title ? `Common – ${title}` : "Common – Pulse",
    metadataDescription: (title?: string) =>
      title
        ? `${title}: Quick group check-ins on a shared scale.`
        : "Quick group check-ins on a shared scale.",
  },
  poll: {
    displayName: "Poll",
    createRoute: "/tools/poll/create",
    icon: "📊",
    description: "Create a shareable poll via a single link",
    metadataTitle: (title?: string) =>
      title ? `Common – ${title}` : "Common – Poll",
    metadataDescription: (title?: string) =>
      title
        ? `${title}: Vote and see results.`
        : "Vote and see results.",
  },
  board: {
    displayName: "Board",
    createRoute: "/tools/board/create",
    icon: "📋",
    description: "Shared items with lightweight voting, for agendas and retros.",
    metadataTitle: (title?: string) =>
      title ? `Common – ${title}` : "Common – Board",
    metadataDescription: (title?: string) =>
      title
        ? `${title}: Shared items with lightweight voting, for agendas and retros.`
        : "Shared items with lightweight voting, for agendas and retros.",
  },
  squares: {
    displayName: "Football Squares",
    createRoute: "/tools/squares/create",
    icon: "🏈",
    description: "10x10 football squares contest. Claim squares, reveal numbers when full.",
    metadataTitle: (title?: string) =>
      title ? `Common – ${title}` : "Common – Football Squares",
    metadataDescription: (title?: string) =>
      title
        ? `${title}: Claim your squares. Numbers revealed when board is full.`
        : "10x10 football squares contest. Claim squares, reveal numbers when full.",
  },
};

export function getToolConfig(toolType: ToolType): ToolConfig {
  return toolRegistry[toolType];
}

// Helper function for board share metadata (Open Graph, Twitter Cards, OG Images)
export interface BoardShareMeta {
  title: string;
  description: string;
}

export interface BoardShareCopy {
  title: string;
  description: string;
  heading: string; // For OG image heading
  subheading: string; // For OG image subheading (empty string if should be omitted)
  trustLine: string; // For OG image footer trust line
}

// Shared helper for board share copy used by both metadata and OG images
export function getBoardShareCopy(
  toolType: ToolType,
  boardTitle?: string,
  expired?: boolean
): BoardShareCopy {
  // Handle expired or unavailable boards
  if (expired) {
    return {
      title: "Common",
      description: "This board is unavailable.",
      heading: "Board unavailable",
      subheading: "", // No subheading for expired boards
      trustLine: "", // No trust line for expired boards
    };
  }

  // Availability boards
  if (toolType === "availability") {
    const title = boardTitle
      ? `Add Your Availability - ${boardTitle}`
      : "Add Your Availability";
    return {
      title,
      description: "See when everyone is free. No accounts.",
      heading: "Add Your Availability",
      subheading: boardTitle ? truncateTitle(boardTitle, 60) : "", // Empty if no title
      trustLine: "No accounts. Just add your availability.",
    };
  }

  // Pulse (readiness) boards
  if (toolType === "readiness") {
    const title = boardTitle
      ? `Add Your Pulse - ${boardTitle}`
      : "Add Your Pulse";
    return {
      title,
      description: "Quick group check-in on a shared scale. No accounts.",
      heading: "Add Your Pulse",
      subheading: boardTitle ? truncateTitle(boardTitle, 60) : "", // Empty if no title
      trustLine: "No accounts. Just share your pulse.",
    };
  }

  // Poll
  if (toolType === "poll") {
    const title = boardTitle
      ? `Cast Your Vote - ${boardTitle}`
      : "Cast Your Vote";
    return {
      title,
      description: "Vote and see results. No accounts.",
      heading: "Cast Your Vote",
      subheading: boardTitle ? truncateTitle(boardTitle, 60) : "", // Empty if no title
      trustLine: "No accounts. Just vote.",
    };
  }

  // Football Squares
  if (toolType === "squares") {
    const title = boardTitle
      ? `Claim Your Square - ${boardTitle}`
      : "Claim Your Square";
    return {
      title,
      description: "10x10 football squares. Claim your squares. No accounts.",
      heading: "Claim Your Square",
      subheading: boardTitle ? truncateTitle(boardTitle, 60) : "",
      trustLine: "No accounts. Just claim your squares.",
    };
  }

  // Board
  if (toolType === "board") {
    const title = boardTitle
      ? `Add to Board - ${boardTitle}`
      : "Add to Board";
    return {
      title,
      description: "Shared items with lightweight voting, for agendas and retros. No accounts.",
      heading: "Add to Board",
      subheading: boardTitle ? truncateTitle(boardTitle, 60) : "", // Empty if no title
      trustLine: "No accounts. Just add items and vote.",
    };
  }

  // Fallback for other tool types
  return {
    title: boardTitle ? `Common · ${boardTitle}` : "Common",
    description: "Lightweight tools to help groups align without meetings, accounts, or noise.",
    heading: "Common",
    subheading: boardTitle ? truncateTitle(boardTitle, 60) : "",
    trustLine: "No accounts. Just get started.",
  };
}

// Helper function for board share metadata (Open Graph, Twitter Cards)
export function getBoardShareMeta(
  toolType: ToolType,
  boardTitle?: string,
  expired?: boolean
): BoardShareMeta {
  const copy = getBoardShareCopy(toolType, boardTitle, expired);
  return {
    title: copy.title,
    description: copy.description,
  };
}

// Helper to truncate board titles for display
function truncateTitle(title: string, maxLength: number): string {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + "...";
}
