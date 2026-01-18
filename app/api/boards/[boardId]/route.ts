// GET /api/boards/[boardId] - Get board data with aggregated availability

import { NextRequest, NextResponse } from "next/server";
import { getBoard, getBoardContributions, incrementBoardViews } from "@/lib/dynamodb";
import {
  computeSlotCount,
  aggregateSlotCounts,
  findBestWindows,
} from "@/lib/utils";
import type { BoardPublicData, AvailabilitySettings } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;

    const board = await getBoard(boardId);

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    const expired = now > board.expiresAtUserVisible;

    if (expired) {
      // Return minimal data for expired boards
      const response: BoardPublicData = {
        boardId: board.boardId,
        toolType: board.toolType,
        title: board.title,
        status: board.status,
        createdAt: board.createdAt,
        expiresAtUserVisible: board.expiresAtUserVisible,
        settings: board.settings,
        stats: board.stats,
        computed: {
          expired: true,
          contributorsCount: board.stats.contributions,
        },
      };

      return NextResponse.json(response);
    }

    // Increment views (best-effort)
    incrementBoardViews(boardId).catch(() => {
      // ignore errors
    });

    // Get contributions
    const contributions = await getBoardContributions(boardId);
    const contributorsCount = contributions.length;

    // Compute aggregated data for availability boards
    let slotCounts: number[] | undefined;
    let bestWindows;
    let contributors;

    if (board.toolType === "availability") {
      const slotCount = computeSlotCount(board.settings as AvailabilitySettings);
      slotCounts = aggregateSlotCounts(slotCount, contributions);
      
      if (contributorsCount > 0) {
        bestWindows = findBestWindows(
          slotCounts,
          board.settings as AvailabilitySettings
        );
        
        // Include contributor info
        contributors = contributions.map((c) => ({
          contributionId: c.contributionId,
          name: c.name || "Anonymous",
          selectedSlots: (c.payload as { selectedSlotIndexes?: number[] })?.selectedSlotIndexes,
        }));
      }
    }

    const response: BoardPublicData = {
      boardId: board.boardId,
      toolType: board.toolType,
      title: board.title,
      status: board.status,
      createdAt: board.createdAt,
      expiresAtUserVisible: board.expiresAtUserVisible,
      settings: board.settings,
      stats: board.stats,
      computed: {
        expired: false,
        contributorsCount,
        slotCounts,
        bestWindows,
        contributors,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching board:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
