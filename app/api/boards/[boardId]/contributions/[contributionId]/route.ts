// PUT /api/boards/[boardId]/contributions/[contributionId] - Update contribution

import { NextRequest, NextResponse } from "next/server";
import { getBoard, updateContribution } from "@/lib/dynamodb";
import { computeSlotCount, validateSlotIndexes } from "@/lib/utils";
import type { AvailabilitySettings } from "@/lib/types";

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

    // Validate payload for availability
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
