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
        robots: {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        },
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

    const ogImageUrl = `${baseUrl}/og/board/${boardId}`;

    return {
      title: shareCopy.title,
      description: shareCopy.description,
      robots: {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
        },
      },
      openGraph: {
        title: shareCopy.title,
        description: shareCopy.description,
        url: previewUrl,
        type: "website",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: shareCopy.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: shareCopy.title,
        description: shareCopy.description,
        images: [ogImageUrl],
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
      robots: {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
        },
      },
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
