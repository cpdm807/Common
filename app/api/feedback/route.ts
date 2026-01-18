// POST /api/feedback - Submit feedback

import { NextRequest, NextResponse } from "next/server";
import { createFeedback } from "@/lib/dynamodb";
import { validateComment, simpleHash } from "@/lib/utils";
import type { Feedback, ToolType } from "@/lib/types";

// Simple in-memory rate limiting for feedback (best-effort)
const feedbackRateLimits = new Map<string, { count: number; windowStart: number }>();

function checkFeedbackRateLimit(key: string, maxPerMinute: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  const limit = feedbackRateLimits.get(key);

  if (!limit || now - limit.windowStart > 60) {
    feedbackRateLimits.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (limit.count >= maxPerMinute) {
    return false;
  }

  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate context
    if (body.context !== "global" && body.context !== "board") {
      return NextResponse.json({ error: "Invalid context" }, { status: 400 });
    }

    // Validate boardId if board context
    if (body.context === "board" && typeof body.boardId !== "string") {
      return NextResponse.json(
        { error: "boardId required for board feedback" },
        { status: 400 }
      );
    }

    // Validate sentiment
    if (body.sentiment !== "up" && body.sentiment !== "down") {
      return NextResponse.json(
        { error: "Invalid sentiment" },
        { status: 400 }
      );
    }

    // Validate comment
    if (body.comment !== undefined && !validateComment(body.comment)) {
      return NextResponse.json(
        { error: "Invalid comment (max 280 chars)" },
        { status: 400 }
      );
    }

    // Rate limiting
    const globalKey = "global";
    const boardKey = body.context === "board" ? `board:${body.boardId}` : null;

    if (!checkFeedbackRateLimit(globalKey, 5)) {
      return NextResponse.json(
        { error: "Too many feedback submissions" },
        { status: 429 }
      );
    }

    if (boardKey && !checkFeedbackRateLimit(boardKey, 5)) {
      return NextResponse.json(
        { error: "Too many feedback submissions for this board" },
        { status: 429 }
      );
    }

    // Get client token hash if provided
    let clientTokenHash: string | undefined;
    if (body.clientToken && typeof body.clientToken === "string") {
      clientTokenHash = simpleHash(body.clientToken);
    }

    const now = new Date();
    const nowEpoch = Math.floor(now.getTime() / 1000);

    const feedback: Feedback = {
      createdAt: now.toISOString(),
      context: body.context,
      boardId: body.boardId,
      toolType: body.toolType as ToolType | undefined,
      sentiment: body.sentiment,
      comment: body.comment || undefined,
      expiresAtHard: nowEpoch + 90 * 24 * 60 * 60, // 90 days
      clientTokenHash,
    };

    await createFeedback(feedback);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
