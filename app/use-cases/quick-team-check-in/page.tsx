import type { Metadata } from "next";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Quick Team Check-In – Pulse Check Without Accounts",
  description: "Run quick team check-ins with pulse checks. Assess readiness, sentiment, or health on a shared scale. No accounts required. Perfect for regular team health checks.",
  keywords: ["team check-in", "pulse check", "readiness check", "team health", "quick check-in"],
  alternates: {
    canonical: `${baseUrl}/use-cases/quick-team-check-in`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function QuickTeamCheckInPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Quick Team Check-In – Pulse Check Without Accounts</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Run quick team check-ins with pulse checks. Assess readiness, sentiment, or health on a shared scale.
          </p>
        </div>

        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          <p>
            Regular team check-ins help you stay in touch with team health, readiness, and sentiment. With Common's pulse tool, you create a scale-based question, share a link, and see where everyone is on that scale.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">Common Check-In Questions</h2>
          <ul className="space-y-2">
            <li>• "How ready are we for launch?" (0-100, Not ready to Fully ready)</li>
            <li>• "How are you feeling about the project?" (0-100, Concerned to Excited)</li>
            <li>• "How healthy is the team?" (0-100, Struggling to Thriving)</li>
            <li>• "How confident are you in this approach?" (0-100, Not confident to Very confident)</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">Why Use Pulse Checks?</h2>
          <ul className="space-y-2">
            <li>• <strong>Quick:</strong> Takes 30 seconds to respond</li>
            <li>• <strong>Visual:</strong> See distribution of team responses</li>
            <li>• <strong>Anonymous:</strong> No names required, just the scale</li>
            <li>• <strong>No accounts:</strong> Just share a link</li>
          </ul>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
            <Link
              href="/tools/readiness"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Create a pulse check →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
