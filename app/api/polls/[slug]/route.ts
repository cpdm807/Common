// GET /api/polls/[slug] - Get poll data with aggregated results
// PATCH /api/polls/[slug] - Update poll (editor only)
// DELETE /api/polls/[slug] - Delete poll (editor only)

import { NextRequest, NextResponse } from "next/server";
import {
  getPollBySlug,
  getPollOptions,
  getPollVotes,
  incrementPollViews,
  updatePoll,
  deletePoll,
} from "@/lib/dynamodb";
import {
  aggregatePollResults,
  getUserVotes,
  hasUserVoted,
  isPollClosed,
  computePollExpiresAt,
  simpleHash,
} from "@/lib/utils";
import type { PollPublicData } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const voterKey = searchParams.get("voterKey") || undefined;
    const voterKeyHash = voterKey ? simpleHash(voterKey) : undefined;
    const editToken = searchParams.get("edit") || undefined;

    const poll = await getPollBySlug(slug);

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    const expired = now > poll.expiresAt;

    if (expired) {
      return NextResponse.json({ error: "Poll expired" }, { status: 404 });
    }

    // Increment views (best-effort)
    incrementPollViews(poll.pollId).catch(() => {
      // ignore errors
    });

    // Get options and votes
    const options = await getPollOptions(poll.pollId);
    const votes = await getPollVotes(poll.pollId);

    // Check if user has voted
    const userVoted = voterKeyHash ? hasUserVoted(votes, voterKeyHash) : false;
    const userVotes = voterKeyHash ? getUserVotes(votes, voterKeyHash) : undefined;

    // Determine if results should be visible
    const closed = isPollClosed(poll);
    let resultsVisible = false;

    if (poll.settings.resultsVisibility === "immediately") {
      resultsVisible = true;
    } else if (poll.settings.resultsVisibility === "after-vote") {
      resultsVisible = userVoted;
    } else if (poll.settings.resultsVisibility === "after-close") {
      resultsVisible = closed;
    }

    // Aggregate results
    const { optionResults, totalVotes } = aggregatePollResults(
      options,
      votes,
      poll.settings
    );

    const response: PollPublicData = {
      pollId: poll.pollId,
      slug: poll.slug,
      question: poll.question,
      description: poll.description,
      settings: poll.settings,
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt,
      closedAt: poll.closedAt,
      closeAt: poll.closeAt,
      expiresAt: poll.expiresAt,
      stats: {
        ...poll.stats,
        votes: totalVotes, // Update from actual votes
      },
      computed: {
        expired: false,
        closed,
        options: optionResults,
        totalVotes,
        userVoted,
        userVotes,
        resultsVisible,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching poll:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function verifyEditorToken(poll: any, editToken: string | null): Promise<boolean> {
  if (!editToken || !poll) return false;
  const tokenHash = simpleHash(editToken);
  return tokenHash === poll.editorTokenHash;
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

    const poll = await getPollBySlug(slug);

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (now > poll.expiresAt) {
      return NextResponse.json({ error: "Poll expired" }, { status: 404 });
    }

    // Verify editor token
    if (!(await verifyEditorToken(poll, editToken || null))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates: any = {};

    if (body.question !== undefined) {
      if (typeof body.question !== "string" || body.question.trim().length === 0 || body.question.length > 500) {
        return NextResponse.json(
          { error: "Invalid question" },
          { status: 400 }
        );
      }
      updates.question = body.question.trim();
    }

    if (body.description !== undefined) {
      if (body.description !== null && (typeof body.description !== "string" || body.description.length > 1000)) {
        return NextResponse.json(
          { error: "Invalid description" },
          { status: 400 }
        );
      }
      updates.description = body.description?.trim() || undefined;
    }

    if (body.settings !== undefined) {
      const { validatePollSettings, validatePollDeadline } = await import("@/lib/utils");
      const newSettings = { ...poll.settings, ...body.settings };
      if (!validatePollSettings(newSettings)) {
        return NextResponse.json(
          { error: "Invalid settings" },
          { status: 400 }
        );
      }
      if (newSettings.closeAt && !validatePollDeadline(newSettings.closeAt, poll.createdAt)) {
        return NextResponse.json(
          { error: "Deadline must be in the future and within 7 days of creation" },
          { status: 400 }
        );
      }
      updates.settings = newSettings;
      if (newSettings.closeAt !== poll.closeAt) {
        updates.closeAt = newSettings.closeAt;
        updates.expiresAt = computePollExpiresAt(poll.createdAt, newSettings.closeAt);
      }
    }

    if (body.closedAt !== undefined) {
      updates.closedAt = body.closedAt || undefined;
    }

    updates.updatedAt = new Date().toISOString();

    await updatePoll(poll.pollId, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating poll:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const editToken = searchParams.get("edit");

    const poll = await getPollBySlug(slug);

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Verify editor token
    if (!(await verifyEditorToken(poll, editToken || null))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deletePoll(poll.pollId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting poll:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
