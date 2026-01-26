import type { Metadata } from "next";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Availability Link – Find Best Meeting Time Without Accounts",
  description: "Create an availability link to find the best time to meet. No accounts required. Share a link, collect availability, and see when everyone is free. Perfect for scheduling without back-and-forth emails.",
  keywords: ["availability link", "meeting scheduler", "find meeting time", "availability poll", "schedule meeting", "best time to meet", "when2meet alternative", "doodle alternative"],
  alternates: {
    canonical: `${baseUrl}/tools/availability`,
  },
  openGraph: {
    title: "Availability Link – Find Best Meeting Time Without Accounts | Common",
    description: "Create an availability link to find the best time to meet. No accounts required. Share a link, collect availability, and see when everyone is free.",
    url: `${baseUrl}/tools/availability`,
    type: "website",
    images: [
      {
        url: `${baseUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "Availability Link – Common",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Availability Link – Find Best Meeting Time Without Accounts",
    description: "Create an availability link to find the best time to meet. No accounts required.",
    images: [`${baseUrl}/og.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const availabilitySchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Availability",
  applicationCategory: "WebApplication",
  operatingSystem: "Web",
  description: "Create an availability link to find the best time to meet. No accounts required.",
  url: `${baseUrl}/tools/availability`,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Find best meeting time",
    "No accounts required",
    "Share via single link",
    "Visual availability heatmap",
    "Timezone support",
    "Auto-expiring boards",
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: baseUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Tools",
      item: `${baseUrl}/tools`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Availability",
      item: `${baseUrl}/tools/availability`,
    },
  ],
};

export default function AvailabilityToolPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(availabilitySchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="min-h-screen px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-5xl">📅</span>
              <h1 className="text-4xl md:text-5xl font-bold">Availability</h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
              Find the best time to meet. No accounts required.
            </p>
            <Link
              href="/tools/availability/create"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Create availability link →
            </Link>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">What it is</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Availability is a simple tool for finding the best time to meet. You create a calendar grid with date and time slots, share a link, and people mark when they're available. You see a heatmap showing when everyone is free.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                No accounts, no email, no back-and-forth. Just create, share, and see when everyone can meet.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">When to use</h2>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Scheduling team meetings across timezones</li>
                <li>• Finding a time for a group call</li>
                <li>• Coordinating availability for interviews</li>
                <li>• Planning events with multiple participants</li>
                <li>• Any situation where you need to find common free time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">How it works</h2>
              <ol className="space-y-4 text-gray-700 dark:text-gray-300">
                <li>
                  <strong className="text-gray-900 dark:text-gray-100">1. Create your availability board</strong>
                  <br />
                  Set your date range, time slots, and timezone. Give it a title (optional).
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-gray-100">2. Share the link</strong>
                  <br />
                  Copy the link and share it with participants via Slack, email, or any channel.
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-gray-100">3. Collect availability</strong>
                  <br />
                  People click on time slots to mark when they're available. You see a heatmap showing the best times.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Privacy</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We don't collect email addresses, require accounts, or track users. Availability boards are accessible via unlisted links only. Data auto-expires after 7 days (or your custom deadline).
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Your boards are private by default—only people with the link can access them. We don't index board pages in search engines.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">FAQ</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Do I need an account to create an availability link?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    No. Just create your board and share the link. No sign-up required.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    How do timezones work?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    The board creator sets a timezone. All times are shown in that timezone. Participants see times in the board's timezone, so everyone is on the same page.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Can people see each other's availability?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Yes, the board shows a heatmap of all availability. This helps everyone see when the best times are.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    How long do availability boards stay open?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Boards auto-expire after 7 days by default, or you can set a custom deadline when creating.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Are availability boards searchable on Google?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    No. Board pages are set to noindex by default to protect privacy. Only people with the link can access them.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Is it free?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Yes, completely free. No hidden costs, no premium tiers, no credit card required.
                  </p>
                </div>
              </div>
            </section>

            <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
              <Link
                href="/tools/availability/create"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Create your first availability link →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
