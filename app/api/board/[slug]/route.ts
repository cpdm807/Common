// GET /api/board/[slug] - Get board data with aggregated results
// PATCH /api/board/[slug] - Update board (editor only)

import { NextRequest, NextResponse } from "next/server";
import {
  getBoardToolBySlug,
  getBoardColumns,
  getBoardItems,
  getBoardVotes,
  getBoardVotesByParticipant,
  incrementBoardToolViews,
  updateBoardTool,
} from "@/lib/dynamodb";
import {
  aggregateBoardVotes,
  isBoardClosed,
  computeBoardExpiresAt,
  simpleHash,
} from "@/lib/utils";
import type { BoardToolPublicData } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const participantToken = searchParams.get("participantToken") || undefined;

    const board = await getBoardToolBySlug(slug);

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    const expired = now > board.expiresAt;

    if (expired) {
      return NextResponse.json({ error: "This board has expired" }, { status: 410 }); // 410 Gone
    }

    // Increment views (best-effort)
    incrementBoardToolViews(board.boardId).catch(() => {
      // ignore errors
    });

    // Get columns, items, and votes
    const columns = await getBoardColumns(board.boardId);
    const items = await getBoardItems(board.boardId);
    const votes = await getBoardVotes(board.boardId);

    // Aggregate vote counts
    const { upvoteCounts, downvoteCounts, userVotes } = aggregateBoardVotes(items, votes);

    // Get user's votes if participantToken provided
    const userVoteMap = participantToken ? userVotes.get(participantToken) : null;

    // Check if closed
    const closed = isBoardClosed(board);

    // Sort columns by order
    const sortedColumns = columns.sort((a, b) => a.order - b.order);

    // Build items with vote counts and user vote status
    const itemsWithVotes = items.map((item) => {
      const upvoteCount = upvoteCounts.get(item.id) || 0;
      const downvoteCount = downvoteCounts.get(item.id) || 0;
      const userVote = userVoteMap?.get(item.id) || null;
      const userCanEdit = participantToken === item.createdByToken;

      return {
        id: item.id,
        columnId: item.columnId,
        text: item.text,
        details: item.details,
        tag: item.tag,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        createdByToken: item.createdByToken,
        upvoteCount,
        downvoteCount,
        userVote,
        userCanEdit,
      };
    });

    // Sort items: if voting enabled, by net votes (upvotes - downvotes) desc, then createdAt desc
    // If voting disabled, by createdAt desc
    if (board.votingEnabled) {
      itemsWithVotes.sort((a, b) => {
        const netA = a.upvoteCount - a.downvoteCount;
        const netB = b.upvoteCount - b.downvoteCount;
        if (netB !== netA) {
          return netB - netA;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      itemsWithVotes.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    const response: BoardToolPublicData = {
      boardId: board.boardId,
      slug: board.slug,
      title: board.title,
      template: board.template,
      votingEnabled: board.votingEnabled,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
      closedAt: board.closedAt,
      closeAt: board.closeAt,
      expiresAt: board.expiresAt,
      stats: {
        ...board.stats,
        items: items.length,
        votes: votes.length,
      },
      computed: {
        expired: false,
        closed,
        columns: sortedColumns,
        items: itemsWithVotes,
        totalVotes: votes.length,
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

async function verifyEditorToken(board: any, editToken: string | null): Promise<boolean> {
  if (!editToken || !board) return false;
  const tokenHash = simpleHash(editToken);
  return tokenHash === board.editorTokenHash;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const searchParams = request.nextUrl.searchParams;
    const editToken = searchParams.get("edit");

    const board = await getBoardToolBySlug(slug);

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (now > board.expiresAt) {
      return NextResponse.json({ error: "This board has expired" }, { status: 410 });
    }

    // Verify editor token
    if (!(await verifyEditorToken(board, editToken || null))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates: any = {};

    if (body.title !== undefined) {
      const { validateBoardTitle } = await import("@/lib/utils");
      if (!validateBoardTitle(body.title)) {
        return NextResponse.json(
          { error: "Invalid title" },
          { status: 400 }
        );
      }
      updates.title = body.title.trim();
    }

    if (body.votingEnabled !== undefined) {
      if (typeof body.votingEnabled !== "boolean") {
        return NextResponse.json(
          { error: "Invalid votingEnabled" },
          { status: 400 }
        );
      }
      updates.votingEnabled = body.votingEnabled;
    }

    if (body.closedAt !== undefined) {
      updates.closedAt = body.closedAt || undefined;
      if (body.closedAt) {
        // Update expiresAt when closed
        updates.expiresAt = computeBoardExpiresAt(board.createdAt, board.closeAt, body.closedAt);
      }
    }

    updates.updatedAt = new Date().toISOString();

    await updateBoardTool(board.boardId, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating board:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
