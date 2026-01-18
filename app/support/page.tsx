"use client";

import { useState } from "react";
import Link from "next/link";

export default function SupportPage() {
  const [copiedVenmo, setCopiedVenmo] = useState(false);

  const venmoUrl = process.env.NEXT_PUBLIC_VENMO_URL || "";
  const venmoHandle = process.env.NEXT_PUBLIC_VENMO_HANDLE || "";

  const handleCopyVenmo = () => {
    if (venmoHandle) {
      navigator.clipboard.writeText(venmoHandle).then(() => {
        setCopiedVenmo(true);
        setTimeout(() => setCopiedVenmo(false), 2000);
      });
    }
  };

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4 inline-block"
        >
          ← Back to home
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold mb-6">
          Support Common
        </h1>

        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Common is a small, privacy-first tool. If it helped, you can support
            hosting costs.
          </p>

          <div className="space-y-4">
            {venmoUrl && (
              <a
                href={venmoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full md:w-auto md:inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-center"
              >
                Support on Venmo
              </a>
            )}

            {venmoHandle && (
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={venmoHandle}
                  readOnly
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-mono text-sm"
                />
                <button
                  onClick={handleCopyVenmo}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                >
                  {copiedVenmo ? "Copied!" : "Copy Venmo"}
                </button>
              </div>
            )}
          </div>

          <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Why support?</h2>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>• Keep Common free for everyone</li>
              <li>• Cover server and database costs</li>
              <li>• Support privacy-first tools</li>
              <li>• No ads, no tracking, no hassle</li>
            </ul>
          </div>

          <p className="mt-8 text-sm text-gray-500 dark:text-gray-500">
            Every contribution helps keep Common running. Thank you!
          </p>
        </div>
      </div>
    </div>
  );
}
