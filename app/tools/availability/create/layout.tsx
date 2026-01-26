import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Create Availability Link – Find Best Meeting Time",
  description: "Create an availability link to find the best time to meet. No accounts required. Share a link, collect availability, and see when everyone is free.",
  keywords: ["availability link", "meeting scheduler", "find meeting time", "availability poll", "schedule meeting", "best time to meet"],
  alternates: {
    canonical: `${baseUrl}/tools/availability/create`,
  },
  openGraph: {
    title: "Create Availability Link – Find Best Meeting Time | Common",
    description: "Create an availability link to find the best time to meet. No accounts required. Share a link, collect availability, and see when everyone is free.",
    url: `${baseUrl}/tools/availability/create`,
    type: "website",
    images: [
      {
        url: `${baseUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "Create Availability Link – Common",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Availability Link – Find Best Meeting Time",
    description: "Create an availability link to find the best time to meet. No accounts required.",
    images: [`${baseUrl}/og.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CreateAvailabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
