import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Create Board – Team Retro & Agenda Tool",
  description: "Create a shared board for team retros, agendas, and item voting. No accounts required. Perfect for sprint retros, meeting agendas, and collaborative lists.",
  keywords: ["team retro", "agenda board", "retrospective board", "team voting", "shared board", "sprint retro"],
  alternates: {
    canonical: `${baseUrl}/tools/board/create`,
  },
  openGraph: {
    title: "Create Board – Team Retro & Agenda Tool | Common",
    description: "Create a shared board for team retros, agendas, and item voting. No accounts required.",
    url: `${baseUrl}/tools/board/create`,
    type: "website",
    images: [
      {
        url: `${baseUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "Create Board – Common",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Board – Team Retro & Agenda Tool",
    description: "Create a shared board for team retros, agendas, and item voting. No accounts required.",
    images: [`${baseUrl}/og.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CreateBoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
