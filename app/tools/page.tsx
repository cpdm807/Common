// Tool selection page

import Link from "next/link";

interface Tool {
  id: string;
  name: string;
  description: string;
  href: string;
  available: boolean;
}

const tools: Tool[] = [
  {
    id: "availability",
    name: "Availability Heatmap",
    description: "Find the best time to meet",
    href: "/tools/availability/create",
    available: true,
  },
  {
    id: "readiness",
    name: "Readiness",
    description: "Check team readiness",
    href: "#",
    available: false,
  },
  {
    id: "blockers",
    name: "Blockers",
    description: "Identify what's blocking progress",
    href: "#",
    available: false,
  },
  {
    id: "opinions",
    name: "Opinions",
    description: "Gather team opinions",
    href: "#",
    available: false,
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4 inline-block"
          >
            ← Back to home
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Choose a tool
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400">
            Select a tool to get started
          </p>
        </div>

        {/* Tool grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {tools.map((tool) => (
            <div key={tool.id}>
              {tool.available ? (
                <Link
                  href={tool.href}
                  className="block p-6 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors h-full"
                >
                  <h2 className="text-xl font-semibold mb-2">{tool.name}</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {tool.description}
                  </p>
                </Link>
              ) : (
                <div className="p-6 border-2 border-gray-200 dark:border-gray-800 rounded-lg opacity-50 h-full relative">
                  <h2 className="text-xl font-semibold mb-2">{tool.name}</h2>
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
  );
}
