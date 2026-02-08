// POST /api/squares - Create a new football squares board

import { NextRequest, NextResponse } from "next/server";
import { createSquaresTool, createSquaresToolSlugMapping, incrementMetricsOnCreate } from "@/lib/dynamodb";
import {
  generateId,
  generateSlug,
  validateSquaresTitle,
  computeSquaresExpiresAt,
  simpleHash,
} from "@/lib/utils";
import type { SquaresTool } from "@/lib/types";
import crypto from "crypto";

const DEFAULT_RULES = "Each quarter is 1/5 the pot. Final score is 2/5 the pot";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate title (optional)
    if (body.title !== undefined && body.title !== null && body.title !== "") {
      if (!validateSquaresTitle(body.title)) {
        return NextResponse.json(
          { error: "Invalid title (max 100 chars)" },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const squaresId = generateId();
    const slug = generateSlug();
    const createdAt = now.toISOString();
    const expiresAt = computeSquaresExpiresAt(createdAt);

    const editorToken = crypto.randomBytes(32).toString("hex");
    const editorTokenHash = simpleHash(editorToken);

    const squares: SquaresTool = {
      squaresId,
      slug,
      title: body.title?.trim() || undefined,
      squares: Array(100).fill(null),
      rulesText: body.rulesText?.trim() || DEFAULT_RULES,
      rowsTeam: body.rowsTeam?.trim() || "Patriots",
      colsTeam: body.colsTeam?.trim() || "Seahawks",
      numbersRevealed: false,
      rowDigits: null,
      colDigits: null,
      createdAt,
      updatedAt: createdAt,
      editorTokenHash,
      expiresAt,
      stats: {
        views: 0,
      },
    };

    await createSquaresTool(squares);
    await createSquaresToolSlugMapping(slug, squaresId, expiresAt);

    incrementMetricsOnCreate("squares", 0).catch((err) => {
      console.error("Error incrementing metrics:", err);
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/squares/${slug}`;
    const editUrl = `${baseUrl}/squares/${slug}?edit=${editorToken}`;

    return NextResponse.json({
      squaresId,
      slug,
      url,
      editUrl,
      editorToken,
    });
  } catch (error) {
    console.error("Error creating squares board:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
