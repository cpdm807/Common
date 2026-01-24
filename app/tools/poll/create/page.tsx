"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreatePollPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    question: "",
    description: "",
    options: ["", ""],
    votingType: "single" as "single" | "multi",
    participantsCanAddOptions: false,
    allowChangeVote: false,
    deadline: "" as string | "",
  });

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, ""],
    });
  };

  const removeOption = (index: number) => {
    if (formData.options.length <= 2) return;
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    // Validate
    if (!formData.question.trim()) {
      setError("Question is required");
      setIsCreating(false);
      return;
    }

    const validOptions = formData.options.filter((opt) => opt.trim().length > 0);
    if (validOptions.length < 2) {
      setError("At least 2 options are required");
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

      const response = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: formData.question.trim(),
          description: formData.description.trim() || undefined,
          options: validOptions.map((opt) => opt.trim()),
          settings: {
            votingType: formData.votingType,
            participantsCanAddOptions: formData.participantsCanAddOptions,
            allowChangeVote: formData.allowChangeVote,
            closeAt,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create poll");
      }

      const data = await response.json();
      // Store editor token in localStorage for later use
      if (data.editorToken) {
        localStorage.setItem(`poll_editor_${data.slug}`, data.editorToken);
      }
      router.push(`/polls/${data.slug}`);
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
          <span className="text-4xl">📊</span>
          <h1 className="text-3xl md:text-4xl font-bold">Poll</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Create a shareable poll via a single link
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question */}
          <div>
            <label
              htmlFor="question"
              className="block text-sm font-medium mb-2"
            >
              Question <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="question"
              value={formData.question}
              onChange={(e) =>
                setFormData({ ...formData, question: e.target.value })
              }
              placeholder="e.g., What should we have for lunch?"
              maxLength={500}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-2"
            >
              Description (optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Add context or instructions..."
              maxLength={1000}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Options <span className="text-red-500">*</span> (at least 2)
            </label>
            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    maxLength={200}
                    required={index < 2}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              + Add option
            </button>
          </div>

          {/* Voting Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Voting Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="votingType"
                  value="single"
                  checked={formData.votingType === "single"}
                  onChange={(e) =>
                    setFormData({ ...formData, votingType: e.target.value as "single" | "multi" })
                  }
                  className="mr-2"
                />
                Single choice (one option)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="votingType"
                  value="multi"
                  checked={formData.votingType === "multi"}
                  onChange={(e) =>
                    setFormData({ ...formData, votingType: e.target.value as "single" | "multi" })
                  }
                  className="mr-2"
                />
                Multiple choice
              </label>
            </div>
          </div>

          {/* Participants can add options */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.participantsCanAddOptions}
                onChange={(e) =>
                  setFormData({ ...formData, participantsCanAddOptions: e.target.checked })
                }
                className="mr-2"
              />
              Allow voters to add options
            </label>
          </div>

          {/* Allow change vote */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.allowChangeVote}
                onChange={(e) =>
                  setFormData({ ...formData, allowChangeVote: e.target.checked })
                }
                className="mr-2"
              />
              Allow voters to change their votes
            </label>
          </div>

          {/* Deadline */}
          <div>
            <label
              htmlFor="deadline"
              className="block text-sm font-medium mb-2"
            >
              How long should the poll be open? (optional)
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
            {isCreating ? "Creating..." : "Create poll"}
          </button>
        </form>
      </div>
    </div>
  );
}
