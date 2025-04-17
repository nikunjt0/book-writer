"use client"

import { useState, useRef, useLayoutEffect } from "react"

interface TitlePageProps {
  title: string
  onUpdate?: (data: TitlePageData) => void
  initialData?: TitlePageData
}

export interface TitlePageData {
  authorName: string
  authorAddress: string
  authorCity: string
  authorPhone: string
  authorEmail: string
}

export function TitlePage({ title, onUpdate, initialData }: TitlePageProps) {
  const [data, setData] = useState<TitlePageData>(
    initialData || {
      authorName: "Author Name",
      authorAddress: "Author's Address",
      authorCity: "City, State ZIP",
      authorPhone: "(555) 555-5555",
      authorEmail: "author@example.com",
    },
  )

  const spanRef = useRef<HTMLSpanElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    if (spanRef.current && inputRef.current) {
      const width = spanRef.current.offsetWidth
      inputRef.current.style.width = `${width + 10}px`
    }
  }, [data.authorName])

  const handleChange = (field: keyof TitlePageData, value: string) => {
    const updatedData = { ...data, [field]: value }
    setData(updatedData)
    if (onUpdate) {
      onUpdate(updatedData)
    }
  }

  return (
    <div className="font-mono" style={{ fontFamily: "Courier New, monospace" }}>
      <div className="mt-40 mb-4 text-center">
        <h1 className="text-xl uppercase">{title}</h1>
      </div>

      <div className="mt-20 mb-4 text-center">
        <p>Written by</p>
        <div className="relative inline-block">
          <input
            ref={inputRef}
            type="text"
            value={data.authorName}
            onChange={(e) => handleChange("authorName", e.target.value)}
            className="text-center bg-transparent border-b border-gray-300 focus:border-gray-500 focus:outline-none font-mono"
            style={{ fontFamily: "Courier New, monospace" }}
          />
          <span
            ref={spanRef}
            className="absolute top-0 left-0 invisible whitespace-pre font-mono"
            style={{ fontFamily: "Courier New, monospace" }}
          >
            {data.authorName || "Author Name"}
          </span>
        </div>
      </div>

      <div className="mt-40 text-left">
        <input
          type="text"
          value={data.authorAddress}
          onChange={(e) => handleChange("authorAddress", e.target.value)}
          className="block w-full bg-transparent border-b border-gray-300 focus:border-gray-500 focus:outline-none font-mono"
          style={{ fontFamily: "Courier New, monospace" }}
        />
        <input
          type="text"
          value={data.authorCity}
          onChange={(e) => handleChange("authorCity", e.target.value)}
          className="block w-full mt-1 bg-transparent border-b border-gray-300 focus:border-gray-500 focus:outline-none font-mono"
          style={{ fontFamily: "Courier New, monospace" }}
        />
        <input
          type="text"
          value={data.authorPhone}
          onChange={(e) => handleChange("authorPhone", e.target.value)}
          className="block w-full mt-1 bg-transparent border-b border-gray-300 focus:border-gray-500 focus:outline-none font-mono"
          style={{ fontFamily: "Courier New, monospace" }}
        />
        <input
          type="text"
          value={data.authorEmail}
          onChange={(e) => handleChange("authorEmail", e.target.value)}
          className="block w-full mt-1 bg-transparent border-b border-gray-300 focus:border-gray-500 focus:outline-none font-mono"
          style={{ fontFamily: "Courier New, monospace" }}
        />
      </div>
    </div>
  )
}
