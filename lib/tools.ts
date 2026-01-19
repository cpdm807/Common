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
