"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateReadinessPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    prompt: "How ready are we?",
    leftLabel: "Not ready",
    rightLabel: "Fully ready",
    scaleMin: 0,
    scaleMax: 100,
    step: 5,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolType: "readiness",
          title: formData.title || undefined,
          settings: {
            prompt: formData.prompt,
            leftLabel: formData.leftLabel,
            rightLabel: formData.rightLabel,
            scaleMin: formData.scaleMin,
            scaleMax: formData.scaleMax,
            step: formData.step,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create board");
      }

      const data = await response.json();
      router.push(`/b/${data.boardId}`);
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
          <span className="text-4xl">🟢</span>
          <h1 className="text-3xl md:text-4xl font-bold">Pulse</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Quick group check-ins on a shared scale
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium mb-2"
            >
              Board title (optional)
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Q4 launch readiness"
              maxLength={100}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Prompt */}
          <div>
            <label
              htmlFor="prompt"
              className="block text-sm font-medium mb-2"
            >
              Question / prompt
            </label>
            <input
              type="text"
              id="prompt"
              value={formData.prompt}
              onChange={(e) =>
                setFormData({ ...formData, prompt: e.target.value })
              }
              placeholder="How ready are we?"
              maxLength={200}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Labels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="leftLabel"
                className="block text-sm font-medium mb-2 flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-600"></span>
                Left label
              </label>
              <input
                type="text"
                id="leftLabel"
                value={formData.leftLabel}
                onChange={(e) =>
                  setFormData({ ...formData, leftLabel: e.target.value })
                }
                placeholder="Not ready"
                maxLength={50}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="rightLabel"
                className="block text-sm font-medium mb-2 flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-600"></span>
                Right label
              </label>
              <input
                type="text"
                id="rightLabel"
                value={formData.rightLabel}
                onChange={(e) =>
                  setFormData({ ...formData, rightLabel: e.target.value })
                }
                placeholder="Fully ready"
                maxLength={50}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Scale settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Scale</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="scaleMin"
                  className="block text-sm font-medium mb-2"
                >
                  Minimum
                </label>
                <input
                  type="number"
                  id="scaleMin"
                  value={formData.scaleMin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      scaleMin: parseInt(e.target.value) || 0,
                    })
                  }
                  min={0}
                  max={formData.scaleMax - 1}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="scaleMax"
                  className="block text-sm font-medium mb-2"
                >
                  Maximum
                </label>
                <input
                  type="number"
                  id="scaleMax"
                  value={formData.scaleMax}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      scaleMax: parseInt(e.target.value) || 100,
                    })
                  }
                  min={formData.scaleMin + 1}
                  max={1000}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="step"
                  className="block text-sm font-medium mb-2"
                >
                  Step
                </label>
                <input
                  type="number"
                  id="step"
                  value={formData.step}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      step: parseInt(e.target.value) || 5,
                    })
                  }
                  min={1}
                  max={formData.scaleMax - formData.scaleMin}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
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
