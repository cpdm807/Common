"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MetricsData {
  totals: {
    totalBoards: number;
    totalContributions: number;
    totalViews: number;
    positiveFeedback: number;
    negativeFeedback: number;
  };
  byTool: Array<{
    toolType: string;
    boardsCreated: number;
    totalContributions: number;
    totalViews: number;
  }>;
  recentBoards: Array<{
    boardId: string;
    toolType?: string;
    title?: string;
    createdAt: string;
    contributions: number;
    views: number;
  }>;
  recentFeedback: Array<{
    sentiment: string;
    comment?: string;
    createdAt: string;
    boardId?: string;
    toolType?: string;
    context?: string;
  }>;
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/metrics")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch metrics");
        return res.json();
      })
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading metrics...</div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error loading metrics</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Common Metrics</h1>
          <Link
            href="/"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            ← Home
          </Link>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
          <StatCard
            title="Total Boards"
            value={metrics.totals.totalBoards}
            icon="📊"
          />
          <StatCard
            title="Total Contributions"
            value={metrics.totals.totalContributions}
            icon="✏️"
          />
          <StatCard
            title="Total Views"
            value={metrics.totals.totalViews}
            icon="👀"
          />
          <StatCard
            title="Positive Feedback"
            value={metrics.totals.positiveFeedback}
            icon="👍"
          />
          <StatCard
            title="Negative Feedback"
            value={metrics.totals.negativeFeedback}
            icon="👎"
          />
        </div>

        {/* By Tool Metrics */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Metrics by Tool</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.byTool.map((tool) => (
              <div
                key={tool.toolType}
                className="p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg"
              >
                <h3 className="font-semibold text-lg mb-3 capitalize">
                  {tool.toolType}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Boards:</span>
                    <span className="font-medium">{tool.boardsCreated}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Contributions:</span>
                    <span className="font-medium">{tool.totalContributions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Views:</span>
                    <span className="font-medium">{tool.totalViews}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {metrics.byTool.length === 0 && (
            <div className="p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-center text-gray-600 dark:text-gray-400">
              No tool usage data yet
            </div>
          )}
        </div>

        {/* Recent Boards */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Recent Boards</h2>
          {metrics.recentBoards.length === 0 ? (
            <div className="p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-center text-gray-600 dark:text-gray-400">
              No boards created yet
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.recentBoards.map((board) => (
                <div
                  key={board.boardId}
                  className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        href={`/b/${board.boardId}`}
                        className="font-medium hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {board.title || "Untitled Board"}
                      </Link>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span className="capitalize">{board.toolType}</span> • Created{" "}
                        {new Date(board.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div>{board.contributions} contributions</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {board.views} views
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Feedback */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Feedback</h2>
          {metrics.recentFeedback.length === 0 ? (
            <div className="p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-center text-gray-600 dark:text-gray-400">
              No feedback received yet
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.recentFeedback.map((feedback, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {feedback.sentiment === "up" ? "👍" : "👎"}
                    </div>
                    <div className="flex-1">
                      {feedback.comment && (
                        <p className="mb-2">{feedback.comment}</p>
                      )}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(feedback.createdAt).toLocaleDateString()} •{" "}
                        {feedback.boardId ? (
                          <Link
                            href={`/b/${feedback.boardId}`}
                            className="hover:underline"
                          >
                            Board
                          </Link>
                        ) : (
                          "Global"
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Note */}
        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-400">
            <strong>Note:</strong> This page is not linked in the main navigation.
            Access it directly at /metrics when needed.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="text-2xl">{icon}</div>
        <div className="text-3xl font-bold">{value.toLocaleString()}</div>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{title}</div>
    </div>
  );
}
