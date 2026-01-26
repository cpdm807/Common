import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Create Poll – No Account Required",
  description: "Create a shareable poll without accounts. Add your question, options, and share a single link. Perfect for team decisions, quick votes, and group choices.",
  keywords: ["create poll", "poll without account", "shareable poll", "team poll", "quick vote", "group decision"],
  alternates: {
    canonical: `${baseUrl}/tools/poll/create`,
  },
  openGraph: {
    title: "Create Poll – No Account Required | Common",
    description: "Create a shareable poll without accounts. Add your question, options, and share a single link.",
    url: `${baseUrl}/tools/poll/create`,
    type: "website",
    images: [
      {
        url: `${baseUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "Create Poll – Common",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Poll – No Account Required",
    description: "Create a shareable poll without accounts. Add your question, options, and share a single link.",
    images: [`${baseUrl}/og.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CreatePollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
