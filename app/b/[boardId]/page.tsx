import type { Metadata } from "next";
import { getBoard } from "@/lib/dynamodb";
import { getBoardShareCopy } from "@/lib/tools";
import BoardPageClient from "./BoardPageClient";

// Server-side metadata generation
export async function generateMetadata({
  params,
}: {
  params: Promise<{ boardId: string }>;
}): Promise<Metadata> {
  const { boardId } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";
  const canonicalUrl = `${baseUrl}/b/${boardId}`;
  const previewUrl = `${baseUrl}/m/board/${boardId}`;

  try {
    const board = await getBoard(boardId);

    if (!board) {
      // Board not found - use static fallback
      return {
        title: "Common",
        description: "This board is unavailable.",
        openGraph: {
          title: "Common",
          description: "This board is unavailable.",
          url: previewUrl,
          type: "website",
        },
        twitter: {
          card: "summary",
          title: "Common",
          description: "This board is unavailable.",
        },
        alternates: {
          canonical: canonicalUrl,
        },
      };
    }

    // Check if expired
    const now = Math.floor(Date.now() / 1000);
    const expired = now > board.expiresAtUserVisible;

    // Get tool-specific metadata with correct action text format
    const shareCopy = getBoardShareCopy(
      board.toolType,
      board.title,
      expired
    );

    return {
      title: shareCopy.title,
      description: shareCopy.description,
      openGraph: {
        title: shareCopy.title,
        description: shareCopy.description,
        url: previewUrl,
        type: "website",
      },
      twitter: {
        card: "summary",
        title: shareCopy.title,
        description: shareCopy.description,
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  } catch (error) {
    // On error, return default metadata with static fallback
    console.error("Error generating metadata:", error);
    return {
      title: "Common",
      description: "This board is unavailable.",
      openGraph: {
        title: "Common",
        description: "This board is unavailable.",
        url: previewUrl,
        type: "website",
      },
      twitter: {
        card: "summary",
        title: "Common",
        description: "This board is unavailable.",
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  }
}

export default function BoardPage() {
  return <BoardPageClient />;
}
