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
  blockers: {
    displayName: "Blockers",
    createRoute: "#",
    icon: "🚧",
    description: "Identify what's blocking progress",
    metadataTitle: () => "Common – Blockers",
    metadataDescription: () => "Identify what's blocking progress.",
  },
  opinions: {
    displayName: "Opinions",
    createRoute: "#",
    icon: "💭",
    description: "Gather team opinions",
    metadataTitle: () => "Common – Opinions",
    metadataDescription: () => "Gather team opinions.",
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
      ? `Add your availability · ${boardTitle}`
      : "Add your availability";
    return {
      title,
      description: "See when everyone is free. No accounts.",
      heading: "Add your availability",
      subheading: boardTitle ? truncateTitle(boardTitle, 60) : "", // Empty if no title
      trustLine: "No accounts. Just add your availability.",
    };
  }

  // Pulse (readiness) boards
  if (toolType === "readiness") {
    const title = boardTitle
      ? `Share your pulse · ${boardTitle}`
      : "Share your pulse";
    return {
      title,
      description: "Quick group check-in on a shared scale. No accounts.",
      heading: "Share your pulse",
      subheading: boardTitle ? truncateTitle(boardTitle, 60) : "", // Empty if no title
      trustLine: "No accounts. Just share your pulse.",
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
