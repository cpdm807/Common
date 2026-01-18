"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateAvailabilityPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Calculate default date range (next 7 days starting today)
  const today = new Date();
  const formattedToday = today.toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    title: "",
    tz: userTimezone,
    startDate: formattedToday,
    days: 7,
    dayStart: 8,
    dayEnd: 20,
    slotMinutes: 30,
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
          toolType: "availability",
          title: formData.title || undefined,
          settings: {
            tz: formData.tz,
            startDate: formData.startDate,
            days: formData.days,
            dayStart: formData.dayStart,
            dayEnd: formData.dayEnd,
            slotMinutes: formData.slotMinutes,
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
          href="/tools"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4 inline-block"
        >
          ← Back to tools
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Availability Heatmap
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          When can we meet?
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
              placeholder="e.g., Team sync"
              maxLength={100}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Timezone */}
          <div>
            <label
              htmlFor="tz"
              className="block text-sm font-medium mb-2"
            >
              Timezone
            </label>
            <input
              type="text"
              id="tz"
              value={formData.tz}
              onChange={(e) =>
                setFormData({ ...formData, tz: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              IANA timezone (e.g., America/New_York)
            </p>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium mb-2"
              >
                Start date
              </label>
              <input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="days"
                className="block text-sm font-medium mb-2"
              >
                Number of days
              </label>
              <input
                type="number"
                id="days"
                value={formData.days}
                onChange={(e) =>
                  setFormData({ ...formData, days: parseInt(e.target.value) })
                }
                min={1}
                max={30}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Daily hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="dayStart"
                className="block text-sm font-medium mb-2"
              >
                Day start (hour)
              </label>
              <input
                type="number"
                id="dayStart"
                value={formData.dayStart}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dayStart: parseInt(e.target.value),
                  })
                }
                min={0}
                max={23}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="dayEnd"
                className="block text-sm font-medium mb-2"
              >
                Day end (hour)
              </label>
              <input
                type="number"
                id="dayEnd"
                value={formData.dayEnd}
                onChange={(e) =>
                  setFormData({ ...formData, dayEnd: parseInt(e.target.value) })
                }
                min={1}
                max={24}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Slot size */}
          <div>
            <label
              htmlFor="slotMinutes"
              className="block text-sm font-medium mb-2"
            >
              Time slot size
            </label>
            <select
              id="slotMinutes"
              value={formData.slotMinutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  slotMinutes: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
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
