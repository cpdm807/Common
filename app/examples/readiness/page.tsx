import type { Metadata } from "next";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Pulse Examples – Team Readiness Checks",
  description: "See examples of pulse checks used for team readiness, sentiment, and health assessments. Learn how to use pulse checks effectively.",
  keywords: ["pulse examples", "readiness examples", "team check-in examples"],
  alternates: {
    canonical: `${baseUrl}/examples/readiness`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ReadinessExamplesPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Pulse Examples</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            See how pulse checks help teams assess readiness, sentiment, and health.
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Common Use Cases</h2>
            <div className="space-y-6">
              <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Launch Readiness</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  "How ready are we for launch?" (0-100 scale, "Not ready" to "Fully ready")
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Quick assessment of team confidence before a launch.
                </p>
              </div>

              <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Team Sentiment</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  "How are you feeling about the project?" (0-100 scale, "Concerned" to "Excited")
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Regular check-ins on team morale and sentiment.
                </p>
              </div>
            </div>
          </section>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
            <Link
              href="/tools/readiness"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Create your own pulse check →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
