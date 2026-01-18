"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { BoardPublicData, AvailabilitySettings } from "@/lib/types";

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
        if (editId && data.computed.contributors) {
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
        } else {
          // Set default name for new contribution
          const defaultName = `Person ${data.computed.contributorsCount + 1}`;
          setName(defaultName);
        }
        
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [boardId]);

  const handleSlotToggle = (slotIdx: number) => {
    const newSelected = new Set(selectedSlots);
    if (newSelected.has(slotIdx)) {
      newSelected.delete(slotIdx);
    } else {
      newSelected.add(slotIdx);
    }
    setSelectedSlots(newSelected);
  };

  const handleSlotMouseDown = (slotIdx: number) => {
    setIsDragging(true);
    const isSelected = selectedSlots.has(slotIdx);
    setDragMode(isSelected ? "deselect" : "select");
    handleSlotToggle(slotIdx);
  };

  const handleSlotMouseEnter = (slotIdx: number) => {
    if (!isDragging) return;
    
    const newSelected = new Set(selectedSlots);
    if (dragMode === "select") {
      newSelected.add(slotIdx);
    } else {
      newSelected.delete(slotIdx);
    }
    setSelectedSlots(newSelected);
  };

  const handleSlotTouchStart = (slotIdx: number, e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling
    setIsDragging(true);
    const isSelected = selectedSlots.has(slotIdx);
    setDragMode(isSelected ? "deselect" : "select");
    handleSlotToggle(slotIdx);
  };

  const handleSlotTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent scrolling
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const slotIdx = element?.getAttribute('data-slot-idx');
    
    if (slotIdx !== null && slotIdx !== undefined) {
      const idx = parseInt(slotIdx);
      if (!isNaN(idx)) {
        const newSelected = new Set(selectedSlots);
        if (dragMode === "select") {
          newSelected.add(idx);
        } else {
          newSelected.delete(idx);
        }
        setSelectedSlots(newSelected);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  const selectRow = (slotIdx: number) => {
    if (!board) return;
    const settings = board.settings as AvailabilitySettings;
    const slotsPerDay = computeSlotsPerDay(settings);
    const slotInDay = slotIdx % slotsPerDay;
    
    const newSelected = new Set(selectedSlots);
    for (let day = 0; day < settings.days; day++) {
      const idx = day * slotsPerDay + slotInDay;
      newSelected.add(idx);
    }
    setSelectedSlots(newSelected);
  };

  const selectColumn = (dayIndex: number) => {
    if (!board) return;
    const settings = board.settings as AvailabilitySettings;
    const slotsPerDay = computeSlotsPerDay(settings);
    
    const newSelected = new Set(selectedSlots);
    for (let slot = 0; slot < slotsPerDay; slot++) {
      const idx = dayIndex * slotsPerDay + slot;
      newSelected.add(idx);
    }
    setSelectedSlots(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSlots.size === 0) {
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
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          payload: {
            selectedSlotIndexes: Array.from(selectedSlots).sort((a, b) => a - b),
          },
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

  const settings = board.settings as AvailabilitySettings;

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
          <span className="text-4xl">📅</span>
          <h1 className="text-2xl md:text-3xl font-bold">
            {editingContributionId ? "Edit your availability" : "Add your availability"}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {board.title || "Availability"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
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
            <p className="text-sm">
              <strong>Desktop:</strong> Click and drag to select multiple slots.{" "}
              <strong>Mobile:</strong> Touch and drag to select. Click row/column headers to select entire rows/columns.
            </p>
          </div>

          {/* Availability grid */}
          <div className="mb-6">
            <h2 className="font-semibold mb-3">Select your availability</h2>
            <AvailabilityGrid
              settings={settings}
              selectedSlots={selectedSlots}
              onSlotMouseDown={handleSlotMouseDown}
              onSlotMouseEnter={handleSlotMouseEnter}
              onSlotTouchStart={handleSlotTouchStart}
              onSlotTouchMove={handleSlotTouchMove}
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
      </div>
    </div>
  );
}

// Availability grid component
function AvailabilityGrid({
  settings,
  selectedSlots,
  onSlotMouseDown,
  onSlotMouseEnter,
  onSlotTouchStart,
  onSlotTouchMove,
  onSelectRow,
  onSelectColumn,
}: {
  settings: AvailabilitySettings;
  selectedSlots: Set<number>;
  onSlotMouseDown: (slotIdx: number) => void;
  onSlotMouseEnter: (slotIdx: number) => void;
  onSlotTouchStart: (slotIdx: number, e: React.TouchEvent) => void;
  onSlotTouchMove: (e: React.TouchEvent) => void;
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
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `auto repeat(${days}, minmax(60px, 1fr))`,
          }}
        >
          {/* Header row */}
          <div className="h-12" />
          {Array.from({ length: days }).map((_, dayIdx) => (
            <button
              key={dayIdx}
              type="button"
              onClick={() => onSelectColumn(dayIdx)}
              className="text-xs font-medium text-center py-2 sticky top-0 bg-white dark:bg-black z-10 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              title="Click to select entire column"
            >
              {getDayLabel(dayIdx, settings)}
            </button>
          ))}

          {/* Time rows */}
          {timeLabels.map((time, slotIdx) => (
            <>
              <button
                key={`time-${slotIdx}`}
                type="button"
                onClick={() => onSelectRow(slotIdx)}
                className="text-xs text-right pr-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
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
                    data-slot-idx={idx}
                    onMouseDown={() => onSlotMouseDown(idx)}
                    onMouseEnter={() => onSlotMouseEnter(idx)}
                    onTouchStart={(e) => onSlotTouchStart(idx, e)}
                    onTouchMove={onSlotTouchMove}
                    className={`h-10 md:h-12 rounded border-2 transition-all touch-manipulation select-none ${
                      isSelected
                        ? "bg-blue-500 border-blue-600 dark:bg-blue-600 dark:border-blue-700"
                        : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 hover:border-blue-400"
                    }`}
                    aria-label={`${getDayLabel(dayIdx, settings)} ${time}`}
                  />
                );
              })}
            </>
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
  const startDate = new Date(settings.startDate);
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
