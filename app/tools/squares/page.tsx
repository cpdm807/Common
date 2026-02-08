import type { Metadata } from "next";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Football Squares – 10x10 Contest Without Accounts",
  description: "Create a football squares board. 10x10 grid, claim squares by name. Numbers revealed when full. Perfect for Super Bowl and game-day pools. No sign-up, no email, no tracking.",
  keywords: ["football squares", "super bowl squares", "game squares", "pool squares", "10x10 grid", "contest", "no account"],
  alternates: {
    canonical: `${baseUrl}/tools/squares`,
  },
  openGraph: {
    title: "Football Squares – 10x10 Contest | Common",
    description: "Create a football squares board. 10x10 grid, claim squares by name. Numbers revealed when full.",
    url: `${baseUrl}/tools/squares`,
    type: "website",
    images: [
      {
        url: `${baseUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "Football Squares – Common",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Football Squares – 10x10 Contest",
    description: "Create a football squares board. 10x10 grid, claim squares by name. Numbers revealed when full.",
    images: [`${baseUrl}/og.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SquaresToolPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-5xl">🏈</span>
            <h1 className="text-4xl md:text-5xl font-bold">Football Squares</h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
            10x10 football squares contest. Claim squares by name. Numbers revealed when the board is full.
          </p>
          <Link
            href="/tools/squares/create"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Create a board →
          </Link>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">What it is</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Football Squares is a classic game-day pool. A 10x10 grid has 100 squares. People claim squares with their name. When the board is full, the host reveals random digits (0–9) for rows and columns. Winners are determined by matching the last digit of each team&apos;s score.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How it works</h2>
            <ol className="space-y-4 text-gray-700 dark:text-gray-300">
              <li>
                <strong className="text-gray-900 dark:text-gray-100">1. Create your board</strong>
                <br />
                Add an optional title, set team names (rows and columns), and custom rules.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-gray-100">2. Share the link</strong>
                <br />
                Anyone with the link can claim squares. Each person enters their name and selects one or more available squares.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-gray-100">3. Reveal numbers</strong>
                <br />
                When all 100 squares are claimed, the host clicks &quot;Show Numbers&quot;. Digits are randomized once and locked forever.
              </li>
            </ol>
          </section>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
            <Link
              href="/tools/squares/create"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Create your first board →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
