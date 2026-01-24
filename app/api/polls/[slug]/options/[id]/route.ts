// PATCH /api/polls/[slug]/options/[id] - Update an option (editor only)

import { NextRequest, NextResponse } from "next/server";
import {
  getPollBySlug,
  getPollOptions,
  getPollVotes,
  updatePollOption,
} from "@/lib/dynamodb";
import {
  validatePollOptionText,
  simpleHash,
} from "@/lib/utils";

async function verifyEditorToken(poll: any, editToken: string | null): Promise<boolean> {
  if (!editToken || !poll) return false;
  const tokenHash = simpleHash(editToken);
  return tokenHash === poll.editorTokenHash;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const body = await request.json();
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

    // Get option
    const options = await getPollOptions(poll.pollId);
    const option = options.find((opt) => opt.id === id);

    if (!option) {
      return NextResponse.json({ error: "Option not found" }, { status: 404 });
    }

    const updates: any = {};

    // Update text
    if (body.text !== undefined) {
      if (!validatePollOptionText(body.text)) {
        return NextResponse.json(
          { error: "Invalid option text" },
          { status: 400 }
        );
      }
      updates.text = body.text.trim();
    }

    // Update order
    if (body.order !== undefined) {
      if (typeof body.order !== "number" || body.order < 0) {
        return NextResponse.json(
          { error: "Invalid order" },
          { status: 400 }
        );
      }
      updates.order = body.order;
    }

    // Archive option (check if it has votes first)
    if (body.isArchived !== undefined) {
      if (body.isArchived === true) {
        const votes = await getPollVotes(poll.pollId);
        const optionVotes = votes.filter((vote) => vote.optionId === id);
        if (optionVotes.length > 0) {
          // Allow archiving but warn
          updates.isArchived = true;
        } else {
          updates.isArchived = true;
        }
      } else {
        updates.isArchived = false;
      }
    }

    await updatePollOption(poll.pollId, id, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating option:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
