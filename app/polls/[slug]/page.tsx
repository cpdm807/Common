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
      const ogImageUrl = `${baseUrl}/og/poll/${slug}`;

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
          url: canonicalUrl,
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
    }

    const now = Math.floor(Date.now() / 1000);
    const expired = now > poll.expiresAt;

    // Use getBoardShareCopy to get the correct action text format
    const shareCopy = getBoardShareCopy("poll", poll.question, expired);
    const ogImageUrl = `${baseUrl}/og/poll/${slug}`;

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
        url: canonicalUrl,
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
    console.error("Error generating metadata:", error);
    const shareCopy = getBoardShareCopy("poll", undefined, true);
    const ogImageUrl = `${baseUrl}/og/poll/${slug}`;

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
        url: canonicalUrl,
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
  }
}

export default function PollPage() {
  return <PollPageClient />;
}
