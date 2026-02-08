// POST /api/board - Create a new board

import { NextRequest, NextResponse } from "next/server";
import { createBoardTool, createBoardToolSlugMapping, createBoardColumn, incrementMetricsOnCreate } from "@/lib/dynamodb";
import {
  generateId,
  generateSlug,
  validateBoardTitle,
  validateBoardSettings,
  validateBoardDeadline,
  computeBoardExpiresAt,
  simpleHash,
} from "@/lib/utils";
import type { BoardTool, BoardTemplate } from "@/lib/types";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate title
    if (!validateBoardTitle(body.title)) {
      return NextResponse.json(
        { error: "Invalid title (required, max 100 chars)" },
        { status: 400 }
      );
    }

    // Validate settings
    const defaultSettings = {
      template: (body.template || "agenda") as BoardTemplate,
      votingEnabled: body.votingEnabled !== false, // default true
      closeAt: body.closeAt || undefined,
    };

    if (!validateBoardSettings(defaultSettings)) {
      return NextResponse.json(
        { error: "Invalid board settings" },
        { status: 400 }
      );
    }

    // Validate deadline if provided
    const now = new Date();
    const createdAt = now.toISOString();
    if (defaultSettings.closeAt) {
      if (!validateBoardDeadline(defaultSettings.closeAt, createdAt)) {
        return NextResponse.json(
          { error: "Deadline must be in the future and within 7 days of creation" },
          { status: 400 }
        );
      }
    }

    const boardId = generateId();
    const slug = generateSlug();
    const expiresAt = computeBoardExpiresAt(createdAt, defaultSettings.closeAt);

    // Generate editor token and hash it
    const editorToken = crypto.randomBytes(32).toString("hex");
    const editorTokenHash = simpleHash(editorToken);

    const board: BoardTool = {
      boardId,
      slug,
      title: body.title.trim(),
      template: defaultSettings.template,
      votingEnabled: defaultSettings.votingEnabled,
      status: "open",
      createdAt,
      updatedAt: createdAt,
      editorTokenHash,
      closedAt: undefined,
      closeAt: defaultSettings.closeAt,
      expiresAt,
      stats: {
        views: 0,
        items: 0,
        votes: 0,
      },
    };

    await createBoardTool(board);
    await createBoardToolSlugMapping(slug, boardId, expiresAt);

    // Increment metrics (best-effort, don't fail on error)
    incrementMetricsOnCreate("board", 0).catch((err) => {
      console.error("Error incrementing metrics:", err);
    });

    // Create columns for Retro template
    if (defaultSettings.template === "retro") {
      const columns = [
        { name: "Start", order: 0 },
        { name: "Stop", order: 1 },
        { name: "Continue", order: 2 },
      ];
      for (const col of columns) {
        await createBoardColumn({
          id: generateId(8),
          boardId,
          name: col.name,
          order: col.order,
          createdAt,
        });
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/board/${slug}`;
    const editUrl = `${baseUrl}/board/${slug}?edit=${editorToken}`;

    return NextResponse.json({
      boardId,
      slug,
      url,
      editUrl,
      editorToken, // Return token only on creation
    });
  } catch (error) {
    console.error("Error creating board:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
