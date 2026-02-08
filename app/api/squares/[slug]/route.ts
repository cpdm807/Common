// GET /api/squares/[slug] - Get squares board data
// PATCH /api/squares/[slug] - Update board (claim squares, host edits, reveal numbers)

import { NextRequest, NextResponse } from "next/server";
import {
  getSquaresToolBySlug,
  updateSquaresTool,
  incrementSquaresToolViews,
} from "@/lib/dynamodb";
import { simpleHash, fisherYatesShuffle } from "@/lib/utils";
import type { SquaresToolPublicData } from "@/lib/types";

function buildPublicData(squares: Awaited<ReturnType<typeof getSquaresToolBySlug>>): SquaresToolPublicData | null {
  if (!squares) return null;

  const filledCount = (squares.squares || []).filter((s): s is string => s != null && s !== "").length;

  return {
    squaresId: squares.squaresId,
    slug: squares.slug,
    title: squares.title,
    squares: squares.squares || Array(100).fill(null),
    rulesText: squares.rulesText || "Each quarter is 1/5 the pot. Final score is 2/5 the pot",
    rowsTeam: squares.rowsTeam || "Patriots",
    colsTeam: squares.colsTeam || "Seahawks",
    numbersRevealed: squares.numbersRevealed || false,
    rowDigits: squares.rowDigits || null,
    colDigits: squares.colDigits || null,
    createdAt: squares.createdAt,
    updatedAt: squares.updatedAt,
    expiresAt: squares.expiresAt,
    stats: squares.stats || { views: 0 },
    computed: {
      expired: false,
      filledCount,
      totalCount: 100,
    },
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const squares = await getSquaresToolBySlug(slug);

    if (!squares) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const now = Math.floor(Date.now() / 1000);
    const expired = now > squares.expiresAt;

    if (expired) {
      return NextResponse.json({ error: "This board has expired" }, { status: 410 });
    }

    incrementSquaresToolViews(squares.squaresId).catch(() => {});

    const response = buildPublicData(squares);
    if (!response) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }
    response.computed.expired = expired;

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching squares board:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function verifyEditorToken(squares: Awaited<ReturnType<typeof getSquaresToolBySlug>>, editToken: string | null): Promise<boolean> {
  if (!editToken || !squares) return false;
  const tokenHash = simpleHash(editToken);
  return tokenHash === squares.editorTokenHash;
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

    const squares = await getSquaresToolBySlug(slug);

    if (!squares) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > squares.expiresAt) {
      return NextResponse.json({ error: "This board has expired" }, { status: 410 });
    }

    const isEditor = await verifyEditorToken(squares, editToken || null);

    // Determine action from body
    const action = body.action as string | undefined;

    if (action === "claim") {
      // Anyone can claim squares - no editor token required
      const { indexes, name } = body;
      if (!Array.isArray(indexes) || typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { error: "Invalid claim: indexes (array) and name (string) required" },
          { status: 400 }
        );
      }

      const currentSquares = [...(squares.squares || Array(100).fill(null))];
      const takenBy: Record<number, string> = {};
      for (const idx of indexes) {
        const i = parseInt(String(idx), 10);
        if (isNaN(i) || i < 0 || i >= 100) {
          return NextResponse.json({ error: "Invalid square index" }, { status: 400 });
        }
        if (currentSquares[i] != null && currentSquares[i] !== "") {
          takenBy[i] = currentSquares[i] as string;
        }
      }

      const takenEntries = Object.entries(takenBy);
      if (takenEntries.length > 0) {
        const msg = takenEntries
          .map(([idx, n]) => `Square ${idx}: taken by ${n}`)
          .join("; ");
        return NextResponse.json(
          { error: "Some squares are already taken", taken: takenBy, details: msg },
          { status: 409 }
        );
      }

      for (const idx of indexes) {
        const i = parseInt(String(idx), 10);
        if (i >= 0 && i < 100) {
          currentSquares[i] = name.trim();
        }
      }

      await updateSquaresTool(squares.squaresId, {
        squares: currentSquares,
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({ success: true });
    }

    if (action === "revealNumbers") {
      if (!isEditor) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (squares.numbersRevealed) {
        return NextResponse.json({ error: "Numbers already revealed" }, { status: 400 });
      }

      const currentSquares = squares.squares || Array(100).fill(null);
      const filledCount = currentSquares.filter((s): s is string => s != null && s !== "").length;
      if (filledCount < 100) {
        return NextResponse.json(
          { error: "Board must be full (100/100) before revealing numbers" },
          { status: 400 }
        );
      }

      const rowDigits = fisherYatesShuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      const colDigits = fisherYatesShuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

      await updateSquaresTool(squares.squaresId, {
        numbersRevealed: true,
        rowDigits,
        colDigits,
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({ success: true });
    }

    if (action === "clearSquare") {
      if (!isEditor) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const index = body.index;
      const i = parseInt(String(index), 10);
      if (isNaN(i) || i < 0 || i >= 100) {
        return NextResponse.json({ error: "Invalid square index" }, { status: 400 });
      }

      const currentSquares = [...(squares.squares || Array(100).fill(null))];
      currentSquares[i] = null;

      await updateSquaresTool(squares.squaresId, {
        squares: currentSquares,
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({ success: true });
    }

    // Host edits: title, rowsTeam, colsTeam, rulesText
    if (!isEditor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates: Partial<typeof squares> = { updatedAt: new Date().toISOString() };

    if (body.title !== undefined) {
      const { validateSquaresTitle } = await import("@/lib/utils");
      if (!validateSquaresTitle(body.title)) {
        return NextResponse.json({ error: "Invalid title" }, { status: 400 });
      }
      updates.title = body.title?.trim() || undefined;
    }
    if (body.rowsTeam !== undefined && typeof body.rowsTeam === "string") {
      updates.rowsTeam = body.rowsTeam.trim() || "Patriots";
    }
    if (body.colsTeam !== undefined && typeof body.colsTeam === "string") {
      updates.colsTeam = body.colsTeam.trim() || "Seahawks";
    }
    if (body.rulesText !== undefined && typeof body.rulesText === "string") {
      updates.rulesText = body.rulesText.trim() || "Each quarter is 1/5 the pot. Final score is 2/5 the pot";
    }

    if (Object.keys(updates).length <= 1) {
      return NextResponse.json({ success: true });
    }

    await updateSquaresTool(squares.squaresId, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating squares board:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
