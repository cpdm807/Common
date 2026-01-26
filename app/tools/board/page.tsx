import type { Metadata } from "next";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Board Tool – Team Retro & Agenda Without Accounts",
  description: "Create a shared board for team retros, agendas, and item voting. No accounts required. Perfect for sprint retros, meeting agendas, and collaborative lists. Share a link and start collecting items.",
  keywords: ["team retro", "agenda board", "retrospective board", "team voting", "shared board", "sprint retro", "team agenda", "retro tool"],
  alternates: {
    canonical: `${baseUrl}/tools/board`,
  },
  openGraph: {
    title: "Board Tool – Team Retro & Agenda Without Accounts | Common",
    description: "Create a shared board for team retros, agendas, and item voting. No accounts required. Perfect for sprint retros, meeting agendas, and collaborative lists.",
    url: `${baseUrl}/tools/board`,
    type: "website",
    images: [
      {
        url: `${baseUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "Board Tool – Common",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Board Tool – Team Retro & Agenda Without Accounts",
    description: "Create a shared board for team retros, agendas, and item voting. No accounts required.",
    images: [`${baseUrl}/og.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const boardSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Board",
  applicationCategory: "WebApplication",
  operatingSystem: "Web",
  description: "Create a shared board for team retros, agendas, and item voting. No accounts required.",
  url: `${baseUrl}/tools/board`,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Team retros and agendas",
    "Item voting",
    "No accounts required",
    "Share via single link",
    "Agenda and retro templates",
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
      name: "Board",
      item: `${baseUrl}/tools/board`,
    },
  ],
};

export default function BoardToolPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(boardSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="min-h-screen px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-5xl">📋</span>
              <h1 className="text-4xl md:text-5xl font-bold">Board</h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
              Shared items with lightweight voting, for agendas and retros.
            </p>
            <Link
              href="/tools/board/create"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Create a board →
            </Link>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">What it is</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Board is a simple tool for creating shared lists with lightweight voting. Perfect for team retros, meeting agendas, or any collaborative list where you want to surface what matters through voting.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Choose from agenda (single list) or retro (Start/Stop/Continue columns) templates. People add items and vote to prioritize. No accounts required—just share a link.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">When to use</h2>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Sprint retrospectives: What went well? What should we change?</li>
                <li>• Meeting agendas: Collect topics before the meeting</li>
                <li>• Team feedback: Gather ideas and prioritize with votes</li>
                <li>• Brainstorming: Collect ideas and see what resonates</li>
                <li>• Any collaborative list where voting helps prioritize</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">How it works</h2>
              <ol className="space-y-4 text-gray-700 dark:text-gray-300">
                <li>
                  <strong className="text-gray-900 dark:text-gray-100">1. Create your board</strong>
                  <br />
                  Choose agenda or retro template. Add a title and enable voting if you want to prioritize items.
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-gray-100">2. Share the link</strong>
                  <br />
                  Copy the link and share it with your team via Slack, email, or any channel.
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-gray-100">3. Collect items and votes</strong>
                  <br />
                  People add items and vote to surface what matters. Items with more votes appear higher.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Privacy</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We don't collect email addresses, require accounts, or track users. Boards are accessible via unlisted links only. Data auto-expires after 7 days (or your custom deadline).
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
                    Do I need an account to create a board?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    No. Just create your board and share the link. No sign-up required.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    What's the difference between agenda and retro templates?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Agenda creates a single list of items. Retro creates three columns: Start (things to start doing), Stop (things to stop doing), and Continue (things to keep doing).
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Can I disable voting?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Yes, you can disable voting when creating the board. Items will just be listed without voting.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    How long do boards stay open?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Boards auto-expire after 7 days by default, or you can set a custom deadline when creating.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Are boards searchable on Google?
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
                href="/tools/board/create"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Create your first board →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
