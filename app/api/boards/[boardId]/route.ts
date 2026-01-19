// GET /api/boards/[boardId] - Get board data with aggregated availability

import { NextRequest, NextResponse } from "next/server";
import { getBoard, getBoardContributions, incrementBoardViews } from "@/lib/dynamodb";
import {
  computeSlotCount,
  aggregateSlotCounts,
  findBestWindows,
  aggregateReadiness,
} from "@/lib/utils";
import type {
  BoardPublicData,
  AvailabilitySettings,
  ReadinessSettings,
} from "@/lib/types";

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

    // Compute aggregated data based on tool type
    let slotCounts: number[] | undefined;
    let bestWindows;
    let contributors;
    let averageReadiness: number | undefined;
    let medianReadiness: number | undefined;
    let minReadiness: number | undefined;
    let maxReadiness: number | undefined;
    let belowThresholdCount: number | undefined;
    let distributionBuckets: Array<{ range: string; count: number }> | undefined;
    let readinessContributors:
      | Array<{ contributionId: string; name?: string; readiness: number }>
      | undefined;

    if (board.toolType === "availability") {
      const slotCount = computeSlotCount(board.settings as AvailabilitySettings);
      // Type-narrow contributions for availability boards
      const availabilityContributions = contributions.map((c) => ({
        payload: c.payload as { selectedSlotIndexes?: number[] },
      }));
      slotCounts = aggregateSlotCounts(slotCount, availabilityContributions);

      if (contributorsCount > 0) {
        bestWindows = findBestWindows(
          slotCounts,
          board.settings as AvailabilitySettings
        );

        // Include contributor info
        contributors = contributions.map((c) => ({
          contributionId: c.contributionId,
          name: c.name || "Anonymous",
          selectedSlots: (c.payload as { selectedSlotIndexes?: number[] })
            ?.selectedSlotIndexes,
        }));
      }
    } else if (board.toolType === "readiness") {
      if (contributorsCount > 0) {
        const readinessSettings = board.settings as ReadinessSettings;
        // Type-narrow contributions for readiness boards
        const readinessContributions = contributions.map((c) => ({
          payload: c.payload as { readiness?: number },
        }));
        const aggregated = aggregateReadiness(readinessContributions, {
          scaleMin: readinessSettings.scaleMin,
          scaleMax: readinessSettings.scaleMax,
        });
        averageReadiness = aggregated.average;
        medianReadiness = aggregated.median;
        minReadiness = aggregated.min;
        maxReadiness = aggregated.max;
        belowThresholdCount = aggregated.belowThresholdCount;
        distributionBuckets = aggregated.distributionBuckets;

        // Include contributor info
        readinessContributors = contributions.map((c) => ({
          contributionId: c.contributionId,
          name: c.name,
          readiness: (c.payload as { readiness?: number })?.readiness || 0,
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
        averageReadiness,
        medianReadiness,
        minReadiness,
        maxReadiness,
        belowThresholdCount,
        distributionBuckets,
        readinessContributors,
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
