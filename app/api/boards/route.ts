// POST /api/boards - Create a new board

import { NextRequest, NextResponse } from "next/server";
import { createBoard } from "@/lib/dynamodb";
import {
  generateId,
  validateAvailabilitySettings,
  computeSlotCount,
} from "@/lib/utils";
import type { Board, ToolType } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate tool type
    if (body.toolType !== "availability") {
      return NextResponse.json(
        { error: "Only 'availability' tool is supported in v1" },
        { status: 400 }
      );
    }

    // Validate settings
    if (!validateAvailabilitySettings(body.settings)) {
      return NextResponse.json(
        { error: "Invalid availability settings" },
        { status: 400 }
      );
    }

    // Validate slot count
    const slotCount = computeSlotCount(body.settings);
    if (slotCount > 1000) {
      return NextResponse.json(
        { error: "Too many slots (max 1000)" },
        { status: 400 }
      );
    }

    // Validate title
    if (body.title && typeof body.title !== "string") {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }
    if (body.title && body.title.length > 100) {
      return NextResponse.json(
        { error: "Title too long (max 100 chars)" },
        { status: 400 }
      );
    }

    const boardId = generateId();
    const now = new Date();
    const nowEpoch = Math.floor(now.getTime() / 1000);

    const board: Board = {
      boardId,
      toolType: body.toolType as ToolType,
      title: body.title || undefined,
      status: "open",
      createdAt: now.toISOString(),
      expiresAtUserVisible: nowEpoch + 7 * 24 * 60 * 60, // 7 days
      expiresAtHard: nowEpoch + 14 * 24 * 60 * 60, // 14 days
      settings: body.settings,
      stats: {
        views: 0,
        contributions: 0,
      },
    };

    await createBoard(board);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/b/${boardId}`;
    const previewUrl = `${baseUrl}/m/board/${boardId}`;

    return NextResponse.json({
      boardId,
      url,
      previewUrl,
    });
  } catch (error) {
    console.error("Error creating board:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
