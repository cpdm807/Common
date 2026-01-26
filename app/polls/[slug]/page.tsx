import type { Metadata } from "next";
import { getPollBySlug } from "@/lib/dynamodb";
import { getBoardShareCopy } from "@/lib/tools";
import PollPageClient from "./PollPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";
  const canonicalUrl = `${baseUrl}/polls/${slug}`;

  try {
    const poll = await getPollBySlug(slug);

    if (!poll) {
      const shareCopy = getBoardShareCopy("poll", undefined, true);
      return {
        title: shareCopy.title,
        description: shareCopy.description,
        openGraph: {
          title: shareCopy.title,
          description: shareCopy.description,
          url: canonicalUrl,
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
    }

    const now = Math.floor(Date.now() / 1000);
    const expired = now > poll.expiresAt;

    // Use getBoardShareCopy to get the correct action text format
    const shareCopy = getBoardShareCopy("poll", poll.question, expired);

    return {
      title: shareCopy.title,
      description: shareCopy.description,
      openGraph: {
        title: shareCopy.title,
        description: shareCopy.description,
        url: canonicalUrl,
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
    console.error("Error generating metadata:", error);
    const shareCopy = getBoardShareCopy("poll", undefined, true);
    return {
      title: shareCopy.title,
      description: shareCopy.description,
      openGraph: {
        title: shareCopy.title,
        description: shareCopy.description,
        url: canonicalUrl,
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
  }
}

export default function PollPage() {
  return <PollPageClient />;
}
