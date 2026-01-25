// PUT /api/board/[slug]/items/[itemId] - Update an item
// DELETE /api/board/[slug]/items/[itemId] - Delete an item

import { NextRequest, NextResponse } from "next/server";
import {
  getBoardToolBySlug,
  getBoardItems,
  updateBoardItem,
  deleteBoardItem,
  getBoardVotes,
} from "@/lib/dynamodb";
import type { BoardItem } from "@/lib/types";
import {
  validateBoardItemText,
  validateBoardItemDetails,
  validateBoardItemTag,
  isBoardClosed,
} from "@/lib/utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; itemId: string }> }
) {
  try {
    const { slug, itemId } = await params;
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

    // Get item
    const items = await getBoardItems(board.boardId);
    const item = items.find((i) => i.id === itemId);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Verify createdByToken
    if (!body.createdByToken || body.createdByToken !== item.createdByToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate updates
    const updates: Partial<BoardItem> = {};

    if (body.text !== undefined) {
      if (!validateBoardItemText(body.text)) {
        return NextResponse.json(
          { error: "Invalid item text (required, max 180 chars)" },
          { status: 400 }
        );
      }
      updates.text = body.text.trim();
    }

    if (body.details !== undefined) {
      if (!validateBoardItemDetails(body.details)) {
        return NextResponse.json(
          { error: "Invalid item details (max 1000 chars)" },
          { status: 400 }
        );
      }
      updates.details = body.details?.trim() || undefined;
    }

    if (body.tag !== undefined) {
      if (!validateBoardItemTag(body.tag)) {
        return NextResponse.json(
          { error: "Invalid tag" },
          { status: 400 }
        );
      }
      updates.tag = body.tag || undefined;
    }

    updates.updatedAt = new Date().toISOString();

    await updateBoardItem(board.boardId, itemId, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; itemId: string }> }
) {
  try {
    const { slug, itemId } = await params;
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

    // Get item
    const items = await getBoardItems(board.boardId);
    const item = items.find((i) => i.id === itemId);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Verify createdByToken
    if (!body.createdByToken || body.createdByToken !== item.createdByToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all votes for this item
    const votes = await getBoardVotes(board.boardId);
    const itemVotes = votes.filter((v) => v.itemId === itemId);
    const { deleteBoardVote } = await import("@/lib/dynamodb");
    for (const vote of itemVotes) {
      try {
        await deleteBoardVote(board.boardId, vote.id);
      } catch (error) {
        // Best-effort, continue even if vote deletion fails
        console.error("Error deleting vote:", error);
      }
    }

    await deleteBoardItem(board.boardId, itemId);

    // Decrement items count (best-effort)
    try {
      const { decrementBoardToolItems } = await import("@/lib/dynamodb");
      await decrementBoardToolItems(board.boardId);
    } catch (error) {
      // Best-effort, don't fail if update fails
      console.error("Error decrementing items count:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
