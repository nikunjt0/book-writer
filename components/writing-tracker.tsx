"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { getTodaysTheme, imageThemes } from "@/lib/themes"
import { doc, setDoc, serverTimestamp, collection, getDocs } from "firebase/firestore"
import { firestore } from "@/lib/firebaseClient"
import { useAuth } from "@/contexts/AuthContext"

export async function recordWritingToday(uid: string) {
  const todayKey = new Date().toISOString().slice(0, 10)
  const ref = doc(firestore, "users", uid, "writingActivity", todayKey)
  await setDoc(ref, { wrote: true, timestamp: serverTimestamp() }, { merge: true })
}

const dateKey = (d: Date) => d.toISOString().slice(0, 10)

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

export function WritingTracker() {
  const { currentUser } = useAuth()
  const [activity, setActivity] = useState<Record<string, boolean>>({})
  const [startDate, setStartDate] = useState<Date | null>(null)

  useEffect(() => {
    const fetchActivity = async () => {
      if (!currentUser) return
      const ref = collection(firestore, "users", currentUser.uid, "writingActivity")
      const snap = await getDocs(ref)

      const data: Record<string, boolean> = {}
      let earliestDate: string | null = null

      snap.forEach(docSnap => {
        const k = docSnap.id // YYYY-MM-DD
        data[k] = docSnap.data().wrote === true
        if (!earliestDate || k < earliestDate) earliestDate = k
      })

      setActivity(data)

      // Dynamically set start date from first writing day
      if (earliestDate) {
        setStartDate(new Date(earliestDate))
      }
    }

    fetchActivity()
  }, [currentUser])

  const today = new Date()
  const currentTheme = getTodaysTheme() as keyof typeof imageThemes
  const themeColor = imageThemes[currentTheme].color
  const colorClassMap: Record<string, string> = {
    red: "bg-red-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
  }

  const columns = 9

  if (!startDate) {
    return <p className="text-gray-500">Loading activity...</p>
  }

  const days = listDays(startDate, today)

  return (
    <div className="border rounded-md p-4 bg-white">
      <div
        className="grid gap-2 overflow-y-auto"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          maxHeight: 300,
        }}
      >
        {days.map((d) => {
          const k = dateKey(d)
          const wrote = activity[k]
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
          <div className={cn("w-3 h-3 rounded-sm", colorClassMap[themeColor])}></div>
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
