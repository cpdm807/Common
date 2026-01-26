import type { Metadata } from "next";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Schedule Without Meeting – Find Best Time to Meet",
  description: "Schedule meetings without the back-and-forth. Create an availability link, share it, and see when everyone is free. No accounts, no email chains, just find the best time.",
  keywords: ["schedule meeting", "find meeting time", "availability link", "meeting scheduler", "when2meet alternative"],
  alternates: {
    canonical: `${baseUrl}/use-cases/schedule-without-meeting`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ScheduleWithoutMeetingPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Schedule Without Meeting – Find Best Time to Meet</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Schedule meetings without the back-and-forth. Create an availability link, share it, and see when everyone is free.
          </p>
        </div>

        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          <p>
            Scheduling meetings across multiple people and timezones is a pain. Endless email chains, "when are you free?" messages, and calendar conflicts. With Common's availability tool, you create a calendar grid, share a link, and everyone marks when they're available. You see a heatmap showing the best times.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">Why Use Availability Links?</h2>
          <ul className="space-y-2">
            <li>• <strong>No back-and-forth:</strong> One link, everyone marks availability</li>
            <li>• <strong>Visual:</strong> See a heatmap of when everyone is free</li>
            <li>• <strong>Timezone-aware:</strong> Set your timezone, everyone sees the same times</li>
            <li>• <strong>Private:</strong> No accounts, no tracking</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">Perfect For</h2>
          <ul className="space-y-2">
            <li>• Team sync meetings across timezones</li>
            <li>• Interview scheduling with candidates</li>
            <li>• Group calls and virtual events</li>
            <li>• Any situation where you need to find common free time</li>
          </ul>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
            <Link
              href="/tools/availability/create"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Create an availability link →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
