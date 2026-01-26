import type { Metadata } from "next";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Team Poll – Make Decisions Without Accounts",
  description: "Create team polls without accounts. Perfect for quick decisions, gathering opinions, and group choices. No sign-up, no email, just create and share a link.",
  keywords: ["team poll", "poll without account", "team decision", "group poll", "quick vote"],
  alternates: {
    canonical: `${baseUrl}/use-cases/team-poll`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TeamPollPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Team Poll – Make Decisions Without Accounts</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Create polls for team decisions without requiring accounts. Perfect for quick votes, gathering opinions, and group choices.
          </p>
        </div>

        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          <p>
            Team polls are essential for making decisions quickly and inclusively. With Common's poll tool, you can create a poll in seconds, share a link, and collect votes—all without requiring anyone to sign up or create an account.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">Why Use Polls for Team Decisions?</h2>
          <ul className="space-y-2">
            <li>• <strong>Fast:</strong> Create and share in under a minute</li>
            <li>• <strong>Inclusive:</strong> Everyone can vote, no barriers</li>
            <li>• <strong>Transparent:</strong> See results in real-time</li>
            <li>• <strong>Private:</strong> No accounts, no tracking</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">Common Use Cases</h2>
          <ul className="space-y-2">
            <li>• "What should we have for lunch?"</li>
            <li>• "Which design direction do you prefer?"</li>
            <li>• "What feature should we prioritize?"</li>
            <li>• "Where should we meet?"</li>
          </ul>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
            <Link
              href="/tools/poll/create"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Create a team poll →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
