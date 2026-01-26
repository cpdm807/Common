import type { Metadata } from "next";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Examples – See Common Tools in Action",
  description: "See examples of polls, availability links, boards, and pulse checks. Learn how others use Common tools for team decisions, scheduling, retros, and check-ins.",
  keywords: ["poll examples", "availability examples", "board examples", "pulse examples", "team tool examples"],
  alternates: {
    canonical: `${baseUrl}/examples`,
  },
  openGraph: {
    title: "Examples – See Common Tools in Action | Common",
    description: "See examples of polls, availability links, boards, and pulse checks. Learn how others use Common tools.",
    url: `${baseUrl}/examples`,
    type: "website",
    images: [
      {
        url: `${baseUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "Common Examples",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Examples – See Common Tools in Action",
    description: "See examples of polls, availability links, boards, and pulse checks.",
    images: [`${baseUrl}/og.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const examples = [
  {
    id: "poll",
    name: "Poll Examples",
    description: "See how polls are used for team decisions, quick votes, and gathering opinions.",
    href: "/examples/poll",
    icon: "📊",
  },
  {
    id: "availability",
    name: "Availability Examples",
    description: "See how availability links help teams find the best meeting times.",
    href: "/examples/availability",
    icon: "📅",
  },
  {
    id: "board",
    name: "Board Examples",
    description: "See how boards are used for team retros, agendas, and collaborative lists.",
    href: "/examples/board",
    icon: "📋",
  },
  {
    id: "readiness",
    name: "Pulse Examples",
    description: "See how pulse checks help teams assess readiness, sentiment, and health.",
    href: "/examples/readiness",
    icon: "🟢",
  },
];

export default function ExamplesPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Examples</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            See how Common tools are used in practice. These examples show real use cases for polls, availability links, boards, and pulse checks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {examples.map((example) => (
            <Link
              key={example.id}
              href={example.href}
              className="p-6 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">{example.icon}</span>
                <h2 className="text-2xl font-semibold">{example.name}</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {example.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Want to create your own?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            All Common tools are free and require no accounts. Just create and share.
          </p>
          <Link
            href="/tools"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Browse tools →
          </Link>
        </div>
      </div>
    </div>
  );
}
