import type { Metadata } from "next";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Team Retro – Sprint Retrospective Without Accounts",
  description: "Run team retros without accounts. Create a board with Start/Stop/Continue columns, share a link, and collect feedback. Perfect for sprint retrospectives and team improvements.",
  keywords: ["team retro", "sprint retro", "retrospective", "team feedback", "retro board"],
  alternates: {
    canonical: `${baseUrl}/use-cases/team-retro`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TeamRetroPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Team Retro – Sprint Retrospective Without Accounts</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Run team retros without accounts. Create a board, share a link, and collect feedback. Perfect for sprint retrospectives.
          </p>
        </div>

        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          <p>
            Sprint retrospectives are essential for team improvement, but they don't need to be complicated. With Common's board tool, you create a retro board with Start/Stop/Continue columns, share a link, and team members add items and vote to prioritize what to discuss.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">Why Use Boards for Retros?</h2>
          <ul className="space-y-2">
            <li>• <strong>Async-friendly:</strong> Team can add items before the meeting</li>
            <li>• <strong>Prioritized:</strong> Voting surfaces what matters most</li>
            <li>• <strong>No accounts:</strong> Just share a link, everyone can participate</li>
            <li>• <strong>Private:</strong> No tracking, no email collection</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">How It Works</h2>
          <ol className="space-y-2">
            <li>1. Create a retro board (choose "Retro" template)</li>
            <li>2. Share the link with your team</li>
            <li>3. Team adds items to Start/Stop/Continue columns</li>
            <li>4. Team votes to prioritize items</li>
            <li>5. Discuss the highest-voted items in your retro meeting</li>
          </ol>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
            <Link
              href="/tools/board/create"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Create a retro board →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
