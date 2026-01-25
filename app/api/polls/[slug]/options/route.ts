// POST /api/polls/[slug]/options - Add an option

import { NextRequest, NextResponse } from "next/server";
import {
  getPollBySlug,
  getPollOptions,
  createPollOption,
} from "@/lib/dynamodb";
import {
  validatePollOptionText,
  simpleHash,
} from "@/lib/utils";
import { generateId } from "@/lib/utils";

export async function POST(
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

    // Check if closed
    const { isPollClosed } = await import("@/lib/utils");
    if (isPollClosed(poll)) {
      return NextResponse.json({ error: "Poll is closed" }, { status: 400 });
    }

    // Verify permissions
    const isEditor = editToken && simpleHash(editToken) === poll.editorTokenHash;
    const canAdd = isEditor || poll.settings.participantsCanAddOptions;

    if (!canAdd) {
      return NextResponse.json(
        { error: "Participants cannot add options" },
        { status: 403 }
      );
    }

    // Validate option text
    if (!validatePollOptionText(body.text)) {
      return NextResponse.json(
        { error: "Invalid option text (required, max 200 chars)" },
        { status: 400 }
      );
    }

    // Get existing options to determine order
    const options = await getPollOptions(poll.pollId);
    const maxOrder = options.length > 0
      ? Math.max(...options.map((opt) => opt.order))
      : -1;

    const option = {
      id: generateId(8),
      pollId: poll.pollId,
      text: body.text.trim(),
      order: maxOrder + 1,
      isArchived: false,
      createdAt: new Date().toISOString(),
      createdBy: (isEditor ? "editor" : "participant") as "editor" | "participant",
    };

    await createPollOption(option);

    return NextResponse.json({ success: true, option });
  } catch (error) {
    console.error("Error adding option:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
