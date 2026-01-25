// POST /api/board/[slug]/items - Add an item

import { NextRequest, NextResponse } from "next/server";
import {
  getBoardToolBySlug,
  getBoardColumns,
  createBoardItem,
  checkAndUpdateBoardToolRateLimit,
  updateBoardTool,
} from "@/lib/dynamodb";
import {
  validateBoardItemText,
  validateBoardItemDetails,
  validateBoardItemTag,
  isBoardClosed,
  generateId,
} from "@/lib/utils";
import type { BoardItem, BoardTool } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const board = await getBoardToolBySlug(slug);

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (now > board.expiresAt) {
      return NextResponse.json({ error: "This board has expired" }, { status: 410 });
    }

    // Check if closed
    if (isBoardClosed(board)) {
      return NextResponse.json({ error: "Board is closed" }, { status: 400 });
    }

    // Rate limiting
    if (!(await checkAndUpdateBoardToolRateLimit(board.boardId, "items", 10))) {
      return NextResponse.json(
        { error: "Too many items. Please try again later." },
        { status: 429 }
      );
    }

    // Validate item text
    if (!validateBoardItemText(body.text)) {
      return NextResponse.json(
        { error: "Invalid item text (required, max 180 chars)" },
        { status: 400 }
      );
    }

    // Validate details
    if (!validateBoardItemDetails(body.details)) {
      return NextResponse.json(
        { error: "Invalid item details (max 1000 chars)" },
        { status: 400 }
      );
    }

    // Validate tag
    if (!validateBoardItemTag(body.tag)) {
      return NextResponse.json(
        { error: "Invalid tag" },
        { status: 400 }
      );
    }

    // Validate columnId for Retro template
    let columnId: string | undefined = undefined;
    if (board.template === "retro") {
      if (!body.columnId || typeof body.columnId !== "string") {
        return NextResponse.json(
          { error: "columnId is required for Retro template" },
          { status: 400 }
        );
      }
      // Verify column exists
      const columns = await getBoardColumns(board.boardId);
      const column = columns.find((c) => c.id === body.columnId);
      if (!column) {
        return NextResponse.json(
          { error: "Invalid columnId" },
          { status: 400 }
        );
      }
      columnId = body.columnId;
    }

    // Validate createdByToken
    if (!body.createdByToken || typeof body.createdByToken !== "string") {
      return NextResponse.json(
        { error: "createdByToken is required" },
        { status: 400 }
      );
    }

    const createdAt = new Date().toISOString();
    const item: BoardItem = {
      id: generateId(8),
      boardId: board.boardId,
      columnId,
      text: body.text.trim(),
      details: body.details?.trim() || undefined,
      tag: body.tag || undefined,
      createdAt,
      updatedAt: createdAt,
      createdByToken: body.createdByToken,
    };

    await createBoardItem(item);

    // Increment items count (best-effort)
    try {
      const { incrementBoardToolItems } = await import("@/lib/dynamodb");
      await incrementBoardToolItems(board.boardId);
    } catch (error) {
      // Best-effort, don't fail if update fails
      console.error("Error incrementing items count:", error);
    }

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("Error adding item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
