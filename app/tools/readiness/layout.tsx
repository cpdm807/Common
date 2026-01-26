import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Create Pulse Check – Team Readiness Tool",
  description: "Create a pulse check for team readiness, sentiment, or any scale-based question. No accounts required. Quick group check-ins on a shared scale.",
  keywords: ["pulse check", "team readiness", "readiness check", "team sentiment", "group check-in", "readiness scale"],
  alternates: {
    canonical: `${baseUrl}/tools/readiness`,
  },
  openGraph: {
    title: "Create Pulse Check – Team Readiness Tool | Common",
    description: "Create a pulse check for team readiness, sentiment, or any scale-based question. No accounts required.",
    url: `${baseUrl}/tools/readiness`,
    type: "website",
    images: [
      {
        url: `${baseUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "Create Pulse Check – Common",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Pulse Check – Team Readiness Tool",
    description: "Create a pulse check for team readiness, sentiment, or any scale-based question. No accounts required.",
    images: [`${baseUrl}/og.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CreateReadinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
