// POST /api/board/[slug]/vote - Vote/unvote an item

import { NextRequest, NextResponse } from "next/server";
import {
  getBoardToolBySlug,
  getBoardItems,
  getBoardVotesByParticipant,
  createBoardVote,
  deleteBoardVote,
  checkAndUpdateBoardToolRateLimit,
} from "@/lib/dynamodb";
import {
  isBoardClosed,
  generateId,
} from "@/lib/utils";
import type { BoardVote } from "@/lib/types";

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

    // Check if voting is enabled
    if (!board.votingEnabled) {
      return NextResponse.json(
        { error: "Voting is disabled for this board" },
        { status: 400 }
      );
    }

    // Rate limiting
    if (!(await checkAndUpdateBoardToolRateLimit(board.boardId, "votes", 10))) {
      return NextResponse.json(
        { error: "Too many votes. Please try again later." },
        { status: 429 }
      );
    }

    // Validate participantToken
    if (!body.participantToken || typeof body.participantToken !== "string") {
      return NextResponse.json(
        { error: "participantToken is required" },
        { status: 400 }
      );
    }

    // Validate itemId
    if (!body.itemId || typeof body.itemId !== "string") {
      return NextResponse.json(
        { error: "itemId is required" },
        { status: 400 }
      );
    }

    // Validate voteType
    if (!body.voteType || (body.voteType !== "up" && body.voteType !== "down")) {
      return NextResponse.json(
        { error: "voteType must be 'up' or 'down'" },
        { status: 400 }
      );
    }

    // Get items to validate itemId
    const items = await getBoardItems(board.boardId);
    const item = items.find((i) => i.id === body.itemId);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check if user already voted for this item
    const userVotes = await getBoardVotesByParticipant(board.boardId, body.participantToken);
    const existingVote = userVotes.find((v) => v.itemId === body.itemId);

    if (existingVote) {
      if (existingVote.voteType === body.voteType) {
        // Same vote type: remove the vote (toggle off)
        await deleteBoardVote(board.boardId, existingVote.id);
        return NextResponse.json({ success: true, voteType: null });
      } else {
        // Different vote type: update the vote
        await deleteBoardVote(board.boardId, existingVote.id);
        const createdAt = new Date().toISOString();
        const vote: BoardVote = {
          id: `${board.boardId}-${body.itemId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          boardId: board.boardId,
          itemId: body.itemId,
          participantToken: body.participantToken,
          voteType: body.voteType,
          createdAt,
        };
        await createBoardVote(vote);
        return NextResponse.json({ success: true, voteType: body.voteType });
      }
    } else {
      // No existing vote: create a new vote
      const createdAt = new Date().toISOString();
      const vote: BoardVote = {
        id: `${board.boardId}-${body.itemId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        boardId: board.boardId,
        itemId: body.itemId,
        participantToken: body.participantToken,
        voteType: body.voteType,
        createdAt,
      };
      await createBoardVote(vote);
      return NextResponse.json({ success: true, voteType: body.voteType });
    }
  } catch (error) {
    console.error("Error voting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
