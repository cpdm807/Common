// PUT /api/boards/[boardId]/contributions/[contributionId] - Update contribution

import { NextRequest, NextResponse } from "next/server";
import { getBoard, updateContribution } from "@/lib/dynamodb";
import {
  computeSlotCount,
  validateSlotIndexes,
  validateReadinessValue,
  roundReadinessToStep,
} from "@/lib/utils";
import type {
  AvailabilitySettings,
  ReadinessSettings,
} from "@/lib/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; contributionId: string }> }
) {
  try {
    const { boardId, contributionId } = await params;
    const body = await request.json();

    // Get board
    const board = await getBoard(boardId);

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Check if expired or closed
    const now = Math.floor(Date.now() / 1000);
    if (now > board.expiresAtUserVisible) {
      return NextResponse.json(
        { error: "Board has expired" },
        { status: 403 }
      );
    }

    if (board.status === "closed") {
      return NextResponse.json({ error: "Board is closed" }, { status: 403 });
    }

    // Validate payload based on tool type
    if (board.toolType === "availability") {
      const slotCount = computeSlotCount(board.settings as AvailabilitySettings);

      if (
        !body.payload ||
        !Array.isArray(body.payload.selectedSlotIndexes) ||
        !validateSlotIndexes(body.payload.selectedSlotIndexes, slotCount)
      ) {
        return NextResponse.json(
          { error: "Invalid slot indexes" },
          { status: 400 }
        );
      }
    } else if (board.toolType === "readiness") {
      const settings = board.settings as ReadinessSettings;
      if (
        !body.payload ||
        typeof body.payload.readiness !== "number"
      ) {
        return NextResponse.json(
          { error: "Invalid readiness value" },
          { status: 400 }
        );
      }

      // Round to nearest step if needed, then validate
      const rounded = roundReadinessToStep(body.payload.readiness, settings);
      if (!validateReadinessValue(rounded, settings)) {
        return NextResponse.json(
          { error: "Readiness value must be between 0 and 100 and align with step size" },
          { status: 400 }
        );
      }

      // Use rounded value
      body.payload.readiness = rounded;
    }

    // Validate name
    if (body.name !== undefined && typeof body.name !== "string") {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    if (body.name && body.name.length > 50) {
      return NextResponse.json(
        { error: "Name too long (max 50 chars)" },
        { status: 400 }
      );
    }

    // Update the contribution
    await updateContribution(
      boardId,
      contributionId,
      body.name,
      body.payload
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error updating contribution:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
