// Landing page

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
            When things get messy, find what&rsquo;s common.
          </h1>
          
          <p className="text-xl md:text-2xl mb-4 text-gray-600 dark:text-gray-400">
            Make the common ground visible.
          </p>
          
          <p className="text-base md:text-lg mb-12 text-gray-500 dark:text-gray-500">
            Lightweight tools to help groups align without meetings, accounts, or noise.
          </p>
          
          <Link
            href="/tools"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
          >
            Get started
          </Link>
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
  );
}
