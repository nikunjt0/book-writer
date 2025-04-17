"use client"

import { useEffect, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { getTodaysTheme, imageThemes } from "@/lib/themes"
import { useWritingActivity } from "@/contexts/WritingActivityContext"

/* ───── helpers ───── */
const START_DATE = new Date("2025-03-01")
const today = new Date()

const dateKey = (d: Date) =>
  d.toISOString().slice(0, 10) /* YYYY‑MM‑DD */

const listDays = (from: Date, to: Date) => {
  const days: Date[] = []
  for (
    let d = new Date(from);
    d <= to;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  )
    days.push(new Date(d))
  return days
}

/* ───── component ───── */
export function WritingTracker() {
  /* ---------- persistent activity map ---------- */
  const { activity } = useWritingActivity()

  /* save whenever activity changes */
  useEffect(() => {
    localStorage.setItem("writing‑activity", JSON.stringify(activity))
  }, [activity])

  /* expose recordToday if you want it elsewhere */
  // (window as any).recordWritingToday = recordToday   // <- uncomment for quick debugging

  /* ---------- prepare grid data ---------- */
  const days = listDays(START_DATE, today) // chronological
  const currentTheme = getTodaysTheme() as keyof typeof imageThemes
  const themeColor = imageThemes[currentTheme].color
  const colorClassMap: Record<string, string> = {
    red: "bg-red-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
  }

  const columns = 9 /* keep your original layout */

  return (
    <div className="border rounded-md p-4 bg-white">
      <div
        className="grid gap-2 overflow-y-auto"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, maxHeight: 300 }} /* <- makes it scroll */
      >
        {days.map((d, idx) => {
          const k = dateKey(d)
          const wrote = activity[k] === 1
          return (
            <div
              key={k}
              title={k}
              className={cn(
                "aspect-square w-full rounded-sm",
                wrote ? colorClassMap[themeColor] : "bg-gray-200",
              )}
            />
          )
        })}
      </div>

      {/* legend */}
      <div className="mt-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div
            className={cn("w-3 h-3 rounded-sm", colorClassMap[themeColor])}
          ></div>
          <span>Days you wrote</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-200 rounded-sm"></div>
          <span>Days without writing</span>
        </div>
      </div>
    </div>
  )
}
