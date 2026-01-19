"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type {
  BoardPublicData,
  AvailabilitySettings,
  ReadinessSettings,
} from "@/lib/types";
import { getToolConfig } from "@/lib/tools";

export default function BoardPage() {
  const params = useParams();
  const boardId = params?.boardId as string;

  const [board, setBoard] = useState<BoardPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    if (!boardId) return;

    fetch(`/api/boards/${boardId}`)
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
  }, [boardId]);

  const handleCopy = (url: string, isPreview: boolean) => {
    navigator.clipboard.writeText(url).then(() => {
      if (isPreview) {
        setCopiedPreview(true);
        setTimeout(() => setCopiedPreview(false), 2000);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    });
  };

  const handleFeedback = async (sentiment: "up" | "down") => {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: "board",
          boardId,
          toolType: board?.toolType,
          sentiment,
        }),
      });
      setFeedbackSent(true);
    } catch (err) {
      console.error("Error submitting feedback:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Board not found</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const toolConfig = getToolConfig(board.toolType);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
  const boardUrl = `${baseUrl}/b/${boardId}`;
  const previewUrl = `${baseUrl}/m/board/${boardId}`;

  const expiresInDays = Math.ceil(
    (board.expiresAtUserVisible * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        {/* Navigation */}
        <div className="mb-6 flex gap-3">
          <Link
            href="/"
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-900 dark:text-gray-100"
          >
            ← Home
          </Link>
          <Link
            href={toolConfig.createRoute}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-900 dark:text-gray-100"
          >
            Create new board
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{toolConfig.icon}</span>
            <h1 className="text-2xl md:text-3xl font-bold">
              {board.title || toolConfig.displayName}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2 items-center text-sm">
            <span
              className={`px-2 py-1 rounded ${
                board.computed.expired
                  ? "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
              }`}
            >
              {board.computed.expired ? "Expired" : "Open"}
            </span>

            {!board.computed.expired && expiresInDays > 0 && (
              <span className="text-gray-600 dark:text-gray-400">
                Expires in {expiresInDays} day{expiresInDays !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Expired message */}
        {board.computed.expired && (
          <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">
              This board has expired. Data is no longer visible.
            </p>
          </div>
        )}

        {/* Tool-specific content */}
        {board.toolType === "availability" && (
          <AvailabilityBoardContent
            board={board}
            boardId={boardId}
            settings={board.settings as AvailabilitySettings}
          />
        )}

        {board.toolType === "readiness" && (
          <ReadinessBoardContent
            board={board}
            boardId={boardId}
            settings={board.settings as ReadinessSettings}
          />
        )}

        {/* Share link */}
        <div className="mb-8 p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg">
          <h2 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Share this board</h2>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={boardUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm font-mono text-gray-900 dark:text-gray-100"
            />
            <button
              onClick={() => handleCopy(boardUrl, false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded font-medium transition-colors text-gray-900 dark:text-gray-100"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </div>

        {/* Support link */}
        <div className="mb-6 text-center">
          <Link
            href="/support"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            This helped? Keep it free for others.
          </Link>
        </div>

        {/* Feedback widget */}
        <div className="text-center">
          {!feedbackSent ? (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Was this useful?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => handleFeedback("up")}
                  className="text-2xl hover:scale-110 transition-transform"
                  aria-label="Thumbs up"
                >
                  👍
                </button>
                <button
                  onClick={() => handleFeedback("down")}
                  className="text-2xl hover:scale-110 transition-transform"
                  aria-label="Thumbs down"
                >
                  👎
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Thanks for your feedback!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Availability board content component
function AvailabilityBoardContent({
  board,
  boardId,
  settings,
}: {
  board: BoardPublicData;
  boardId: string;
  settings: AvailabilitySettings;
}) {
  return (
    <>
      {/* Best windows (if not expired) */}
      {!board.computed.expired &&
        board.computed.bestWindows &&
        board.computed.bestWindows.length > 0 && (
          <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h2 className="font-semibold mb-3 text-lg text-gray-900 dark:text-gray-100">
              Best windows
            </h2>
            <div className="space-y-2">
              {board.computed.bestWindows.slice(0, 3).map((window, idx) => {
                const dayLabel = getDayLabel(window.dayIndex, settings);
                const startTime = slotIndexToTimeString(
                  window.startSlotIndex,
                  settings
                );
                const endTime = slotIndexToTimeString(
                  window.endSlotIndex,
                  settings
                );

                return (
                  <div key={idx} className="text-gray-900 dark:text-gray-100">
                    <span className="font-medium">
                      {dayLabel} {startTime}–{endTime}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      ({window.availableCount}/{board.computed.contributorsCount}{" "}
                      people)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Add your availability button */}
      {!board.computed.expired && (
        <div className="mb-8">
          <Link
            href={`/b/${boardId}/add`}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Add your availability
          </Link>
        </div>
      )}

      {/* Heatmap */}
      {!board.computed.expired &&
        board.computed.slotCounts &&
        board.computed.contributors && (
          <div className="mb-8">
            <div className="mb-4">
              <h2 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                Availability heatmap
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click on any cell to see who's available
              </p>
            </div>

            <Heatmap
              slotCounts={board.computed.slotCounts}
              settings={settings}
              contributorsCount={board.computed.contributorsCount}
              contributors={board.computed.contributors}
            />
          </div>
        )}

      {/* Contributors list */}
      {!board.computed.expired &&
        board.computed.contributors &&
        board.computed.contributors.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100">
              Contributors
            </h2>
            <div className="flex flex-wrap gap-3">
              {board.computed.contributors.map((contributor) => (
                <div
                  key={contributor.contributionId}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
                >
                  <span className="font-medium">
                    {contributor.name || "Anonymous"}
                  </span>
                  <Link
                    href={`/b/${boardId}/add?edit=${contributor.contributionId}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
    </>
  );
}

// Readiness board content component
function ReadinessBoardContent({
  board,
  boardId,
  settings,
}: {
  board: BoardPublicData;
  boardId: string;
  settings: ReadinessSettings;
}) {
  // Helper to get color based on readiness value (0-100 scale normalized)
  const getReadinessColor = (value: number, min: number, max: number) => {
    // Normalize to 0-100 scale
    const normalized = ((value - min) / (max - min)) * 100;
    if (normalized >= 80) return "bg-green-500 dark:bg-green-600";
    if (normalized >= 60) return "bg-lime-500 dark:bg-lime-600";
    if (normalized >= 40) return "bg-yellow-400 dark:bg-yellow-600";
    if (normalized >= 20) return "bg-orange-400 dark:bg-orange-600";
    return "bg-red-400 dark:bg-red-600";
  };

  const getReadinessTextColor = (value: number, min: number, max: number) => {
    const normalized = ((value - min) / (max - min)) * 100;
    if (normalized >= 80) return "text-green-700 dark:text-green-400";
    if (normalized >= 60) return "text-lime-700 dark:text-lime-400";
    if (normalized >= 40) return "text-yellow-700 dark:text-yellow-400";
    if (normalized >= 20) return "text-orange-700 dark:text-orange-400";
    return "text-red-700 dark:text-red-400";
  };

  const getBucketColor = (bucketRange: string, min: number, max: number) => {
    // Parse range like "0-20" or "81-100"
    const [rangeMin, rangeMax] = bucketRange.split("-").map(Number);
    const midPoint = (rangeMin + rangeMax) / 2;
    return getReadinessColor(midPoint, min, max);
  };

  const getReadinessBgOpacity = (value: number, min: number, max: number) => {
    const normalized = ((value - min) / (max - min)) * 100;
    if (normalized >= 80) return "bg-green-500/10 dark:bg-green-600/20";
    if (normalized >= 60) return "bg-lime-500/10 dark:bg-lime-600/20";
    if (normalized >= 40) return "bg-yellow-400/10 dark:bg-yellow-600/20";
    if (normalized >= 20) return "bg-orange-400/10 dark:bg-orange-600/20";
    return "bg-red-400/10 dark:bg-red-600/20";
  };

  const getReadinessBorderColor = (value: number, min: number, max: number) => {
    const normalized = ((value - min) / (max - min)) * 100;
    if (normalized >= 80) return "border-green-500/30 dark:border-green-600/30";
    if (normalized >= 60) return "border-lime-500/30 dark:border-lime-600/30";
    if (normalized >= 40) return "border-yellow-400/30 dark:border-yellow-600/30";
    if (normalized >= 20) return "border-orange-400/30 dark:border-orange-600/30";
    return "border-red-400/30 dark:border-red-600/30";
  };

  return (
    <>
      {/* Primary summary */}
      {!board.computed.expired &&
        board.computed.averageReadiness !== undefined && (
          <div
            className={`mb-8 p-6 border rounded-lg ${getReadinessBgOpacity(
              board.computed.averageReadiness,
              settings.scaleMin,
              settings.scaleMax
            )} ${getReadinessBorderColor(
              board.computed.averageReadiness,
              settings.scaleMin,
              settings.scaleMax
            )}`}
          >
            <h2
              className={`font-semibold mb-2 text-2xl ${getReadinessTextColor(
                board.computed.averageReadiness,
                settings.scaleMin,
                settings.scaleMax
              )}`}
            >
              Team pulse: {board.computed.averageReadiness}
              {settings.scaleMax === 100 ? "%" : ""}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              ({board.computed.contributorsCount}{" "}
              {board.computed.contributorsCount === 1 ? "person" : "people"})
            </p>
            {settings.prompt && (
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 italic">
                {settings.prompt}
              </p>
            )}
          </div>
        )}

      {/* Secondary insights with range visualization */}
      {!board.computed.expired &&
        board.computed.averageReadiness !== undefined &&
        board.computed.contributorsCount > 0 && (
          <div className="mb-8 p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg">
            <h2 className="font-semibold mb-4 text-lg text-gray-900 dark:text-gray-100">
              Insights
            </h2>

            {/* Range visualization */}
            {board.computed.minReadiness !== undefined &&
              board.computed.maxReadiness !== undefined && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>{settings.leftLabel}</span>
                    <span>{settings.rightLabel}</span>
                  </div>
                  <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    {/* Colored gradient background using CSS variables */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400 via-orange-400 via-yellow-400 via-lime-500 to-green-500 dark:from-red-600 dark:via-orange-600 dark:via-yellow-600 dark:via-lime-600 dark:to-green-600" />
                    {/* Min marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-gray-900 dark:bg-gray-100"
                      style={{
                        left: `${
                          ((board.computed.minReadiness - settings.scaleMin) /
                            (settings.scaleMax - settings.scaleMin)) *
                          100
                        }%`,
                      }}
                    />
                    {/* Max marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-gray-900 dark:bg-gray-100"
                      style={{
                        left: `${
                          ((board.computed.maxReadiness - settings.scaleMin) /
                            (settings.scaleMax - settings.scaleMin)) *
                          100
                        }%`,
                      }}
                    />
                    {/* Average marker */}
                    {board.computed.averageReadiness !== undefined && (
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-100 rounded-full"
                        style={{
                          left: `${
                            ((board.computed.averageReadiness -
                              settings.scaleMin) /
                              (settings.scaleMax - settings.scaleMin)) *
                            100
                          }%`,
                          transform: "translateX(-50%)",
                        }}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      Min: {board.computed.minReadiness}
                      {settings.scaleMax === 100 ? "%" : ""}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Avg: {board.computed.averageReadiness}
                      {settings.scaleMax === 100 ? "%" : ""}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Max: {board.computed.maxReadiness}
                      {settings.scaleMax === 100 ? "%" : ""}
                    </span>
                  </div>
                </div>
              )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {board.computed.medianReadiness !== undefined && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Median:{" "}
                  </span>
                  <span
                    className={`font-medium ${getReadinessTextColor(
                      board.computed.medianReadiness,
                      settings.scaleMin,
                      settings.scaleMax
                    )}`}
                  >
                    {board.computed.medianReadiness}
                    {settings.scaleMax === 100 ? "%" : ""}
                  </span>
                </div>
              )}
              {board.computed.belowThresholdCount !== undefined && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Below 60%:{" "}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {board.computed.belowThresholdCount}{" "}
                    {board.computed.belowThresholdCount === 1
                      ? "person"
                      : "people"}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Distribution visualization */}
      {!board.computed.expired &&
        board.computed.distributionBuckets &&
        board.computed.distributionBuckets.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold mb-4 text-lg text-gray-900 dark:text-gray-100">
              Distribution
            </h2>
            <div className="space-y-3">
              {board.computed.distributionBuckets.map((bucket, idx) => {
                const maxCount = Math.max(
                  ...board.computed.distributionBuckets!.map((b) => b.count)
                );
                const widthPercent =
                  maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;
                const bucketColor = getBucketColor(
                  bucket.range,
                  settings.scaleMin,
                  settings.scaleMax
                );

                return (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-20 text-sm text-gray-600 dark:text-gray-400">
                      {bucket.range}
                      {settings.scaleMax === 100 ? "%" : ""}
                    </div>
                    <div className="flex-1">
                      <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                        <div
                          className={`h-full ${bucketColor} transition-all`}
                          style={{ width: `${widthPercent}%` }}
                        />
                        {bucket.count > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-900 dark:text-gray-100">
                            {bucket.count}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Add your pulse button */}
      {!board.computed.expired && (
        <div className="mb-8">
          <Link
            href={`/b/${boardId}/add`}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Add your pulse
          </Link>
        </div>
      )}

      {/* Contributors list */}
      {!board.computed.expired &&
        board.computed.readinessContributors &&
        board.computed.readinessContributors.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100">
              Contributors
            </h2>
            <div className="space-y-2">
              {board.computed.readinessContributors.map((contributor, idx) => (
                <div
                  key={contributor.contributionId}
                  className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg"
                >
                  <span className="text-gray-900 dark:text-gray-100">
                    {contributor.name || `Person ${idx + 1}`}
                  </span>
                  <div className="flex items-center gap-4">
                    <span
                      className={`font-medium ${getReadinessTextColor(
                        contributor.readiness,
                        settings.scaleMin,
                        settings.scaleMax
                      )}`}
                    >
                      {contributor.readiness}
                      {settings.scaleMax === 100 ? "%" : ""}
                    </span>
                    <Link
                      href={`/b/${boardId}/add?edit=${contributor.contributionId}`}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </>
  );
}

// Heatmap component
function Heatmap({
  slotCounts,
  settings,
  contributorsCount,
  contributors,
}: {
  slotCounts: number[];
  settings: AvailabilitySettings;
  contributorsCount: number;
  contributors: Array<{
    contributionId: string;
    name?: string;
    selectedSlots?: number[];
  }>;
}) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const slotsPerDay = computeSlotsPerDay(settings);
  const days = settings.days;

  // Generate time labels
  const timeLabels: string[] = [];
  for (let i = 0; i < slotsPerDay; i++) {
    const minutesFromStart = i * settings.slotMinutes;
    const hour = settings.dayStart + Math.floor(minutesFromStart / 60);
    const minute = minutesFromStart % 60;
    
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour < 12 ? "AM" : "PM";
    
    timeLabels.push(`${hour12}:${minute.toString().padStart(2, "0")} ${period}`);
  }

  // Get color for cell
  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-100 dark:bg-gray-800";
    const ratio = count / contributorsCount;
    if (ratio === 1.0) return "bg-green-500 dark:bg-green-600";
    if (ratio >= 0.75) return "bg-lime-500 dark:bg-lime-600";
    if (ratio >= 0.5) return "bg-yellow-400 dark:bg-yellow-600";
    if (ratio >= 0.25) return "bg-orange-400 dark:bg-orange-600";
    return "bg-red-400 dark:bg-red-600";
  };

  // Get who's available for a slot
  const getAvailableContributors = (slotIdx: number) => {
    const available: string[] = [];
    const unavailable: string[] = [];
    
    contributors.forEach((contributor) => {
      const isAvailable = contributor.selectedSlots?.includes(slotIdx);
      if (isAvailable) {
        available.push(contributor.name || "Anonymous");
      } else {
        unavailable.push(contributor.name || "Anonymous");
      }
    });
    
    return { available, unavailable };
  };

  return (
    <>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${days}, minmax(60px, 1fr))` }}>
            {/* Header row */}
            <div className="h-12" />
            {Array.from({ length: days }).map((_, dayIdx) => (
            <div
              key={dayIdx}
              className="text-xs font-medium text-center py-2 sticky top-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 z-10 border-b border-gray-300 dark:border-gray-700"
            >
              {getDayLabel(dayIdx, settings)}
            </div>
            ))}

            {/* Time rows */}
            {timeLabels.map((time, slotIdx) => (
              <div key={`row-${slotIdx}`} className="contents">
                <div
                  className="text-xs text-right pr-2 py-1 text-gray-600 dark:text-gray-400"
                >
                  {time}
                </div>
                {Array.from({ length: days }).map((_, dayIdx) => {
                  const idx = dayIdx * slotsPerDay + slotIdx;
                  const count = slotCounts[idx] || 0;
                  const handleClick = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    console.log('Cell clicked:', idx); // Debug log
                    setSelectedSlot(idx);
                  };
                  return (
                    <button
                      key={`${dayIdx}-${slotIdx}`}
                      type="button"
                      onClick={handleClick}
                      className={`h-8 rounded ${getColor(count)} flex items-center justify-center text-xs font-medium hover:ring-2 hover:ring-blue-500 cursor-pointer transition-all touch-none`}
                      title={`Click to see who's available`}
                    >
                      {count > 0 && count}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs">
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 rounded" />
              <span>None</span>
            </div>
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <div className="w-4 h-4 bg-red-400 dark:bg-red-600 rounded" />
              <span>&lt; 25%</span>
            </div>
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <div className="w-4 h-4 bg-orange-400 dark:bg-orange-600 rounded" />
              <span>25-50%</span>
            </div>
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <div className="w-4 h-4 bg-yellow-400 dark:bg-yellow-600 rounded" />
              <span>50-75%</span>
            </div>
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <div className="w-4 h-4 bg-lime-500 dark:bg-lime-600 rounded" />
              <span>75-99%</span>
            </div>
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <div className="w-4 h-4 bg-green-500 dark:bg-green-600 rounded" />
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slot detail modal */}
      {selectedSlot !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSlot(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {getDayLabel(Math.floor(selectedSlot / slotsPerDay), settings)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {slotIndexToTimeString(selectedSlot, settings)}
                </p>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {(() => {
              const { available, unavailable } = getAvailableContributors(selectedSlot);
              return (
                <div className="space-y-4">
                  {available.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">
                        Available ({available.length})
                      </h4>
                      <ul className="space-y-1">
                        {available.map((name, idx) => (
                          <li key={idx} className="text-sm">
                            ✓ {name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {unavailable.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Unavailable ({unavailable.length})
                      </h4>
                      <ul className="space-y-1">
                        {unavailable.map((name, idx) => (
                          <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                            ✗ {name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}

// Helper functions
function computeSlotsPerDay(settings: AvailabilitySettings): number {
  const hoursPerDay = settings.dayEnd - settings.dayStart;
  return (hoursPerDay * 60) / settings.slotMinutes;
}

function slotIndexToTimeString(
  slotIndex: number,
  settings: AvailabilitySettings
): string {
  const slotsPerDay = computeSlotsPerDay(settings);
  const slotInDay = slotIndex % slotsPerDay;
  const minutesFromDayStart = slotInDay * settings.slotMinutes;
  const hour = settings.dayStart + Math.floor(minutesFromDayStart / 60);
  const minute = minutesFromDayStart % 60;
  
  // Convert to 12-hour format with AM/PM
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const period = hour < 12 ? "AM" : "PM";
  const minuteStr = minute.toString().padStart(2, "0");
  
  return `${hour12}:${minuteStr} ${period}`;
}

function getDayLabel(dayIndex: number, settings: AvailabilitySettings): string {
  const startDate = new Date(settings.startDate);
  const targetDate = new Date(startDate);
  targetDate.setDate(startDate.getDate() + dayIndex);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[targetDate.getDay()]} ${months[targetDate.getMonth()]} ${targetDate.getDate()}`;
}
