import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Common – When things get messy, find what's common",
    template: "%s | Common",
  },
  description: "Lightweight tools to help groups align without meetings, accounts, or noise. Create polls, find availability, run retros, and check team readiness—all without accounts.",
  keywords: ["poll without account", "availability link", "team retro", "group decision", "no account voting", "schedule meeting", "team check-in"],
  authors: [{ name: "Common" }],
  creator: "Common",
  publisher: "Common",
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Common",
    title: "Common – When things get messy, find what's common",
    description: "Lightweight tools to help groups align without meetings, accounts, or noise. Create polls, find availability, run retros, and check team readiness—all without accounts.",
    images: [
      {
        url: `${baseUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "Common – Lightweight tools for group alignment",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Common – When things get messy, find what's common",
    description: "Lightweight tools to help groups align without meetings, accounts, or noise.",
    images: [`${baseUrl}/og.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
