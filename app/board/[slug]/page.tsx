import type { Metadata } from "next";
import { getBoardToolBySlug } from "@/lib/dynamodb";
import BoardPageClient from "./BoardPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";
  const canonicalUrl = `${baseUrl}/board/${slug}`;
  const staticOgImageUrl = `${baseUrl}/og.png`;

  try {
    const board = await getBoardToolBySlug(slug);

    if (!board) {
      return {
        title: "Common – Board",
        description: "This board is unavailable.",
        openGraph: {
          title: "Common – Board",
          description: "This board is unavailable.",
          url: canonicalUrl,
          type: "website",
          images: [{ url: staticOgImageUrl, width: 1200, height: 630 }],
        },
        twitter: {
          card: "summary_large_image",
          title: "Common – Board",
          description: "This board is unavailable.",
          images: [staticOgImageUrl],
        },
        alternates: {
          canonical: canonicalUrl,
        },
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const expired = now > board.expiresAt;

    const title = board.title;
    const description = "Shared items with lightweight voting, for agendas and retros.";

    return {
      title: `Common – ${title}`,
      description,
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        type: "website",
        images: [{ url: staticOgImageUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [staticOgImageUrl],
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Common – Board",
      description: "This board is unavailable.",
      openGraph: {
        title: "Common – Board",
        description: "This board is unavailable.",
        url: canonicalUrl,
        type: "website",
        images: [{ url: staticOgImageUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title: "Common – Board",
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
