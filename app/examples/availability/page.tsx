import type { Metadata } from "next";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Availability Examples – Find Meeting Times",
  description: "See examples of availability links used for scheduling team meetings, interviews, and group calls. Learn how to find the best meeting time without back-and-forth emails.",
  keywords: ["availability examples", "meeting scheduler examples", "schedule meeting"],
  alternates: {
    canonical: `${baseUrl}/examples/availability`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AvailabilityExamplesPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Availability Examples</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            See how availability links help teams find the best meeting times.
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Common Use Cases</h2>
            <div className="space-y-6">
              <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Team Sync Meeting</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Schedule a weekly team sync across multiple timezones. Set a 7-day range with 30-minute slots, and let everyone mark their availability.
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Perfect for recurring meetings where you need to find a new time each week.
                </p>
              </div>

              <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Interview Scheduling</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Coordinate interview times with candidates. Create a board for the next 3 days with 1-hour slots.
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Candidates can see available slots and pick what works for them.
                </p>
              </div>
            </div>
          </section>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
            <Link
              href="/tools/availability/create"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Create your own availability link →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
