import type { Metadata } from "next";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Poll Tool – Create Shareable Polls Without Accounts",
  description: "Create a poll without accounts. Add your question, options, and share a single link. Perfect for team decisions, quick votes, and group choices. No sign-up, no email, no tracking.",
  keywords: ["poll without account", "create poll", "shareable poll", "team poll", "quick vote", "group decision", "online poll", "poll tool"],
  alternates: {
    canonical: `${baseUrl}/tools/poll`,
  },
  openGraph: {
    title: "Poll Tool – Create Shareable Polls Without Accounts | Common",
    description: "Create a poll without accounts. Add your question, options, and share a single link. Perfect for team decisions, quick votes, and group choices.",
    url: `${baseUrl}/tools/poll`,
    type: "website",
    images: [
      {
        url: `${baseUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "Poll Tool – Common",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Poll Tool – Create Shareable Polls Without Accounts",
    description: "Create a poll without accounts. Add your question, options, and share a single link.",
    images: [`${baseUrl}/og.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const pollSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Poll",
  applicationCategory: "WebApplication",
  operatingSystem: "Web",
  description: "Create shareable polls without accounts. Add your question, options, and share a single link.",
  url: `${baseUrl}/tools/poll`,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Create polls without accounts",
    "Share via single link",
    "Real-time results",
    "Multiple choice support",
    "Allow voters to add options",
    "Auto-expiring polls",
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
      name: "Poll",
      item: `${baseUrl}/tools/poll`,
    },
  ],
};

export default function PollToolPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pollSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="min-h-screen px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-5xl">📊</span>
              <h1 className="text-4xl md:text-5xl font-bold">Poll</h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
              Create a shareable poll via a single link. No accounts required.
            </p>
            <Link
              href="/tools/poll/create"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Create a poll →
            </Link>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">What it is</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Poll is a simple tool for creating shareable polls without requiring accounts. You create a poll with a question and options, then share a single link. Anyone with the link can vote and see results in real-time.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Perfect for quick team decisions, gathering opinions, or choosing between options. No sign-up, no email, no tracking—just create and share.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">When to use</h2>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Team decisions: "What should we have for lunch?"</li>
                <li>• Quick votes: "Which design do you prefer?"</li>
                <li>• Gathering opinions: "What feature should we prioritize?"</li>
                <li>• Group choices: "Where should we meet?"</li>
                <li>• Any situation where you need quick, anonymous feedback</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">How it works</h2>
              <ol className="space-y-4 text-gray-700 dark:text-gray-300">
                <li>
                  <strong className="text-gray-900 dark:text-gray-100">1. Create your poll</strong>
                  <br />
                  Add your question and options. Choose single or multiple choice voting. Set optional deadlines.
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-gray-100">2. Share the link</strong>
                  <br />
                  Copy the link and share it with your team via Slack, email, or any channel.
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-gray-100">3. Collect votes</strong>
                  <br />
                  People vote and see results in real-time. No accounts needed—just click and vote.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Privacy</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We don't collect email addresses, require accounts, or track users. Polls are accessible via unlisted links only. Data auto-expires after a set period (or stays open if you don't set a deadline).
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Your polls are private by default—only people with the link can access them. We don't index poll pages in search engines.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">FAQ</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Do I need an account to create a poll?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    No. Just create your poll and share the link. No sign-up required.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Can people vote multiple times?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    By default, people can vote once per device/browser. You can enable "allow change vote" to let people update their choice.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Can voters add their own options?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Yes, you can enable "allow voters to add options" when creating your poll.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    How long do polls stay open?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    You can set a deadline (1 hour to 5 days) or leave it open indefinitely. Open polls stay active until manually closed.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Are polls searchable on Google?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    No. Poll pages are set to noindex by default to protect privacy. Only people with the link can access them.
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
                href="/tools/poll/create"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Create your first poll →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
