"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import type { SquaresToolPublicData } from "@/lib/types";

function truncateName(name: string, maxLen: number): string {
  if (name.length <= maxLen) return name;
  return name.substring(0, maxLen - 2) + "…";
}

export default function SquaresPageClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const editTokenFromUrl = searchParams.get("edit");
  const [editTokenFromStorage, setEditTokenFromStorage] = useState<string | null>(null);
  const editToken = editTokenFromUrl || editTokenFromStorage;

  const [data, setData] = useState<SquaresToolPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedEdit, setCopiedEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Selection flow state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());
  const [selectionName, setSelectionName] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [takenToast, setTakenToast] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await fetch(`/api/squares/${slug}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Board not found");
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setEditTokenFromStorage(localStorage.getItem(`squares_editor_${slug}`));
  }, [slug]);

  useEffect(() => {
    if (editTokenFromUrl && slug) {
      localStorage.setItem(`squares_editor_${slug}`, editTokenFromUrl);
      setEditTokenFromStorage(editTokenFromUrl);
    }
  }, [editTokenFromUrl, slug]);

  const isEditor = editToken && data && (() => {
    const stored = localStorage.getItem(`squares_editor_${slug}`);
    return stored === editToken;
  })();

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

  const handleStartSelection = () => {
    setShowNameModal(true);
    setSelectionMode(false);
    setSelectedIndexes(new Set());
    setSelectionName("");
    setClaimError(null);
  };

  const handleNameSubmit = () => {
    if (!selectionName.trim()) return;
    setShowNameModal(false);
    setSelectionMode(true);
    setSelectedIndexes(new Set());
    setClaimError(null);
  };

  const toggleSquare = (index: number) => {
    if (!data || !selectionMode) return;
    const name = data.squares[index];
    if (name != null && name !== "") {
      setTakenToast(`Taken by ${name}`);
      setTimeout(() => setTakenToast(null), 3000);
      return;
    }
    setSelectedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleConfirmSelection = async () => {
    if (!data || selectedIndexes.size === 0 || !selectionName.trim() || isClaiming) return;

    setIsClaiming(true);
    setClaimError(null);
    try {
      const res = await fetch(`/api/squares/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "claim",
          indexes: Array.from(selectedIndexes),
          name: selectionName.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setClaimError(json.details || json.error || "Failed to claim");
        return;
      }
      setSelectionMode(false);
      setSelectedIndexes(new Set());
      await fetchData();
    } catch {
      setClaimError("Failed to claim squares");
    } finally {
      setIsClaiming(false);
    }
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedIndexes(new Set());
  };

  const handleRevealNumbers = async () => {
    if (!data || !isEditor || !editToken || data.numbersRevealed) return;

    try {
      const res = await fetch(`/api/squares/${slug}?edit=${editToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revealNumbers" }),
      });
      if (!res.ok) {
        const json = await res.json();
        alert(json.error || "Failed to reveal numbers");
        return;
      }
      await fetchData();
    } catch {
      alert("Failed to reveal numbers");
    }
  };

  const handleUpdateHostField = async (
    field: "title" | "rowsTeam" | "colsTeam" | "rulesText",
    value: string
  ) => {
    if (!isEditor || !editToken || !data) return;
    try {
      const res = await fetch(`/api/squares/${slug}?edit=${editToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) await fetchData();
    } catch {
      // Silently fail or could add toast
    }
  };

  const handleClearSquare = async (index: number) => {
    if (!isEditor || !editToken) return;
    if (!confirm("Clear this square? The owner will lose their claim.")) return;
    try {
      const res = await fetch(`/api/squares/${slug}?edit=${editToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clearSquare", index }),
      });
      if (res.ok) await fetchData();
    } catch {
      alert("Failed to clear square");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error?.includes("expired") ? "This board has expired" : "Board not found"}</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
  const boardUrl = `${baseUrl}/squares/${slug}`;
  const editUrl = editToken ? `${boardUrl}?edit=${editToken}` : null;

  const filledCount = data.computed.filledCount;
  const isFull = filledCount >= 100;
  const canReveal = !data.numbersRevealed && (isEditor || isFull);

  const rowDigits = data.rowDigits ?? [];
  const colDigits = data.colDigits ?? [];

  return (
    <div className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <Link
            href="/"
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-900 dark:text-gray-100"
          >
            ← Home
          </Link>
          <Link
            href="/tools/squares/create"
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-900 dark:text-gray-100"
          >
            Create another board
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

        {isEditor && (
          <div className="mb-4 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-lg text-sm inline-block">
            Host
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🏈</span>
            <h1 className="text-2xl md:text-3xl font-bold">
              {data.title || "Football Squares"}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600 dark:text-gray-400">
            <span>Rows: <strong>{data.rowsTeam}</strong></span>
            <span>Columns: <strong>{data.colsTeam}</strong></span>
          </div>
        </div>

        {/* Status area */}
        <div className="mb-4 flex flex-wrap gap-3 items-center">
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
            Filled: {filledCount} / 100
          </span>
          {data.numbersRevealed && (
            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 rounded text-sm">
              Numbers revealed (locked)
            </span>
          )}
        </div>

        {/* Host settings panel */}
        {isEditor && showSettings && (
          <div className="mb-6 p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
            <h3 className="font-semibold mb-4">Board Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  defaultValue={data.title}
                  onBlur={(e) => handleUpdateHostField("title", e.target.value.trim())}
                  placeholder="e.g., Super Bowl LVIII"
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Rows team</label>
                  <input
                    type="text"
                    defaultValue={data.rowsTeam}
                    onBlur={(e) => handleUpdateHostField("rowsTeam", e.target.value.trim() || "Patriots")}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Columns team</label>
                  <input
                    type="text"
                    defaultValue={data.colsTeam}
                    onBlur={(e) => handleUpdateHostField("colsTeam", e.target.value.trim() || "Seahawks")}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rules</label>
                <textarea
                  defaultValue={data.rulesText}
                  onBlur={(e) => handleUpdateHostField("rulesText", e.target.value.trim() || "Each quarter is 1/5 the pot. Final score is 2/5 the pot")}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* Claim button and Show Numbers */}
        <div className="mb-4 flex gap-3 flex-wrap">
          {!selectionMode && (
            <button
              onClick={handleStartSelection}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Claim squares
            </button>
          )}
          {canReveal && (
            <button
              onClick={handleRevealNumbers}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
            >
              Show Numbers
            </button>
          )}
        </div>

        {/* Name modal */}
        {showNameModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-xl">
              <h3 className="text-lg font-semibold mb-3">Your name</h3>
              <input
                type="text"
                value={selectionName}
                onChange={(e) => setSelectionName(e.target.value)}
                placeholder="Enter your name"
                maxLength={50}
                autoFocus
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg mb-4 bg-white dark:bg-gray-800"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleNameSubmit}
                  disabled={!selectionName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"
                >
                  Continue
                </button>
                <button
                  onClick={() => {
                    setShowNameModal(false);
                    setSelectionName("");
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selection mode bar */}
        {selectionMode && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm mb-2">
              Click available squares to select. Then confirm or cancel.
            </p>
            <p className="text-sm font-medium mb-2">
              {selectedIndexes.size} square{selectedIndexes.size !== 1 ? "s" : ""} selected
            </p>
            {claimError && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">{claimError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleConfirmSelection}
                disabled={selectedIndexes.size === 0 || isClaiming}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"
              >
                {isClaiming ? "Claiming..." : "Confirm selection"}
              </button>
              <button
                onClick={handleCancelSelection}
                disabled={isClaiming}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Taken toast */}
        {takenToast && (
          <div className="mb-4 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 rounded-lg text-sm">
            {takenToast}
          </div>
        )}

        {/* Rules block */}
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900/50">
          <h3 className="font-semibold mb-2">Rules</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {data.rulesText || "Each quarter is 1/5 the pot. Final score is 2/5 the pot"}
          </p>
        </div>

        {/* Grid */}
        <div className="overflow-x-auto mb-8">
          <div className="inline-block min-w-0">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="w-8 h-8 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-center text-xs font-medium" />
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((c) => (
                    <th
                      key={c}
                      className="w-16 h-8 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-center text-sm font-medium"
                    >
                      {data.numbersRevealed && colDigits[c] !== undefined
                        ? colDigits[c]
                        : "?"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((r) => (
                  <tr key={r}>
                    <td className="w-8 h-12 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-center text-sm font-medium">
                      {data.numbersRevealed && rowDigits[r] !== undefined
                        ? rowDigits[r]
                        : "?"}
                    </td>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((c) => {
                      const idx = r * 10 + c;
                      const name = data.squares[idx];
                      const taken = name != null && name !== "";
                      const selected = selectedIndexes.has(idx);
                      const isAvailable = !taken;

                      return (
                        <td
                          key={c}
                          onClick={() => toggleSquare(idx)}
                          className={`
                            w-16 h-12 border border-gray-300 dark:border-gray-600 text-center text-xs p-1
                            ${selectionMode ? "cursor-pointer" : ""}
                            ${taken ? "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200" : ""}
                            ${!taken && !selectionMode ? "bg-white dark:bg-gray-900" : ""}
                            ${selected ? "ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-900/30" : ""}
                            ${!taken && selectionMode ? "hover:bg-blue-50 dark:hover:bg-blue-900/20" : ""}
                          `}
                          title={taken ? `Taken by ${name}` : isAvailable && selectionMode ? "Click to select" : ""}
                        >
                          {taken ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="truncate max-w-full" title={name}>
                                {truncateName(name, 8)}
                              </span>
                              {isEditor && !selectionMode && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClearSquare(idx);
                                  }}
                                  className="text-[10px] text-red-600 dark:text-red-400 hover:underline opacity-70 hover:opacity-100"
                                >
                                  clear
                                </button>
                              )}
                            </div>
                          ) : selected ? (
                            <span className="text-blue-600 dark:text-blue-400">✓</span>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Share section */}
        <div className="mb-8 p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg">
          <h2 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
            Share this board
          </h2>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={boardUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm font-mono text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={() => handleCopy(boardUrl, false)}
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
                  {copiedEdit ? "Copied!" : "Copy host link"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Created: {new Date(data.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
