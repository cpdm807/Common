// Server-rendered metadata endpoint for rich link previews

import { Metadata } from "next";
import Link from "next/link";
import { getBoard } from "@/lib/dynamodb";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ boardId: string }>;
}): Promise<Metadata> {
  const { boardId } = await params;
  const board = await getBoard(boardId);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const boardUrl = `${baseUrl}/b/${boardId}`;
  const ogImageUrl = `${baseUrl}/og.png`;

  const title = board?.title
    ? `Common – ${board.title}`
    : "Common – Availability";
  const description = board?.title
    ? `${board.title}: Find the common time. Add your availability.`
    : "Find the common time. Add your availability.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: boardUrl,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Common",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function MetadataPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;
  const board = await getBoard(boardId);

  const boardUrl = `/b/${boardId}`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-4">
          {board?.title || "Availability Board"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Find the common time. Add your availability.
        </p>
        <Link
          href={boardUrl}
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          View board
        </Link>
      </div>
    </div>
  );
}
