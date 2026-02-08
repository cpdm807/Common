// POST /api/polls - Create a new poll

import { NextRequest, NextResponse } from "next/server";
import { createPoll, createPollSlugMapping, incrementMetricsOnCreate } from "@/lib/dynamodb";
import {
  generateId,
  generateSlug,
  validatePollQuestion,
  validatePollDescription,
  validatePollSettings,
  validatePollDeadline,
  computePollExpiresAt,
  simpleHash,
} from "@/lib/utils";
import type { Poll, PollSettings } from "@/lib/types";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate question
    if (!validatePollQuestion(body.question)) {
      return NextResponse.json(
        { error: "Invalid question (required, max 500 chars)" },
        { status: 400 }
      );
    }

    // Validate description
    if (!validatePollDescription(body.description)) {
      return NextResponse.json(
        { error: "Invalid description (max 1000 chars)" },
        { status: 400 }
      );
    }

    // Validate options
    if (!Array.isArray(body.options) || body.options.length < 2) {
      return NextResponse.json(
        { error: "At least 2 options are required" },
        { status: 400 }
      );
    }

    for (const option of body.options) {
      if (typeof option !== "string" || option.trim().length === 0 || option.length > 200) {
        return NextResponse.json(
          { error: "Invalid option text (required, max 200 chars)" },
          { status: 400 }
        );
      }
    }

    // Validate settings
    const defaultSettings: PollSettings = {
      participantsCanAddOptions: false,
      votingType: "single",
      resultsVisibility: "after-vote",
      anonymous: true,
      allowChangeVote: false,
      ...body.settings,
    };

    if (!validatePollSettings(defaultSettings)) {
      return NextResponse.json(
        { error: "Invalid poll settings" },
        { status: 400 }
      );
    }

    // Validate deadline if provided
    const now = new Date();
    if (defaultSettings.closeAt) {
      if (!validatePollDeadline(defaultSettings.closeAt, now.toISOString())) {
        return NextResponse.json(
          { error: "Deadline must be in the future and within 7 days of creation" },
          { status: 400 }
        );
      }
    }

    // Validate maxSelections for multi-choice
    if (defaultSettings.votingType === "multi" && defaultSettings.maxSelections) {
      if (defaultSettings.maxSelections < 1 || defaultSettings.maxSelections > body.options.length) {
        return NextResponse.json(
          { error: "maxSelections must be between 1 and the number of options" },
          { status: 400 }
        );
      }
    }

    const pollId = generateId();
    const slug = generateSlug();
    const createdAt = now.toISOString();
    const expiresAt = computePollExpiresAt(createdAt, defaultSettings.closeAt);

    // Generate editor token and hash it
    const editorToken = crypto.randomBytes(32).toString("hex");
    const editorTokenHash = simpleHash(editorToken);

    const poll: Poll = {
      pollId,
      slug,
      question: body.question.trim(),
      description: body.description?.trim() || undefined,
      settings: defaultSettings,
      createdAt,
      updatedAt: createdAt,
      editorTokenHash,
      closeAt: defaultSettings.closeAt,
      expiresAt,
      stats: {
        views: 0,
        votes: 0,
      },
    };

    await createPoll(poll);
    await createPollSlugMapping(slug, pollId, expiresAt);

    // Increment metrics (best-effort, don't fail on error)
    incrementMetricsOnCreate("poll", 0).catch((err) => {
      console.error("Error incrementing metrics:", err);
    });

    // Create initial options
    const { createPollOption } = await import("@/lib/dynamodb");
    for (let i = 0; i < body.options.length; i++) {
      await createPollOption({
        id: generateId(8),
        pollId,
        text: body.options[i].trim(),
        order: i,
        isArchived: false,
        createdAt,
        createdBy: "editor",
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/polls/${slug}`;
    const editUrl = `${baseUrl}/polls/${slug}?edit=${editorToken}`;

    return NextResponse.json({
      pollId,
      slug,
      url,
      editUrl,
      editorToken, // Return token only on creation
    });
  } catch (error) {
    console.error("Error creating poll:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
