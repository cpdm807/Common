"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import type { PollPublicData } from "@/lib/types";

// Generate random key for browser
function generateRandomKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Format countdown until close
function formatCountdown(closeAt: string): string {
  const now = new Date();
  const close = new Date(closeAt);
  const diff = close.getTime() - now.getTime();

  if (diff <= 0) {
    return "Closed";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `Closes in ${days} day${days !== 1 ? "s" : ""}${hours > 0 ? `, ${hours} hour${hours !== 1 ? "s" : ""}` : ""}`;
  } else if (hours > 0) {
    return `Closes in ${hours} hour${hours !== 1 ? "s" : ""}${minutes > 0 ? `, ${minutes} minute${minutes !== 1 ? "s" : ""}` : ""}`;
  } else {
    return `Closes in ${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }
}

export default function PollPageClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const editToken = searchParams.get("edit");

  const [poll, setPoll] = useState<PollPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voterKey, setVoterKey] = useState<string | null>(null);
  const [voterName, setVoterName] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isVoting, setIsVoting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedEdit, setCopiedEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddOption, setShowAddOption] = useState(false);
  const [newOptionText, setNewOptionText] = useState("");
  const [isAddingOption, setIsAddingOption] = useState(false);

  // Initialize voter key and name from localStorage
  useEffect(() => {
    const storedKey = localStorage.getItem(`poll_voter_${slug}`);
    if (storedKey) {
      setVoterKey(storedKey);
    } else {
      const newKey = generateRandomKey();
      localStorage.setItem(`poll_voter_${slug}`, newKey);
      setVoterKey(newKey);
    }

    // Restore voter name if available
    const storedName = localStorage.getItem(`poll_voter_name_${slug}`);
    if (storedName) {
      setVoterName(storedName);
    }
  }, [slug]);

  // Check if user is editor (store token on first visit with edit param)
  useEffect(() => {
    if (editToken && slug) {
      localStorage.setItem(`poll_editor_${slug}`, editToken);
    }
  }, [editToken, slug]);

  const isEditor = editToken && poll && (() => {
    const storedEditorToken = localStorage.getItem(`poll_editor_${slug}`);
    return storedEditorToken === editToken;
  })();

  // Fetch poll data
  useEffect(() => {
    if (!slug || !voterKey) return;

    const url = new URL(`/api/polls/${slug}`, window.location.origin);
    if (voterKey) {
      url.searchParams.set("voterKey", voterKey);
    }

    fetch(url.toString())
      .then((res) => {
        if (!res.ok) throw new Error("Poll not found");
        return res.json();
      })
      .then((data) => {
        setPoll(data);
        setLoading(false);
        if (data.computed.userVotes) {
          setSelectedOptions(data.computed.userVotes);
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug, voterKey]);

  const handleVote = async () => {
    if (!poll || !voterKey || selectedOptions.length === 0) return;
    if (poll.settings.votingType === "single" && selectedOptions.length > 1) return;

    setIsVoting(true);
    try {
      const response = await fetch(`/api/polls/${slug}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voterKey,
          optionIds: poll.settings.votingType === "single" ? [selectedOptions[0]] : selectedOptions,
          voterName: poll.settings.anonymous ? undefined : voterName.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to vote");
      }

      // Refresh poll data to show results
      const url = new URL(`/api/polls/${slug}`, window.location.origin);
      if (voterKey) {
        url.searchParams.set("voterKey", voterKey);
      }
      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error("Failed to refresh poll data");
      }
      const data = await res.json();
      
      // Store voter name if provided (before updating poll state)
      if (!poll.settings.anonymous && voterName.trim()) {
        localStorage.setItem(`poll_voter_name_${slug}`, voterName.trim());
      }
      
      setPoll(data);
      if (data.computed.userVotes) {
        setSelectedOptions(data.computed.userVotes);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to vote");
    } finally {
      setIsVoting(false);
    }
  };

  const handleAddOption = async () => {
    if (!newOptionText.trim() || !poll || isAddingOption) return;

    // Check for duplicate options
    const trimmedText = newOptionText.trim().toLowerCase();
    const existingOption = poll.computed.options.find(
      (opt) => opt.text.toLowerCase() === trimmedText
    );
    if (existingOption) {
      alert("This option already exists");
      return;
    }

    setIsAddingOption(true);
    try {
      const url = new URL(`/api/polls/${slug}/options`, window.location.origin);
      if (editToken) {
        url.searchParams.set("edit", editToken);
      }

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newOptionText.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add option");
      }

      // Refresh poll data
      const refreshUrl = new URL(`/api/polls/${slug}`, window.location.origin);
      if (voterKey) {
        refreshUrl.searchParams.set("voterKey", voterKey);
      }
      const res = await fetch(refreshUrl.toString());
      const data = await res.json();
      setPoll(data);
      setNewOptionText("");
      setShowAddOption(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add option");
    } finally {
      setIsAddingOption(false);
    }
  };

  const handleCopy = (url: string, isEdit: boolean) => {
    navigator.clipboard.writeText(url).then(() => {
      if (isEdit) {
        setCopiedEdit(true);
        setTimeout(() => setCopiedEdit(false), 2000);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Poll not found</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
  const pollUrl = `${baseUrl}/polls/${slug}`;
  const editUrl = editToken ? `${pollUrl}?edit=${editToken}` : null;

  const canVote = !poll.computed.closed && (!poll.computed.userVoted || poll.settings.allowChangeVote);
  const canChangeVote = poll.computed.userVoted && poll.settings.allowChangeVote && !poll.computed.closed;
  const showResults = poll.computed.resultsVisible;

  return (
    <div className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        {/* Navigation */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <Link
            href="/"
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-900 dark:text-gray-100"
          >
            ← Home
          </Link>
          <Link
            href="/tools/poll/create"
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-900 dark:text-gray-100"
          >
            Create another poll
          </Link>
          {isEditor && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-900 dark:text-gray-100"
            >
              ⚙️ Settings
            </button>
          )}
        </div>

        {/* Editor badge */}
        {isEditor && (
          <div className="mb-4 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-lg text-sm inline-block">
            Editor
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">📊</span>
            <h1 className="text-2xl md:text-3xl font-bold">{poll.question}</h1>
          </div>

          {poll.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">{poll.description}</p>
          )}

          <div className="flex flex-wrap gap-2 items-center text-sm">
            <span
              className={`px-2 py-1 rounded ${
                poll.computed.closed
                  ? "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
              }`}
            >
              {poll.computed.closed ? "Closed" : "Open"}
            </span>
            {poll.closeAt && !poll.computed.closed && (
              <span className="text-gray-600 dark:text-gray-400">
                {formatCountdown(poll.closeAt)}
              </span>
            )}
            {poll.computed.totalVotes > 0 && (
              <span className="text-gray-600 dark:text-gray-400">
                {poll.computed.totalVotes} vote{poll.computed.totalVotes !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Voting section */}
        {canVote && (
          <div className="mb-8 p-6 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
            <h2 className="text-lg font-semibold mb-4">
              {canChangeVote ? "Change your vote" : "Cast your vote"}
            </h2>
            {canChangeVote && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-400">
                You can change your vote. Select your new choice(s) below and click "Update vote".
              </div>
            )}

            {!poll.settings.anonymous && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Your name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={voterName}
                  onChange={(e) => setVoterName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={100}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="space-y-2 mb-4">
              {poll.computed.options.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedOptions.includes(option.id)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                  }`}
                >
                  <input
                    type={poll.settings.votingType === "single" ? "radio" : "checkbox"}
                    checked={selectedOptions.includes(option.id)}
                    onChange={(e) => {
                      if (poll.settings.votingType === "single") {
                        setSelectedOptions([option.id]);
                      } else {
                        if (e.target.checked) {
                          if (poll.settings.maxSelections && selectedOptions.length >= poll.settings.maxSelections) {
                            return;
                          }
                          setSelectedOptions([...selectedOptions, option.id]);
                        } else {
                          setSelectedOptions(selectedOptions.filter((id) => id !== option.id));
                        }
                      }
                    }}
                    className="mr-3"
                  />
                  <span className="flex-1">{option.text}</span>
                </label>
              ))}
            </div>

            {poll.settings.votingType === "multi" && poll.settings.maxSelections && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select up to {poll.settings.maxSelections} option{poll.settings.maxSelections !== 1 ? "s" : ""}
                {selectedOptions.length > 0 && ` (${selectedOptions.length}/${poll.settings.maxSelections})`}
              </p>
            )}

            <button
              onClick={handleVote}
              disabled={
                isVoting ||
                selectedOptions.length === 0 ||
                (!poll.settings.anonymous && !voterName.trim())
              }
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              {isVoting ? (canChangeVote ? "Updating..." : "Voting...") : (canChangeVote ? "Update vote" : "Vote")}
            </button>
          </div>
        )}

        {/* Results section */}
        {showResults && poll.computed.options.length > 0 && (
          <div className="mb-8 p-6 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
            <h2 className="text-lg font-semibold mb-4">Results</h2>
            <div className="space-y-4">
              {poll.computed.options
                .sort((a, b) => b.voteCount - a.voteCount)
                .map((option) => (
                  <div key={option.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{option.text}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {option.voteCount} ({option.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${option.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              Total votes: {poll.computed.totalVotes}
            </p>
          </div>
        )}

        {/* Add option (if allowed) */}
        {(poll.settings.participantsCanAddOptions || isEditor) && 
         !poll.computed.closed && 
         (!poll.computed.userVoted || isEditor) && (
          <div className="mb-8">
            {!showAddOption ? (
              <button
                onClick={() => setShowAddOption(true)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                + Add option
              </button>
            ) : (
              <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
                <input
                  type="text"
                  value={newOptionText}
                  onChange={(e) => setNewOptionText(e.target.value)}
                  placeholder="Enter option text"
                  maxLength={200}
                  disabled={isAddingOption}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 disabled:opacity-50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddOption}
                    disabled={!newOptionText.trim() || isAddingOption}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    {isAddingOption ? "Adding..." : "Add"}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddOption(false);
                      setNewOptionText("");
                    }}
                    disabled={isAddingOption}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Share section */}
        <div className="mb-8 p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg">
          <h2 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Share this poll</h2>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={pollUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm font-mono text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={() => handleCopy(pollUrl, false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
            {isEditor && editUrl && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm font-mono text-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={() => handleCopy(editUrl, true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                >
                  {copiedEdit ? "Copied!" : "Copy edit link"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer metadata */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>Created: {new Date(poll.createdAt).toLocaleString()}</p>
          {poll.computed.closed && poll.closedAt && (
            <p>Closed: {new Date(poll.closedAt).toLocaleString()}</p>
          )}
        </div>
      </div>
    </div>
  );
}
