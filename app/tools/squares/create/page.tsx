"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const DEFAULT_RULES = "Each quarter is 1/5 the pot. Final score is 2/5 the pot";

export default function CreateSquaresPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    rowsTeam: "Patriots",
    colsTeam: "Seahawks",
    rulesText: DEFAULT_RULES,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/squares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim() || undefined,
          rowsTeam: formData.rowsTeam.trim() || "Patriots",
          colsTeam: formData.colsTeam.trim() || "Seahawks",
          rulesText: formData.rulesText.trim() || DEFAULT_RULES,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create board");
      }

      const data = await response.json();
      if (data.editorToken) {
        localStorage.setItem(`squares_editor_${data.slug}`, data.editorToken);
      }
      router.push(`/squares/${data.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsCreating(false);
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

        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🏈</span>
          <h1 className="text-3xl md:text-4xl font-bold">Football Squares</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Create a 10x10 board. Share the link. Claim squares. Reveal numbers when full.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title (optional)
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Super Bowl LVIII"
              maxLength={100}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="rowsTeam" className="block text-sm font-medium mb-2">
                Rows team
              </label>
              <input
                type="text"
                id="rowsTeam"
                value={formData.rowsTeam}
                onChange={(e) =>
                  setFormData({ ...formData, rowsTeam: e.target.value })
                }
                placeholder="Patriots"
                maxLength={50}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="colsTeam" className="block text-sm font-medium mb-2">
                Columns team
              </label>
              <input
                type="text"
                id="colsTeam"
                value={formData.colsTeam}
                onChange={(e) =>
                  setFormData({ ...formData, colsTeam: e.target.value })
                }
                placeholder="Seahawks"
                maxLength={50}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="rulesText" className="block text-sm font-medium mb-2">
              Rules
            </label>
            <textarea
              id="rulesText"
              value={formData.rulesText}
              onChange={(e) =>
                setFormData({ ...formData, rulesText: e.target.value })
              }
              placeholder={DEFAULT_RULES}
              rows={3}
              maxLength={500}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isCreating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            {isCreating ? "Creating..." : "Create board"}
          </button>
        </form>
      </div>
    </div>
  );
}
