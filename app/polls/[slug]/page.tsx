import type { Metadata } from "next";
import { getPollBySlug } from "@/lib/dynamodb";
import { getBoardShareMeta } from "@/lib/tools";
import PollPageClient from "./PollPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";
  const canonicalUrl = `${baseUrl}/polls/${slug}`;
  const staticOgImageUrl = `${baseUrl}/og.png`;

  try {
    const poll = await getPollBySlug(slug);

    if (!poll) {
      return {
        title: "Common – Poll",
        description: "This poll is unavailable.",
        openGraph: {
          title: "Common – Poll",
          description: "This poll is unavailable.",
          url: canonicalUrl,
          type: "website",
          images: [{ url: staticOgImageUrl, width: 1200, height: 630 }],
        },
        twitter: {
          card: "summary_large_image",
          title: "Common – Poll",
          description: "This poll is unavailable.",
          images: [staticOgImageUrl],
        },
        alternates: {
          canonical: canonicalUrl,
        },
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const expired = now > poll.expiresAt;

    const title = poll.question;
    const description = poll.description || "Vote and see results.";

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
      title: "Common – Poll",
      description: "This poll is unavailable.",
      openGraph: {
        title: "Common – Poll",
        description: "This poll is unavailable.",
        url: canonicalUrl,
        type: "website",
        images: [{ url: staticOgImageUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title: "Common – Poll",
        description: "This poll is unavailable.",
        images: [staticOgImageUrl],
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  }
}

export default function PollPage() {
  return <PollPageClient />;
}
