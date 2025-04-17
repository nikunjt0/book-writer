"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { getTodaysTheme, imageThemes } from "@/lib/themes"

export function ImageGallery() {
  const [currentTheme, setCurrentTheme] = useState("renaissance")

  useEffect(() => {
    setCurrentTheme(getTodaysTheme())
  }, [])

  const theme = imageThemes[currentTheme as keyof typeof imageThemes]

  const borderColorMap: Record<string, string> = {
    red: "border-red-600",
    blue: "border-blue-600",
    green: "border-green-600",
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="flex">
        {theme.images.map((src, index) => (
          <div
            key={index}
            className={cn(
              "relative h-48 flex-1 border-b-4",
              borderColorMap[theme.color]
            )}
          >
            <Image
              src={src || "/placeholder.svg"}
              alt={`${currentTheme} artwork ${index + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* Theme selector (optional UI) */}
      <div className="hidden bg-gray-100 p-2">
        <div className="flex gap-2 text-sm">
          {Object.entries(imageThemes).map(([key, val]) => (
            <button
              key={key}
              className={cn(
                "px-2 py-1 rounded",
                currentTheme === key ? `bg-${val.color}-600 text-white` : "bg-gray-200"
              )}
              onClick={() => setCurrentTheme(key)}
            >
              {key[0].toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
