"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MetricsData {
  totalBoards: number;
  totalContributions: number;
  totalViews: number;
  positiveFeedback: number;
  negativeFeedback: number;
  recentBoards: Array<{
    boardId: string;
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
  }>;
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real implementation, this would fetch from an API endpoint
    // For now, showing placeholder data
    setTimeout(() => {
      setMetrics({
        totalBoards: 0,
        totalContributions: 0,
        totalViews: 0,
        positiveFeedback: 0,
        negativeFeedback: 0,
        recentBoards: [],
        recentFeedback: [],
      });
      setLoading(false);
    }, 500);
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
            value={metrics.totalBoards}
            icon="📊"
          />
          <StatCard
            title="Total Contributions"
            value={metrics.totalContributions}
            icon="✏️"
          />
          <StatCard
            title="Total Views"
            value={metrics.totalViews}
            icon="👀"
          />
          <StatCard
            title="Positive Feedback"
            value={metrics.positiveFeedback}
            icon="👍"
          />
          <StatCard
            title="Negative Feedback"
            value={metrics.negativeFeedback}
            icon="👎"
          />
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
                        Created {new Date(board.createdAt).toLocaleDateString()}
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

        {/* Implementation Note */}
        <div className="mt-12 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-400">
            <strong>Note:</strong> This metrics page is a placeholder. To populate
            it with real data, you'll need to implement a metrics aggregation API endpoint
            that queries DynamoDB for boards and feedback. Consider implementing this
            with server-side rendering or an API route to keep metrics private.
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
