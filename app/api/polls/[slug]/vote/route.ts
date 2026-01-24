// POST /api/polls/[slug]/vote - Cast a vote

import { NextRequest, NextResponse } from "next/server";
import {
  getPollBySlug,
  getPollOptions,
  getPollVotes,
  getPollVotesByVoter,
  createPollVote,
  deletePollVote,
  checkAndUpdatePollRateLimit,
} from "@/lib/dynamodb";
import {
  hasUserVoted,
  isPollClosed,
  simpleHash,
} from "@/lib/utils";
import type { PollVote } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const poll = await getPollBySlug(slug);

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (now > poll.expiresAt) {
      return NextResponse.json({ error: "Poll expired" }, { status: 404 });
    }

    // Check if closed
    if (isPollClosed(poll)) {
      return NextResponse.json({ error: "Poll is closed" }, { status: 400 });
    }

    // Rate limiting
    if (!(await checkAndUpdatePollRateLimit(poll.pollId, 10))) {
      return NextResponse.json(
        { error: "Too many votes. Please try again later." },
        { status: 429 }
      );
    }

    // Validate voter key
    if (!body.voterKey || typeof body.voterKey !== "string") {
      return NextResponse.json(
        { error: "Invalid voter key" },
        { status: 400 }
      );
    }

    const voterKeyHash = simpleHash(body.voterKey);

    // Validate option IDs
    const optionIds = Array.isArray(body.optionIds) ? body.optionIds : [body.optionId];
    if (!optionIds || optionIds.length === 0) {
      return NextResponse.json(
        { error: "At least one option must be selected" },
        { status: 400 }
      );
    }

    // Get options to validate
    const options = await getPollOptions(poll.pollId);
    const validOptionIds = new Set(options.filter((opt) => !opt.isArchived).map((opt) => opt.id));

    for (const optionId of optionIds) {
      if (!validOptionIds.has(optionId)) {
        return NextResponse.json(
          { error: "Invalid option ID" },
          { status: 400 }
        );
      }
    }

    // Validate voting type
    if (poll.settings.votingType === "single" && optionIds.length > 1) {
      return NextResponse.json(
        { error: "Single-choice polls allow only one option" },
        { status: 400 }
      );
    }

    if (poll.settings.votingType === "multi") {
      if (poll.settings.maxSelections && optionIds.length > poll.settings.maxSelections) {
        return NextResponse.json(
          { error: `Maximum ${poll.settings.maxSelections} selections allowed` },
          { status: 400 }
        );
      }
    }

    // Check if user already voted
    const existingVotes = await getPollVotesByVoter(poll.pollId, voterKeyHash);
    const alreadyVoted = existingVotes.length > 0;

    if (alreadyVoted) {
      if (!poll.settings.allowChangeVote) {
        return NextResponse.json(
          { error: "You have already voted and changing votes is not allowed" },
          { status: 400 }
        );
      }

      // Delete existing votes
      for (const vote of existingVotes) {
        await deletePollVote(poll.pollId, vote.id);
      }
    }

    // Validate voter name if required
    let voterName: string | undefined = undefined;
    if (!poll.settings.anonymous) {
      if (!body.voterName || typeof body.voterName !== "string" || body.voterName.trim().length === 0) {
        return NextResponse.json(
          { error: "Voter name is required for non-anonymous polls" },
          { status: 400 }
        );
      }
      if (body.voterName.length > 100) {
        return NextResponse.json(
          { error: "Voter name must be 100 characters or less" },
          { status: 400 }
        );
      }
      voterName = body.voterName.trim();
    }

    // Create votes
    const createdAt = new Date().toISOString();
    for (const optionId of optionIds) {
      const vote: PollVote = {
        id: `${poll.pollId}-${optionId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        pollId: poll.pollId,
        optionId,
        voterKeyHash,
        voterName,
        createdAt,
      };
      await createPollVote(vote);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error casting vote:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
