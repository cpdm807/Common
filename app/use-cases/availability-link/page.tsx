import type { Metadata } from "next";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Availability Link – Doodle & When2Meet Alternative",
  description: "Create an availability link to find the best meeting time. No accounts required. Free alternative to Doodle and When2Meet. Share a link and see when everyone is free.",
  keywords: ["availability link", "doodle alternative", "when2meet alternative", "meeting scheduler", "find meeting time"],
  alternates: {
    canonical: `${baseUrl}/use-cases/availability-link`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AvailabilityLinkPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Availability Link – Doodle & When2Meet Alternative</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Create an availability link to find the best meeting time. No accounts, no sign-up, completely free.
          </p>
        </div>

        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          <p>
            Tired of Doodle's limitations or When2Meet's interface? Common's availability tool offers a simple, privacy-first alternative. Create a calendar grid, share a link, and see when everyone is free—all without requiring accounts or sign-ups.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">Why Choose Common Over Doodle?</h2>
          <ul className="space-y-2">
            <li>• <strong>No accounts:</strong> No sign-up required for creators or participants</li>
            <li>• <strong>Free forever:</strong> No premium tiers, no hidden costs</li>
            <li>• <strong>Privacy-first:</strong> No tracking, no email collection</li>
            <li>• <strong>Simple:</strong> Clean interface, easy to use</li>
            <li>• <strong>Auto-expiring:</strong> Data cleans itself up</li>
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
