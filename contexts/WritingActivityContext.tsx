// app/contexts/WritingActivityContext.tsx
"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

type ActivityMap = Record<string, 0 | 1>

interface Ctx {
  activity: ActivityMap
  recordToday: () => void
}

const WritingActivityContext = createContext<Ctx | null>(null)

/* helper */
const dateKey = (d = new Date()) => d.toISOString().slice(0, 10)

export function WritingActivityProvider({ children }: { children: ReactNode }) {
  const [activity, setActivity] = useState<ActivityMap>({})

  /* load once */
  useEffect(() => {
    const stored = localStorage.getItem("writing-activity")
    if (stored) setActivity(JSON.parse(stored))
  }, [])

  /* persist */
  useEffect(() => {
    localStorage.setItem("writing-activity", JSON.stringify(activity))
  }, [activity])

  const recordToday = () =>
    setActivity((prev) =>
      prev[dateKey()] === 1 ? prev : { ...prev, [dateKey()]: 1 },
    )

  return (
    <WritingActivityContext.Provider value={{ activity, recordToday }}>
      {children}
    </WritingActivityContext.Provider>
  )
}

/* handy hook */
export const useWritingActivity = () => {
  const ctx = useContext(WritingActivityContext)
  if (!ctx) throw new Error("Wrap tree with <WritingActivityProvider>")
  return ctx
}
