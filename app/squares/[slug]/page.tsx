import type { Metadata } from "next";
import { getSquaresToolBySlug } from "@/lib/dynamodb";
import { getBoardShareCopy } from "@/lib/tools";
import SquaresPageClient from "./SquaresPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";
  const canonicalUrl = `${baseUrl}/squares/${slug}`;

  try {
    const squares = await getSquaresToolBySlug(slug);

    if (!squares) {
      const shareCopy = getBoardShareCopy("squares", undefined, true);
      return {
        title: shareCopy.title,
        description: shareCopy.description,
        robots: {
          index: false,
          follow: false,
        },
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
    const expired = now > squares.expiresAt;
    const shareCopy = getBoardShareCopy("squares", squares.title ?? undefined, expired);

    return {
      title: shareCopy.title,
      description: shareCopy.description,
      robots: {
        index: false,
        follow: false,
      },
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
    const shareCopy = getBoardShareCopy("squares", undefined, true);
    return {
      title: shareCopy.title,
      description: shareCopy.description,
      alternates: {
        canonical: canonicalUrl,
      },
    };
  }
}

export default function SquaresPage() {
  return <SquaresPageClient />;
}
