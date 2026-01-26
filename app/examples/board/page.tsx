import type { Metadata } from "next";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Board Examples – Team Retros & Agendas",
  description: "See examples of boards used for team retros, meeting agendas, and collaborative lists. Learn how to use boards effectively for team feedback.",
  keywords: ["board examples", "retro examples", "agenda examples", "team retro"],
  alternates: {
    canonical: `${baseUrl}/examples/board`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BoardExamplesPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Board Examples</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            See how boards are used for team retros, agendas, and collaborative lists.
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Common Use Cases</h2>
            <div className="space-y-6">
              <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Sprint Retrospective</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Use the retro template with Start/Stop/Continue columns. Team adds items and votes to prioritize what to discuss.
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Perfect for sprint retros where you want to surface the most important topics.
                </p>
              </div>

              <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Meeting Agenda</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Use the agenda template to collect topics before a meeting. Team adds items and votes to prioritize.
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Ensures important topics are covered and meetings stay focused.
                </p>
              </div>
            </div>
          </section>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
            <Link
              href="/tools/board/create"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Create your own board →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
