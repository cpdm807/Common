import type { Metadata } from "next";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Decide in Group Text – Poll Without Account",
  description: "Make group decisions in text messages, Slack, or any chat. Create a poll without accounts, share the link, and collect votes. Perfect for quick team decisions.",
  keywords: ["poll in text", "group text poll", "slack poll", "poll without account", "quick vote"],
  alternates: {
    canonical: `${baseUrl}/use-cases/decide-in-group-text`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DecideInGroupTextPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Decide in Group Text – Poll Without Account</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Make group decisions in text messages, Slack, or any chat. Create a poll, share the link, and collect votes.
          </p>
        </div>

        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          <p>
            Need to make a quick decision in a group chat? Instead of asking "what do you think?" and getting scattered responses, create a poll and share the link. Everyone clicks, votes, and you see results instantly.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">Perfect For</h2>
          <ul className="space-y-2">
            <li>• Group text decisions: "Where should we meet?"</li>
            <li>• Slack channels: "Which design do you prefer?"</li>
            <li>• WhatsApp groups: "What should we do this weekend?"</li>
            <li>• Any group chat where you need a quick vote</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">How It Works</h2>
          <ol className="space-y-2">
            <li>1. Create your poll (takes 30 seconds)</li>
            <li>2. Copy the link</li>
            <li>3. Paste it in your group chat</li>
            <li>4. Everyone votes, you see results</li>
          </ol>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
            <Link
              href="/tools/poll/create"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Create a poll →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
