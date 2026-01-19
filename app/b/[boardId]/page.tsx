import type { Metadata } from "next";
import { getBoard } from "@/lib/dynamodb";
import { getBoardShareMeta } from "@/lib/tools";
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
  const staticOgImageUrl = `${baseUrl}/og.png`;
  const dynamicOgImageUrl = `${baseUrl}/og/board/${boardId}`;

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
          url: canonicalUrl,
          type: "website",
          images: [{ url: staticOgImageUrl, width: 1200, height: 630 }],
        },
        twitter: {
          card: "summary_large_image",
          title: "Common",
          description: "This board is unavailable.",
          images: [staticOgImageUrl],
        },
        alternates: {
          canonical: canonicalUrl,
        },
      };
    }

    // Check if expired
    const now = Math.floor(Date.now() / 1000);
    const expired = now > board.expiresAtUserVisible;

    // Get tool-specific metadata
    const { title, description } = getBoardShareMeta(
      board.toolType,
      board.title,
      expired
    );

    // Use dynamic OG image if board exists and is not expired, otherwise use static fallback
    const ogImageUrl = expired ? staticOgImageUrl : dynamicOgImageUrl;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        type: "website",
        images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
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
      openGraph: {
        title: "Common",
        description: "This board is unavailable.",
        url: canonicalUrl,
        type: "website",
        images: [{ url: staticOgImageUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title: "Common",
        description: "This board is unavailable.",
        images: [staticOgImageUrl],
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
