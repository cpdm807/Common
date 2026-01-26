import type { Metadata } from "next";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Poll Examples – Team Decisions Without Accounts",
  description: "See examples of polls used for team decisions, quick votes, and gathering opinions. Learn how to use polls effectively for group choices.",
  keywords: ["poll examples", "team poll examples", "decision poll", "vote examples"],
  alternates: {
    canonical: `${baseUrl}/examples/poll`,
  },
  openGraph: {
    title: "Poll Examples – Team Decisions Without Accounts | Common",
    description: "See examples of polls used for team decisions, quick votes, and gathering opinions.",
    url: `${baseUrl}/examples/poll`,
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PollExamplesPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Poll Examples</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            See how polls are used for team decisions, quick votes, and gathering opinions.
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Common Use Cases</h2>
            <div className="space-y-6">
              <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Team Lunch Decision</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Question:</strong> "Where should we have lunch today?"
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Options:</strong> Italian, Mexican, Thai, Sushi, Pizza
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Perfect for quick team decisions where everyone's opinion matters.
                </p>
              </div>

              <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Feature Prioritization</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Question:</strong> "Which feature should we prioritize next?"
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Options:</strong> Dark mode, Mobile app, Export data, API access, Notifications
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Gather team input on what to build next. Enable "allow voters to add options" for suggestions.
                </p>
              </div>

              <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Design Preference</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Question:</strong> "Which design direction do you prefer?"
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Options:</strong> Option A, Option B, Option C, Neither (need revision)
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Quick feedback on design choices. Use multiple choice to allow selecting multiple favorites.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Tips for Effective Polls</h2>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• Keep questions clear and specific</li>
              <li>• Limit options to 5-7 for better decision-making</li>
              <li>• Use deadlines for time-sensitive decisions</li>
              <li>• Enable "allow voters to add options" for open-ended questions</li>
              <li>• Share the link in team channels for maximum participation</li>
            </ul>
          </section>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
            <Link
              href="/tools/poll/create"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Create your own poll →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
