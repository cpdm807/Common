// Landing page with integrated tool selection

import type { Metadata } from "next";
import Link from "next/link";
import { toolRegistry } from "@/lib/tools";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Common – When things get messy, find what's common",
  description: "Lightweight tools to help groups align without meetings, accounts, or noise. Create polls without accounts, find the best time to meet with an availability link, run team retros, and check readiness—all with simple shareable links.",
  keywords: ["poll without account", "availability link", "team retro", "group decision", "no account voting", "schedule meeting", "team check-in", "group alignment"],
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: "Common – When things get messy, find what's common",
    description: "Lightweight tools to help groups align without meetings, accounts, or noise. Create polls, find availability, run retros, and check team readiness—all without accounts.",
    url: baseUrl,
    type: "website",
    images: [
      {
        url: `${baseUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "Common – Lightweight tools for group alignment",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Common – When things get messy, find what's common",
    description: "Lightweight tools to help groups align without meetings, accounts, or noise.",
    images: [`${baseUrl}/og.png`],
  },
};

interface Tool {
  id: string;
  name: string;
  description: string;
  href: string;
  available: boolean;
  icon: string;
}

const tools: Tool[] = [
  {
    id: "availability",
    name: toolRegistry.availability.displayName,
    description: toolRegistry.availability.description,
    href: toolRegistry.availability.createRoute,
    available: true,
    icon: toolRegistry.availability.icon,
  },
  {
    id: "readiness",
    name: toolRegistry.readiness.displayName,
    description: toolRegistry.readiness.description,
    href: toolRegistry.readiness.createRoute,
    available: true,
    icon: toolRegistry.readiness.icon,
  },
  {
    id: "poll",
    name: toolRegistry.poll.displayName,
    description: toolRegistry.poll.description,
    href: toolRegistry.poll.createRoute,
    available: true,
    icon: toolRegistry.poll.icon,
  },
  {
    id: "board",
    name: toolRegistry.board.displayName,
    description: toolRegistry.board.description,
    href: toolRegistry.board.createRoute,
    available: true,
    icon: toolRegistry.board.icon,
  },
];

export default function HomePage() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Common",
    url: baseUrl,
    description: "Lightweight tools to help groups align without meetings, accounts, or noise.",
    sameAs: [],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Common",
    url: baseUrl,
    description: "Lightweight tools to help groups align without meetings, accounts, or noise.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <div className="min-h-screen flex flex-col">
        {/* Main content */}
        <main className="flex-1 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
              When things get messy, find what&rsquo;s common
            </h1>
            
            <p className="text-xl md:text-2xl mb-4 text-gray-600 dark:text-gray-400">
              Make the common ground visible.
            </p>
            {/*
            <p className="text-base md:text-lg mb-8 text-gray-500 dark:text-gray-500">
              Lightweight tools to help groups align without meetings, accounts, or noise.
            </p> */}
          </div>

          {/* Tool selection */}
          <div>
            <h2 className="text-xl font-semibold mb-6 text-center text-gray-500 dark:text-gray-500">Choose a tool</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {tools.map((tool) => (
                <div key={tool.id}>
                  {tool.available ? (
                    <Link
                      href={tool.href}
                      className="block p-6 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors h-full"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{tool.icon}</span>
                        <h3 className="text-xl font-semibold">{tool.name}</h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        {tool.description}
                      </p>
                    </Link>
                  ) : (
                    <div className="p-6 border-2 border-gray-200 dark:border-gray-800 rounded-lg opacity-50 h-full">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{tool.icon}</span>
                        <h3 className="text-xl font-semibold">{tool.name}</h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {tool.description}
                      </p>
                      <span className="text-sm text-gray-500 dark:text-gray-500 font-medium">
                        Coming soon
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
            No accounts. No email. No tracking.
          </p>
          
          <div className="flex justify-center gap-8 text-sm">
            <Link
              href="/support"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              Support Common
            </Link>
            <Link
              href="/feedback"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              Feedback
            </Link>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
