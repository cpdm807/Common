// GET /api/polls/[slug]/export - Export poll data as JSON (editor only)

import { NextRequest, NextResponse } from "next/server";
import {
  getPollBySlug,
  getPollOptions,
  getPollVotes,
} from "@/lib/dynamodb";
import {
  aggregatePollResults,
  simpleHash,
} from "@/lib/utils";

async function verifyEditorToken(poll: any, editToken: string | null): Promise<boolean> {
  if (!editToken || !poll) return false;
  const tokenHash = simpleHash(editToken);
  return tokenHash === poll.editorTokenHash;
}

export async function GET(
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

    // Get options and votes
    const options = await getPollOptions(poll.pollId);
    const votes = await getPollVotes(poll.pollId);

    // Aggregate results
    const { optionResults, totalVotes } = aggregatePollResults(
      options,
      votes,
      poll.settings
    );

    // Export data (no sensitive info like IPs or voterKeyHash)
    const exportData = {
      poll: {
        pollId: poll.pollId,
        slug: poll.slug,
        question: poll.question,
        description: poll.description,
        settings: poll.settings,
        createdAt: poll.createdAt,
        updatedAt: poll.updatedAt,
        closedAt: poll.closedAt,
        closeAt: poll.closeAt,
      },
      options: options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        order: opt.order,
        isArchived: opt.isArchived,
        createdBy: opt.createdBy,
        createdAt: opt.createdAt,
      })),
      results: {
        optionResults,
        totalVotes,
        exportedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(exportData, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="poll-${slug}.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting poll:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
