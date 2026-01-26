"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import type { BoardToolPublicData, BoardItemTag } from "@/lib/types";

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

// Get helper text for template
function getHelperText(template: string): string {
  return "Add items your group should see.";
}

// Get participant label
function getParticipantLabel(participantNumber: number): string {
  return `Participant ${participantNumber}`;
}

export default function BoardPageClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const editToken = searchParams.get("edit");

  const [board, setBoard] = useState<BoardToolPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantToken, setParticipantToken] = useState<string | null>(null);
  const [participantNumber, setParticipantNumber] = useState<number>(1);
  const [view, setView] = useState<"board" | "summary">("board");
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState("");
  const [newItemDetails, setNewItemDetails] = useState("");
  const [newItemTag, setNewItemTag] = useState<BoardItemTag | "">("");
  const [newItemColumnId, setNewItemColumnId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTagFilter, setSelectedTagFilter] = useState<BoardItemTag | "">("");

  // Initialize participant token and number from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem(`board_participant_${slug}`);
    const storedNumber = localStorage.getItem(`board_participant_number_${slug}`);
    
    if (storedToken) {
      setParticipantToken(storedToken);
      if (storedNumber) {
        setParticipantNumber(parseInt(storedNumber, 10));
      }
    } else {
      const newToken = generateRandomKey();
      localStorage.setItem(`board_participant_${slug}`, newToken);
      setParticipantToken(newToken);
      
      // Try to get participant number from board stats or use 1
      // For now, we'll use a simple incrementing approach
      const participantCount = parseInt(localStorage.getItem(`board_participant_count_${slug}`) || "0", 10) + 1;
      localStorage.setItem(`board_participant_count_${slug}`, participantCount.toString());
      localStorage.setItem(`board_participant_number_${slug}`, participantCount.toString());
      setParticipantNumber(participantCount);
    }
  }, [slug]);

  // Check if user is editor (store token on first visit with edit param)
  useEffect(() => {
    if (editToken && slug) {
      localStorage.setItem(`board_editor_${slug}`, editToken);
    }
  }, [editToken, slug]);

  const isEditor = editToken && board && (() => {
    const storedEditorToken = localStorage.getItem(`board_editor_${slug}`);
    return storedEditorToken === editToken;
  })();

  // Fetch board data
  useEffect(() => {
    if (!slug || !participantToken) return;

    const url = new URL(`/api/board/${slug}`, window.location.origin);
    if (participantToken) {
      url.searchParams.set("participantToken", participantToken);
    }

    fetch(url.toString())
      .then((res) => {
        if (!res.ok) throw new Error("Board not found");
        return res.json();
      })
      .then((data) => {
        setBoard(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug, participantToken]);

  const refreshBoard = async () => {
    if (!slug || !participantToken) return;

    const url = new URL(`/api/board/${slug}`, window.location.origin);
    if (participantToken) {
      url.searchParams.set("participantToken", participantToken);
    }

    const res = await fetch(url.toString());
    if (res.ok) {
      const data = await res.json();
      setBoard(data);
    }
  };

  const handleAddItem = async () => {
    if (!newItemText.trim() || !board || !participantToken || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const body: any = {
        text: newItemText.trim(),
        createdByToken: participantToken,
      };

      if (newItemDetails.trim()) {
        body.details = newItemDetails.trim();
      }

      if (newItemTag) {
        body.tag = newItemTag;
      }

      if (board.template === "retro" && newItemColumnId) {
        body.columnId = newItemColumnId;
      } else if (board.template === "retro" && !newItemColumnId) {
        alert("Please select a column");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`/api/board/${slug}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add item");
      }

      setNewItemText("");
      setNewItemDetails("");
      setNewItemTag("");
      setNewItemColumnId("");
      setShowAddItem(false);
      await refreshBoard();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditItem = async (itemId: string, text: string, details?: string, tag?: BoardItemTag) => {
    if (!board || !participantToken || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/board/${slug}/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          createdByToken: participantToken,
          text: text.trim(),
          details: details?.trim() || undefined,
          tag: tag || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update item");
      }

      setEditingItemId(null);
      await refreshBoard();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!board || !participantToken || isSubmitting) return;
    if (!confirm("Are you sure you want to delete this item?")) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/board/${slug}/items/${itemId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          createdByToken: participantToken,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete item");
      }

      await refreshBoard();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (itemId: string, voteType: "up" | "down") => {
    if (!board || !participantToken || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/board/${slug}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantToken,
          itemId,
          voteType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to vote");
      }

      await refreshBoard();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to vote");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseBoard = async () => {
    if (!board || !isEditor || !editToken) return;
    if (!confirm("Are you sure you want to close this board?")) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/board/${slug}?edit=${editToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          closedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to close board");
      }

      await refreshBoard();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to close board");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySummary = () => {
    if (!board) return;

    let summary = `${board.title}\n\n`;
    
    if (board.template === "retro") {
      // Group by column
      for (const column of board.computed.columns) {
        summary += `${column.name}:\n`;
        const columnItems = board.computed.items
          .filter((item) => item.columnId === column.id)
          .slice(0, 5); // Top 5 per column
        
        if (columnItems.length === 0) {
          summary += "  (none)\n";
        } else {
          for (const item of columnItems) {
            summary += `  • ${item.text}`;
            if (board.votingEnabled) {
              const netVotes = item.upvoteCount - item.downvoteCount;
              if (netVotes !== 0) {
                summary += ` (${netVotes > 0 ? "+" : ""}${netVotes})`;
              }
            }
            summary += "\n";
          }
        }
        summary += "\n";
      }
    } else {
      // Single list
      const topItems = board.computed.items.slice(0, 10);
      for (const item of topItems) {
        summary += `• ${item.text}`;
        if (board.votingEnabled) {
          const netVotes = item.upvoteCount - item.downvoteCount;
          if (netVotes !== 0) {
            summary += ` (${netVotes > 0 ? "+" : ""}${netVotes})`;
          }
        }
        summary += "\n";
      }
    }

    navigator.clipboard.writeText(summary).then(() => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    });
  };

  const handleCopy = (url: string, isPreview: boolean) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !board) {
    const isExpired = error?.includes("expired");
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            {isExpired ? "This board has expired" : "Board not found"}
          </h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
  const boardUrl = `${baseUrl}/board/${slug}`;
  const editUrl = editToken ? `${boardUrl}?edit=${editToken}` : null;

  const canInteract = !board.computed.closed && !board.computed.expired;

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
            href="/tools/board/create"
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

        {/* Editor badge */}
        {isEditor && (
          <div className="mb-4 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-lg text-sm inline-block">
            Editor
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">📋</span>
            <h1 className="text-2xl md:text-3xl font-bold">{board.title}</h1>
          </div>

          <div className="flex flex-wrap gap-2 items-center text-sm mb-4">
            <span
              className={`px-2 py-1 rounded ${
                board.computed.closed
                  ? "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
              }`}
            >
              {board.computed.closed ? "Closed" : "Open"}
            </span>
            {board.closeAt && !board.computed.closed && (
              <span className="text-gray-600 dark:text-gray-400">
                {formatCountdown(board.closeAt)}
              </span>
            )}
            {board.computed.items.length > 0 && (
              <span className="text-gray-600 dark:text-gray-400">
                {board.computed.items.length} item{board.computed.items.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* View toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setView("board")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                view === "board"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setView("summary")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                view === "summary"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              Summary
            </button>
          </div>
        </div>

        {/* Helper text */}
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
          {getHelperText(board.template)}
        </p>

        {/* Tag filter */}
        {view === "board" && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Filter by tag</label>
            <select
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value as BoardItemTag | "")}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All items</option>
              <option value="Topic">Topic</option>
              <option value="Decision">Decision</option>
              <option value="Question">Question</option>
              <option value="Blocker">Blocker</option>
              <option value="Kudos">Kudos</option>
            </select>
          </div>
        )}

        {/* Settings panel (editor only) */}
        {isEditor && showSettings && (
          <div className="mb-6 p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
            <h3 className="font-semibold mb-4">Board Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={board.votingEnabled}
                    onChange={async (e) => {
                      if (!editToken) return;
                      try {
                        const response = await fetch(`/api/board/${slug}?edit=${editToken}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            votingEnabled: e.target.checked,
                          }),
                        });
                        if (response.ok) {
                          await refreshBoard();
                        }
                      } catch (err) {
                        alert("Failed to update voting setting");
                      }
                    }}
                    className="mr-2"
                  />
                  Voting enabled
                </label>
              </div>
              {!board.computed.closed && (
                <button
                  onClick={handleCloseBoard}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Close board
                </button>
              )}
            </div>
          </div>
        )}

        {/* Board view */}
        {view === "board" && (
          <>
            {/* Add item button (only for agenda template) */}
            {canInteract && board.template === "agenda" && !showAddItem && (
              <div className="mb-6">
                <button
                  onClick={() => {
                    setShowAddItem(true);
                    setNewItemColumnId("");
                  }}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  + Add item
                </button>
              </div>
            )}

            {/* Add item form (shown when showAddItem is true) */}
            {canInteract && showAddItem && (
              <div className="mb-6 p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
                <div className="space-y-4">
                  {board.template === "retro" && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Column <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newItemColumnId}
                        onChange={(e) => setNewItemColumnId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select a column</option>
                        {board.computed.columns.map((col) => (
                          <option key={col.id} value={col.id}>
                            {col.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Text <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="Item text (max 180 chars)"
                      maxLength={180}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Details (optional)
                    </label>
                    <textarea
                      value={newItemDetails}
                      onChange={(e) => setNewItemDetails(e.target.value)}
                      placeholder="Additional details (max 1000 chars)"
                      maxLength={1000}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Tag (optional)
                    </label>
                    <select
                      value={newItemTag}
                      onChange={(e) => setNewItemTag(e.target.value as BoardItemTag | "")}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No tag</option>
                      <option value="Topic">Topic</option>
                      <option value="Decision">Decision</option>
                      <option value="Question">Question</option>
                      <option value="Blocker">Blocker</option>
                      <option value="Kudos">Kudos</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddItem}
                      disabled={!newItemText.trim() || isSubmitting || (board.template === "retro" && !newItemColumnId)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                    >
                      {isSubmitting ? "Adding..." : "Add"}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddItem(false);
                        setNewItemText("");
                        setNewItemDetails("");
                        setNewItemTag("");
                        setNewItemColumnId("");
                      }}
                      disabled={isSubmitting}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Items display */}
            {board.template === "retro" ? (
              // Retro: 3 columns
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {board.computed.columns.map((column) => {
                  const columnItems = board.computed.items.filter(
                    (item) => item.columnId === column.id && (!selectedTagFilter || item.tag === selectedTagFilter)
                  );
                  return (
                    <div key={column.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-white dark:bg-gray-900">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">{column.name}</h3>
                        {canInteract && (
                          <button
                            onClick={() => {
                              setShowAddItem(true);
                              setNewItemColumnId(column.id);
                            }}
                            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                      {columnItems.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-500">No items yet</p>
                      ) : (
                        <div className="space-y-3">
                          {columnItems.map((item) => (
                            <ItemCard
                              key={item.id}
                              item={item}
                              board={board}
                              participantToken={participantToken}
                              canInteract={canInteract}
                              onVoteUp={() => handleVote(item.id, "up")}
                              onVoteDown={() => handleVote(item.id, "down")}
                              onEdit={(text, details, tag) => handleEditItem(item.id, text, details, tag)}
                              onDelete={() => handleDeleteItem(item.id)}
                              editingItemId={editingItemId}
                              setEditingItemId={setEditingItemId}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Agenda: single list
              <div className="space-y-3 mb-8">
                {board.computed.items.filter((item) => !selectedTagFilter || item.tag === selectedTagFilter).length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-500 text-center py-8">
                    No items yet. Be the first to add one!
                  </p>
                ) : (
                  board.computed.items
                    .filter((item) => !selectedTagFilter || item.tag === selectedTagFilter)
                    .map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        board={board}
                        participantToken={participantToken}
                        canInteract={canInteract}
                        onVoteUp={() => handleVote(item.id, "up")}
                        onVoteDown={() => handleVote(item.id, "down")}
                        onEdit={(text, details, tag) => handleEditItem(item.id, text, details, tag)}
                        onDelete={() => handleDeleteItem(item.id)}
                        editingItemId={editingItemId}
                        setEditingItemId={setEditingItemId}
                      />
                    ))
                )}
              </div>
            )}
          </>
        )}

        {/* Summary view */}
        {view === "summary" && (
          <div className="mb-8">
            <div className="mb-4">
              <button
                onClick={handleCopySummary}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {copiedSummary ? "Copied!" : "Copy summary"}
              </button>
            </div>

            {board.template === "retro" ? (
              <div className="space-y-6">
                {board.computed.columns.map((column) => {
                  const columnItems = board.computed.items
                    .filter((item) => item.columnId === column.id)
                    .slice(0, 5); // Top 5 per column
                  return (
                    <div key={column.id}>
                      <h3 className="font-semibold mb-2">{column.name}</h3>
                      {columnItems.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-500">(none)</p>
                      ) : (
                        <ul className="list-disc list-inside space-y-1">
                          {columnItems.map((item) => {
                            const netVotes = item.upvoteCount - item.downvoteCount;
                            return (
                              <li key={item.id}>
                                {item.text}
                                {board.votingEnabled && netVotes !== 0 && (
                                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                                    ({netVotes > 0 ? "+" : ""}{netVotes})
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <ul className="list-disc list-inside space-y-2">
                {board.computed.items.slice(0, 10).map((item) => {
                  const netVotes = item.upvoteCount - item.downvoteCount;
                  return (
                    <li key={item.id}>
                      {item.text}
                      {board.votingEnabled && netVotes !== 0 && (
                        <span className="text-gray-600 dark:text-gray-400 ml-2">
                          ({netVotes > 0 ? "+" : ""}{netVotes})
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Share section */}
        <div className="mb-8 p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg">
          <h2 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Share this board</h2>
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
                  onClick={() => handleCopy(editUrl, false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                >
                  {copied ? "Copied!" : "Copy edit link"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer metadata */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>Created: {new Date(board.createdAt).toLocaleString()}</p>
          {board.computed.closed && board.closedAt && (
            <p>Closed: {new Date(board.closedAt).toLocaleString()}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Item card component
function ItemCard({
  item,
  board,
  participantToken,
  canInteract,
  onVoteUp,
  onVoteDown,
  onEdit,
  onDelete,
  editingItemId,
  setEditingItemId,
}: {
  item: BoardToolPublicData["computed"]["items"][0];
  board: BoardToolPublicData;
  participantToken: string | null;
  canInteract: boolean;
  onVoteUp: () => void;
  onVoteDown: () => void;
  onEdit: (text: string, details?: string, tag?: BoardItemTag) => void;
  onDelete: () => void;
  editingItemId: string | null;
  setEditingItemId: (id: string | null) => void;
}) {
  const [editText, setEditText] = useState(item.text);
  const [editDetails, setEditDetails] = useState(item.details || "");
  const [editTag, setEditTag] = useState<BoardItemTag | "">(item.tag || "");
  const [showDetails, setShowDetails] = useState(false);

  const isEditing = editingItemId === item.id;

  if (isEditing) {
    return (
      <div className="p-4 border-2 border-blue-500 rounded-lg bg-white dark:bg-gray-900">
        <div className="space-y-3">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            maxLength={180}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            value={editDetails}
            onChange={(e) => setEditDetails(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Details (optional)"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={editTag}
            onChange={(e) => setEditTag(e.target.value as BoardItemTag | "")}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No tag</option>
            <option value="Topic">Topic</option>
            <option value="Decision">Decision</option>
            <option value="Question">Question</option>
            <option value="Blocker">Blocker</option>
            <option value="Kudos">Kudos</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onEdit(editText, editDetails || undefined, editTag || undefined);
              }}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditingItemId(null);
                setEditText(item.text);
                setEditDetails(item.details || "");
                setEditTag(item.tag || "");
              }}
              className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium">{item.text}</p>
            {item.tag && (
              <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">
                {item.tag}
              </span>
            )}
          </div>
          {item.details && (
            <div className="mt-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showDetails ? "Hide details" : "Show details"}
              </button>
              {showDetails && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {item.details}
                </p>
              )}
            </div>
          )}
          <div className="flex items-center gap-3 mt-2 text-sm">
            {board.votingEnabled && (
              <div className="flex items-center gap-2">
                <button
                  onClick={onVoteUp}
                  disabled={!canInteract}
                  className={`flex items-center gap-1 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    item.userVote === "up"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span>👍</span>
                  <span>{item.upvoteCount}</span>
                </button>
                <button
                  onClick={onVoteDown}
                  disabled={!canInteract}
                  className={`flex items-center gap-1 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    item.userVote === "down"
                      ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span>👎</span>
                  <span>{item.downvoteCount}</span>
                </button>
              </div>
            )}
          </div>
        </div>
        {item.userCanEdit && canInteract && (
          <div className="flex gap-1">
            <button
              onClick={() => setEditingItemId(item.id)}
              className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
