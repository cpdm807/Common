"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type {
  BoardPublicData,
  AvailabilitySettings,
  ReadinessSettings,
} from "@/lib/types";
import { getToolConfig } from "@/lib/tools";

export default function AddAvailabilityPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params?.boardId as string;

  const [board, setBoard] = useState<BoardPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingContributionId, setEditingContributionId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"select" | "deselect">("select");
  const [mouseDownSlot, setMouseDownSlot] = useState<number | null>(null);
  const [readiness, setReadiness] = useState(0);

  useEffect(() => {
    if (!boardId) return;

    // Check if we're editing
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    fetch(`/api/boards/${boardId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Board not found");
        return res.json();
      })
      .then((data) => {
        setBoard(data);
        
        // If editing, prefill data
        if (editId) {
          if (data.toolType === "availability" && data.computed.contributors) {
            const contributor = data.computed.contributors.find(
              (c: any) => c.contributionId === editId
            );

            if (contributor) {
              setEditingContributionId(editId);
              setName(contributor.name || "");
              if (contributor.selectedSlots) {
                setSelectedSlots(new Set(contributor.selectedSlots));
              }
            }
          } else if (
            data.toolType === "readiness" &&
            data.computed.readinessContributors
          ) {
            const contributor = data.computed.readinessContributors.find(
              (c: any) => c.contributionId === editId
            );

            if (contributor) {
              setEditingContributionId(editId);
              setName(contributor.name || "");
              const settings = data.settings as ReadinessSettings;
              setReadiness(
                contributor.readiness ||
                  Math.round(
                    (settings.scaleMin + settings.scaleMax) / 2 / settings.step
                  ) *
                    settings.step
              );
            }
          }
        } else {
          // Set default name for new contribution
          const defaultName = `Person ${data.computed.contributorsCount + 1}`;
          setName(defaultName);
          // Set default readiness to middle of scale
          if (data.toolType === "readiness") {
            const settings = data.settings as ReadinessSettings;
            const midValue =
              Math.round(
                (settings.scaleMin + settings.scaleMax) / 2 / settings.step
              ) * settings.step;
            setReadiness(midValue);
          }
        }
        
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [boardId]);

  const handleSlotToggle = useCallback(
    (slotIdx: number) => {
      setSelectedSlots((prev) => {
        const newSelected = new Set(prev);
        if (newSelected.has(slotIdx)) {
          newSelected.delete(slotIdx);
        } else {
          newSelected.add(slotIdx);
        }
        return newSelected;
      });
    },
    []
  );

  const handleSlotMouseDown = (slotIdx: number) => {
    setMouseDownSlot(slotIdx);
    setIsDragging(false); // Will be set to true on mousemove
    const isSelected = selectedSlots.has(slotIdx);
    setDragMode(isSelected ? "deselect" : "select");
  };

  const handleSlotMouseEnter = (slotIdx: number) => {
    if (mouseDownSlot === null) return;
    
    // If we've moved to a different cell, we're dragging
    if (slotIdx !== mouseDownSlot) {
      const wasDragging = isDragging;
      if (!wasDragging) {
        setIsDragging(true);
        // Select the initial cell when we start dragging
        const newSelected = new Set(selectedSlots);
        if (dragMode === "select") {
          newSelected.add(mouseDownSlot);
        } else {
          newSelected.delete(mouseDownSlot);
        }
        // Also select the current cell
        if (dragMode === "select") {
          newSelected.add(slotIdx);
        } else {
          newSelected.delete(slotIdx);
        }
        setSelectedSlots(newSelected);
        return;
      }
    } else {
      // Still on the same cell, not dragging yet
      if (!isDragging) {
        return;
      }
    }
    
    // Continue dragging - select current cell
    const newSelected = new Set(selectedSlots);
    if (dragMode === "select") {
      newSelected.add(slotIdx);
    } else {
      newSelected.delete(slotIdx);
    }
    setSelectedSlots(newSelected);
  };

  const handleMouseUp = useCallback(() => {
    // If we clicked without dragging, toggle the slot
    if (mouseDownSlot !== null && !isDragging) {
      handleSlotToggle(mouseDownSlot);
    }
    setIsDragging(false);
    setMouseDownSlot(null);
  }, [mouseDownSlot, isDragging, handleSlotToggle]);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseUp]);

  const selectRow = (slotIdx: number) => {
    if (!board) return;
    const settings = board.settings as AvailabilitySettings;
    const slotsPerDay = computeSlotsPerDay(settings);
    const slotInDay = slotIdx % slotsPerDay;
    
    // Check if all slots in this row are selected
    const rowSlots = [];
    for (let day = 0; day < settings.days; day++) {
      const idx = day * slotsPerDay + slotInDay;
      rowSlots.push(idx);
    }
    const allSelected = rowSlots.every(idx => selectedSlots.has(idx));
    
    const newSelected = new Set(selectedSlots);
    if (allSelected) {
      // Deselect all in row
      rowSlots.forEach(idx => newSelected.delete(idx));
    } else {
      // Select all in row
      rowSlots.forEach(idx => newSelected.add(idx));
    }
    setSelectedSlots(newSelected);
  };

  const selectColumn = (dayIndex: number) => {
    if (!board) return;
    const settings = board.settings as AvailabilitySettings;
    const slotsPerDay = computeSlotsPerDay(settings);
    
    // Check if all slots in this column are selected
    const columnSlots = [];
    for (let slot = 0; slot < slotsPerDay; slot++) {
      const idx = dayIndex * slotsPerDay + slot;
      columnSlots.push(idx);
    }
    const allSelected = columnSlots.every(idx => selectedSlots.has(idx));
    
    const newSelected = new Set(selectedSlots);
    if (allSelected) {
      // Deselect all in column
      columnSlots.forEach(idx => newSelected.delete(idx));
    } else {
      // Select all in column
      columnSlots.forEach(idx => newSelected.add(idx));
    }
    setSelectedSlots(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (board?.toolType === "availability" && selectedSlots.size === 0) {
      alert("Please select at least one time slot");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const url = editingContributionId
        ? `/api/boards/${boardId}/contributions/${editingContributionId}`
        : `/api/boards/${boardId}/contributions`;

      const method = editingContributionId ? "PUT" : "POST";

      let payload: any;
      if (board?.toolType === "availability") {
        payload = {
          selectedSlotIndexes: Array.from(selectedSlots).sort((a, b) => a - b),
        };
      } else if (board?.toolType === "readiness") {
        payload = {
          readiness,
        };
      } else {
        throw new Error("Unsupported tool type");
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          payload,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit");
      }

      router.push(`/b/${boardId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
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
          <h1 className="text-2xl font-bold mb-4">
            {error || "Board not found"}
          </h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  if (board.computed.expired) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Board has expired</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const toolConfig = getToolConfig(board.toolType);

  return (
    <div className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        <Link
          href={`/b/${boardId}`}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4 inline-block"
        >
          ← Back to board
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{toolConfig.icon}</span>
          <h1 className="text-2xl md:text-3xl font-bold">
            {editingContributionId
              ? `Edit your ${board.toolType === "readiness" ? "pulse" : "availability"}`
              : `Add your ${board.toolType === "readiness" ? "pulse" : "availability"}`}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {board.title || toolConfig.displayName}
        </p>

        {board.toolType === "availability" && (
          <AvailabilityAddForm
            board={board}
            boardId={boardId}
            name={name}
            setName={setName}
            selectedSlots={selectedSlots}
            setSelectedSlots={setSelectedSlots}
            isDragging={isDragging}
            dragMode={dragMode}
            mouseDownSlot={mouseDownSlot}
            setMouseDownSlot={setMouseDownSlot}
            setIsDragging={setIsDragging}
            setDragMode={setDragMode}
            handleSlotToggle={handleSlotToggle}
            handleSlotMouseDown={handleSlotMouseDown}
            handleSlotMouseEnter={handleSlotMouseEnter}
            handleMouseUp={handleMouseUp}
            selectRow={selectRow}
            selectColumn={selectColumn}
            handleSubmit={handleSubmit}
            submitting={submitting}
            error={error}
          />
        )}

        {board.toolType === "readiness" && (
          <ReadinessAddForm
            board={board}
            boardId={boardId}
            name={name}
            setName={setName}
            readiness={readiness}
            setReadiness={setReadiness}
            handleSubmit={handleSubmit}
            submitting={submitting}
            error={error}
          />
        )}
      </div>
    </div>
  );
}

// Availability add form component
function AvailabilityAddForm({
  board,
  boardId,
  name,
  setName,
  selectedSlots,
  setSelectedSlots,
  isDragging,
  dragMode,
  mouseDownSlot,
  setMouseDownSlot,
  setIsDragging,
  setDragMode,
  handleSlotToggle,
  handleSlotMouseDown,
  handleSlotMouseEnter,
  handleMouseUp,
  selectRow,
  selectColumn,
  handleSubmit,
  submitting,
  error,
}: {
  board: BoardPublicData;
  boardId: string;
  name: string;
  setName: (name: string) => void;
  selectedSlots: Set<number>;
  setSelectedSlots: (slots: Set<number>) => void;
  isDragging: boolean;
  dragMode: "select" | "deselect";
  mouseDownSlot: number | null;
  setMouseDownSlot: (slot: number | null) => void;
  setIsDragging: (dragging: boolean) => void;
  setDragMode: (mode: "select" | "deselect") => void;
  handleSlotToggle: (slotIdx: number) => void;
  handleSlotMouseDown: (slotIdx: number) => void;
  handleSlotMouseEnter: (slotIdx: number) => void;
  handleMouseUp: () => void;
  selectRow: (slotIdx: number) => void;
  selectColumn: (dayIndex: number) => void;
  handleSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  error: string | null;
}) {
  const settings = board.settings as AvailabilitySettings;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name input */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100"
        >
          Your name (optional)
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={(e) => e.target.select()}
          maxLength={50}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Instructions */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-gray-900 dark:text-gray-100">
          {"ontouchstart" in window ? (
            <>
              <strong>Tap</strong> individual slots to select or deselect. Tap
              row/column headers to select entire rows/columns.
            </>
          ) : (
            <>
              <strong>Click and drag</strong> to select multiple slots, or
              click individual slots to toggle. Click row/column headers to
              select entire rows/columns.
            </>
          )}
        </p>
      </div>

      {/* Availability grid */}
      <div className="mb-6">
        <h2 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
          Select your availability
        </h2>
        <AvailabilityGrid
          settings={settings}
          selectedSlots={selectedSlots}
          onSlotToggle={handleSlotToggle}
          onSlotMouseDown={handleSlotMouseDown}
          onSlotMouseEnter={handleSlotMouseEnter}
          onSelectRow={selectRow}
          onSelectColumn={selectColumn}
        />
      </div>

      {/* Selected count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {selectedSlots.size} slot{selectedSlots.size !== 1 ? "s" : ""} selected
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
        disabled={submitting || selectedSlots.size === 0}
        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
      >
        {submitting ? "Submitting..." : "Submit availability"}
      </button>
    </form>
  );
}

// Readiness add form component
function ReadinessAddForm({
  board,
  boardId,
  name,
  setName,
  readiness,
  setReadiness,
  handleSubmit,
  submitting,
  error,
}: {
  board: BoardPublicData;
  boardId: string;
  name: string;
  setName: (name: string) => void;
  readiness: number;
  setReadiness: (readiness: number) => void;
  handleSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  error: string | null;
}) {
  const settings = board.settings as ReadinessSettings;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name input */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100"
        >
          Your name (optional)
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={(e) => e.target.select()}
          maxLength={50}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Prompt */}
      {settings.prompt && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {settings.prompt}
          </p>
        </div>
      )}

      {/* Readiness input */}
      <div>
        <label
          htmlFor="readiness"
          className="block text-sm font-medium mb-3 text-gray-900 dark:text-gray-100"
        >
          {readiness}
          {settings.scaleMax === 100 ? "%" : ""}
        </label>
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2 text-xs text-gray-600 dark:text-gray-400">
            <span>{settings.leftLabel}</span>
            <span>{settings.rightLabel}</span>
          </div>
          <div className="relative">
            <div className="absolute inset-0 h-2 bg-gradient-to-r from-red-400 via-orange-400 via-yellow-400 via-lime-500 to-green-500 dark:from-red-600 dark:via-orange-600 dark:via-yellow-600 dark:via-lime-600 dark:to-green-600 rounded-lg pointer-events-none" />
            <input
              type="range"
              id="readiness"
              min={settings.scaleMin}
              max={settings.scaleMax}
              step={settings.step}
              value={readiness}
              onChange={(e) => setReadiness(parseInt(e.target.value))}
              className="relative w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer"
              style={{
                background: "transparent",
              }}
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={settings.scaleMin}
              max={settings.scaleMax}
              step={settings.step}
              value={readiness}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (
                  !isNaN(val) &&
                  val >= settings.scaleMin &&
                  val <= settings.scaleMax
                ) {
                  setReadiness(Math.round(val / settings.step) * settings.step);
                }
              }}
              className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
            />
            {settings.scaleMax === 100 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
            )}
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
        disabled={submitting}
        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
      >
        {submitting ? "Submitting..." : "Submit pulse"}
      </button>
    </form>
  );
}

// Availability grid component
function AvailabilityGrid({
  settings,
  selectedSlots,
  onSlotToggle,
  onSlotMouseDown,
  onSlotMouseEnter,
  onSelectRow,
  onSelectColumn,
}: {
  settings: AvailabilitySettings;
  selectedSlots: Set<number>;
  onSlotToggle: (slotIdx: number) => void;
  onSlotMouseDown: (slotIdx: number) => void;
  onSlotMouseEnter: (slotIdx: number) => void;
  onSelectRow: (slotIdx: number) => void;
  onSelectColumn: (dayIndex: number) => void;
}) {
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

  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
      <div className="inline-block min-w-full">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `auto repeat(${days}, minmax(60px, 1fr))`,
          }}
        >
          {/* Header row - sticky */}
          <div className="h-12 sticky top-0 left-0 bg-white dark:bg-gray-950 z-20" />
          {Array.from({ length: days }).map((_, dayIdx) => (
            <button
              key={dayIdx}
              type="button"
              onClick={() => onSelectColumn(dayIdx)}
              className="text-xs font-medium text-center py-2 sticky top-0 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 z-10 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors border-b border-gray-200 dark:border-gray-800"
              title="Click to select entire column"
            >
              {getDayLabel(dayIdx, settings)}
            </button>
          ))}

          {/* Time rows */}
          {timeLabels.map((time, slotIdx) => (
            <div key={`row-${slotIdx}`} className="contents">
              <button
                type="button"
                onClick={() => onSelectRow(slotIdx)}
                className="text-xs text-right pr-2 py-1 text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors sticky left-0 bg-white dark:bg-gray-950 z-10 border-r border-gray-200 dark:border-gray-800"
                title="Click to select entire row"
              >
                {time}
              </button>
              {Array.from({ length: days }).map((_, dayIdx) => {
                const idx = dayIdx * slotsPerDay + slotIdx;
                const isSelected = selectedSlots.has(idx);
                return (
                  <button
                    key={`${dayIdx}-${slotIdx}`}
                    type="button"
                    onClick={() => onSlotToggle(idx)}
                    onMouseDown={(e) => {
                      // Only enable drag on desktop (devices with mouse)
                      if (e.button === 0 && !('ontouchstart' in window)) {
                        onSlotMouseDown(idx);
                      }
                    }}
                    onMouseEnter={() => {
                      // Only handle drag on desktop
                      if (!('ontouchstart' in window)) {
                        onSlotMouseEnter(idx);
                      }
                    }}
                    className={`h-10 md:h-12 rounded border-2 transition-all select-none ${
                      isSelected
                        ? "bg-blue-500 border-blue-600 dark:bg-blue-600 dark:border-blue-700"
                        : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 hover:border-blue-400 active:border-blue-500"
                    }`}
                    aria-label={`${getDayLabel(dayIdx, settings)} ${time}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function computeSlotsPerDay(settings: AvailabilitySettings): number {
  const hoursPerDay = settings.dayEnd - settings.dayStart;
  return (hoursPerDay * 60) / settings.slotMinutes;
}

function getDayLabel(dayIndex: number, settings: AvailabilitySettings): string {
  // Parse date string as YYYY-MM-DD and create date in local timezone
  // This avoids timezone issues where "2026-01-20" would be interpreted as UTC midnight
  const [year, month, day] = settings.startDate.split("-").map(Number);
  const startDate = new Date(year, month - 1, day); // month is 0-indexed
  const targetDate = new Date(startDate);
  targetDate.setDate(startDate.getDate() + dayIndex);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${days[targetDate.getDay()]} ${months[targetDate.getMonth()]} ${targetDate.getDate()}`;
}
