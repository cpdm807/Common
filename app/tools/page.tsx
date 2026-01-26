import type { Metadata } from "next";
import Link from "next/link";
import { toolRegistry } from "@/lib/tools";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Tools – Poll, Availability, Board, Pulse",
  description: "Four lightweight tools to help groups align: create polls without accounts, find the best meeting time with availability links, run team retros with boards, and check team readiness with pulse checks. All free, no sign-up required.",
  keywords: ["poll tool", "availability tool", "board tool", "pulse tool", "team tools", "group alignment", "no account tools"],
  alternates: {
    canonical: `${baseUrl}/tools`,
  },
  openGraph: {
    title: "Tools – Poll, Availability, Board, Pulse | Common",
    description: "Four lightweight tools to help groups align: create polls, find meeting times, run retros, and check readiness. All free, no sign-up required.",
    url: `${baseUrl}/tools`,
    type: "website",
    images: [
      {
        url: `${baseUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "Common Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tools – Poll, Availability, Board, Pulse",
    description: "Four lightweight tools to help groups align. All free, no sign-up required.",
    images: [`${baseUrl}/og.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const tools = [
  {
    id: "poll",
    name: toolRegistry.poll.displayName,
    description: toolRegistry.poll.description,
    href: "/tools/poll",
    createHref: toolRegistry.poll.createRoute,
    icon: toolRegistry.poll.icon,
  },
  {
    id: "availability",
    name: toolRegistry.availability.displayName,
    description: toolRegistry.availability.description,
    href: "/tools/availability",
    createHref: toolRegistry.availability.createRoute,
    icon: toolRegistry.availability.icon,
  },
  {
    id: "board",
    name: toolRegistry.board.displayName,
    description: toolRegistry.board.description,
    href: "/tools/board",
    createHref: toolRegistry.board.createRoute,
    icon: toolRegistry.board.icon,
  },
  {
    id: "readiness",
    name: toolRegistry.readiness.displayName,
    description: toolRegistry.readiness.description,
    href: toolRegistry.readiness.createRoute,
    createHref: toolRegistry.readiness.createRoute,
    icon: toolRegistry.readiness.icon,
  },
];

const toolsSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Common Tools",
  description: "Lightweight tools for group alignment",
  itemListElement: tools.map((tool, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "SoftwareApplication",
      name: tool.name,
      description: tool.description,
      url: `${baseUrl}${tool.href}`,
      applicationCategory: "WebApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  })),
};

export default function ToolsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolsSchema) }}
      />
      <div className="min-h-screen px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Tools
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Four lightweight tools to help groups align without meetings, accounts, or noise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className="p-6 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{tool.icon}</span>
                  <h2 className="text-2xl font-semibold">{tool.name}</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {tool.description}
                </p>
                <div className="flex gap-3">
                  {tool.href !== tool.createHref && (
                    <Link
                      href={tool.href}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Learn more →
                    </Link>
                  )}
                  <Link
                    href={tool.createHref}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    {tool.href === tool.createHref ? "Create →" : "Create →"}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
            <h2 className="text-2xl font-semibold mb-4">Why Common?</h2>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>• No accounts required – just create and share</li>
              <li>• No email collection – privacy-first</li>
              <li>• No tracking – we don't track you</li>
              <li>• Auto-expiring – data cleans itself up</li>
              <li>• Free forever – no hidden costs</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
