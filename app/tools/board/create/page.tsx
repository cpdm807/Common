"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateBoardPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    template: "agenda" as "agenda" | "retro",
    votingEnabled: true,
    deadline: "" as string | "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    // Validate
    if (!formData.title.trim()) {
      setError("Title is required");
      setIsCreating(false);
      return;
    }

    try {
      // Calculate closeAt if deadline is set
      let closeAt: string | undefined = undefined;
      if (formData.deadline && formData.deadline !== "") {
        const now = new Date();
        const deadlineHours = parseInt(formData.deadline, 10);
        if (!isNaN(deadlineHours) && deadlineHours > 0) {
          const closeDate = new Date(now.getTime() + deadlineHours * 60 * 60 * 1000);
          closeAt = closeDate.toISOString();
        }
      }

      const response = await fetch("/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          template: formData.template,
          votingEnabled: formData.votingEnabled,
          closeAt,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create board");
      }

      const data = await response.json();
      // Store editor token in localStorage for later use
      if (data.editorToken) {
        localStorage.setItem(`board_editor_${data.slug}`, data.editorToken);
      }
      router.push(`/board/${data.slug}`);
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
          <span className="text-4xl">📋</span>
          <h1 className="text-3xl md:text-4xl font-bold">Board</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Create a shared space for items with lightweight voting
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium mb-2"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Team Retrospective"
              maxLength={100}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Template */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Template
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="template"
                  value="agenda"
                  checked={formData.template === "agenda"}
                  onChange={(e) =>
                    setFormData({ ...formData, template: e.target.value as "agenda" | "retro" })
                  }
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Agenda</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Single list of items
                  </div>
                </div>
              </label>
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="template"
                  value="retro"
                  checked={formData.template === "retro"}
                  onChange={(e) =>
                    setFormData({ ...formData, template: e.target.value as "agenda" | "retro" })
                  }
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Retro</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Creates 3 columns: Start, Stop, Continue
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Voting enabled */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.votingEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, votingEnabled: e.target.checked })
                }
                className="mr-2"
              />
              Voting enabled
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Allow participants to vote on items to surface what matters
            </p>
          </div>

          {/* Deadline */}
          <div>
            <label
              htmlFor="deadline"
              className="block text-sm font-medium mb-2"
            >
              How long should the board be open? (optional)
            </label>
            <select
              id="deadline"
              value={formData.deadline}
              onChange={(e) =>
                setFormData({ ...formData, deadline: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No deadline (stays open)</option>
              <option value="1">1 hour</option>
              <option value="12">12 hours</option>
              <option value="24">24 hours (1 day)</option>
              <option value="48">2 days</option>
              <option value="72">3 days</option>
              <option value="96">4 days</option>
              <option value="120">5 days</option>
              <option value="144">6 days</option>
              <option value="168">7 days</option>
            </select>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit button */}
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
