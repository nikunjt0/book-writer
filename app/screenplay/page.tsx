"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Plus,
  ChevronLeft,
  Trash2,
  Save as SaveIcon,
} from "lucide-react"

import { TitlePage, type TitlePageData } from "@/components/title-page"
import { ScriptEditor } from "@/components/script-editor"

import { useAuth } from "@/contexts/AuthContext"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore"
import { firestore } from "@/lib/firebaseClient"

/* ── block ↔ text converters ───────────────────────────────────────── */
export type Block =
  | { type: "sceneHeading"; text: string }
  | { type: "action"; text: string }
  | { type: "character"; text: string }
  | { type: "dialogue"; text: string }
  | { type: "transition"; text: string }

const pad = (n: number, str = "") => " ".repeat(n) + str
const center80 = (str: string) =>
  pad(Math.max(0, Math.floor((80 - str.length) / 2)), str)

function blocksToText(blocks: Block[]): string {
    return blocks
        .map((b, i) => {
        const prev = blocks[i - 1]?.type
        const needsGap = b.type === "action" && prev !== undefined
        const line = (() => {
            switch (b.type) {
            case "sceneHeading":
                return b.text
            case "action":
                return (needsGap ? "\n" : "") + b.text
            case "character":
                return " ".repeat(33) + b.text
            case "dialogue":
                return " ".repeat(20) + b.text
            case "transition":
                return " ".repeat(51) + b.text
            }
        })()
        return line
        })
        .join("\n")
}

function textToBlocks(txt: string): Block[] {
    return txt
      .split(/\r?\n/)
      .filter(Boolean)
      .map<Block>((line) => {
        // transition (51 spaces)
        if (/^\s{51}/.test(line)) 
          return { type: "transition", text: line.trim() }
  
        // CHARACTER (centered at 33 spaces now)
        if (/^\s{33}/.test(line))   
          return { type: "character",  text: line.trim() }
  
        // dialogue (20 spaces)
        if (/^\s{20}/.test(line))   
          return { type: "dialogue",   text: line.trim() }
  
        // scene headings
        if (/^(INT\.|EXT\.)/.test(line)) 
          return { type: "sceneHeading", text: line.trim() }
  
        // fallback to action
        return { type: "action", text: line.trim() }
      })
  }  

/* ── types / defaults ────────────────────────────────────────────── */
interface Scene {
  id: string
  content: string
}

const BLANK_TITLE_PAGE: TitlePageData = {
  authorName: "Author Name",
  authorAddress: "Author's Address",
  authorCity: "City, State ZIP",
  authorPhone: "(555) 555-5555",
  authorEmail: "author@example.com",
}

/* ── component ───────────────────────────────────────────────────── */
export default function ScreenplayPage() {
  const { currentUser } = useAuth()
  const router = useRouter()

  const [screenplayId, setScreenplayId] = useState("")
  const [title, setTitle] = useState("Screenplay Title")
  const [titlePageData, setTitlePageData] = useState<TitlePageData>(
    BLANK_TITLE_PAGE,
  )
  const [scenes, setScenes] = useState<Scene[]>([])

  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [showScriptMenu, setShowScriptMenu] = useState(false)
  const [currentView, setCurrentView] = useState<"title-page" | "scene">(
    "title-page",
  )
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null)

  const [unsaved, setUnsaved] = useState(false)
  const markUnsaved = () => setUnsaved(true)

  /* ── load from Firestore ───────────────────────────────────────── */
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return
      const id = new URLSearchParams(window.location.search).get("id")
      if (!id) return

      setScreenplayId(id)
      const baseRef = doc(
        firestore,
        "users",
        currentUser.uid,
        "screenplays",
        id,
      )

      const info = await getDoc(baseRef)
      if (info.exists()) {
        const d: any = info.data()
        setTitle(d.screenplayTitle || "Screenplay Title")
        setTitlePageData({
          authorName: d.authorName || "",
          authorAddress: d.authorAddress || "",
          authorCity: d.authorCity || "",
          authorPhone: d.authorPhone || "",
          authorEmail: d.authorEmail || "",
        })
      }

      const snap = await getDocs(collection(baseRef, "script"))
      const loaded: Scene[] = snap.docs.map((d) => ({
        id: d.id,
        content: blocksToText((d.data() as any).blocks || []),
      }))
      setScenes(loaded)

      setUnsaved(false)
    }

    fetchData()
  }, [currentUser])

  /* ── save to Firestore ─────────────────────────────────────────── */
  const saveToFirestore = useCallback(async () => {
    if (!currentUser || !screenplayId) return

    const baseRef = doc(
      firestore,
      "users",
      currentUser.uid,
      "screenplays",
      screenplayId,
    )

    await setDoc(
      baseRef,
      { screenplayTitle: title, ...titlePageData, updatedAt: serverTimestamp() },
      { merge: true },
    )

    const scriptCol = collection(baseRef, "script")
    await Promise.all(
      scenes.map((s) =>
        setDoc(
          doc(scriptCol, s.id),
          { blocks: textToBlocks(s.content) },
          { merge: true },
        ),
      ),
    )

    const existing = await getDocs(scriptCol)
    await Promise.all(
      existing.docs
        .filter((d) => !scenes.some((s) => s.id === d.id))
        .map((d) => deleteDoc(d.ref)),
    )

    setUnsaved(false)
  }, [currentUser, screenplayId, title, titlePageData, scenes])

  /* ── Ctrl/⌘+S ───────────────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        saveToFirestore()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [saveToFirestore])

  /* ── scene handlers ───────────────────────────────────────────── */
  const addNewScene = () => {
    const id = `scene-${Date.now()}`
    setScenes((prev) => [...prev, { id, content: "" }])
    setCurrentSceneId(id)
    setCurrentView("scene")
    markUnsaved()
  }

  const updateSceneContent = (id: string, content: string) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, content } : s)),
    )
    markUnsaved()
  }

  const deleteScene = (id: string) => {
    setScenes((prev) => prev.filter((s) => s.id !== id))
    if (currentSceneId === id) {
      setCurrentSceneId(null)
      setCurrentView("title-page")
    }
    markUnsaved()
  }

  /* ── render ───────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-gray-700">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.currentTarget.value)
              markUnsaved()
            }}
            className="flex-1 text-3xl font-bold border-b-2 border-black focus:outline-none"
          />
          <button
            onClick={saveToFirestore}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md"
          >
            <SaveIcon className="h-4 w-4" />
            Save
          </button>
          {unsaved && (
            <span className="text-sm text-red-600">
              There are unsaved changes
            </span>
          )}
        </div>

        <div className="flex gap-6">
          <div className="w-64 border border-gray-300">
            {showScriptMenu ? (
              <nav className="flex flex-col">
                <button
                  onClick={() => {
                    setShowScriptMenu(false)
                    setActiveSection(null)
                  }}
                  className="p-4 text-left hover:bg-gray-100 flex items-center text-gray-700"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </button>
                <div className="border-t border-gray-200" />

                <button
                  onClick={() => {
                    setCurrentView("title-page")
                    setCurrentSceneId(null)
                  }}
                  className={`p-4 text-left hover:bg-gray-100 ${
                    currentView === "title-page" ? "bg-gray-100 font-medium" : ""
                  }`}
                >
                  Title Page
                </button>

                {scenes.map((sc, i) => (
                  <div key={sc.id} className="relative group">
                    <button
                      onClick={() => {
                        setCurrentView("scene")
                        setCurrentSceneId(sc.id)
                      }}
                      className={`p-4 text-left hover:bg-gray-100 w-full ${
                        currentSceneId === sc.id ? "bg-gray-100 font-medium" : ""
                      }`}
                    >
                      Scene {i + 1}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteScene(sc.id)
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-500 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={addNewScene}
                  className="p-4 text-left hover:bg-gray-100 text-gray-500 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Scene
                </button>
              </nav>
            ) : (
              <nav className="flex flex-col">
                {["script", "shot-list", "storyboard", "ideation"].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => {
                      setActiveSection(sec)
                      setShowScriptMenu(sec === "script")
                      if (sec === "script") {
                        setCurrentView("title-page")
                      }
                    }}
                    className={`p-4 text-left hover:bg-gray-100 ${
                      activeSection === sec ? "bg-gray-100 font-medium" : ""
                    }`}
                  >
                    {sec === "shot-list"
                      ? "Shot List"
                      : sec.charAt(0).toUpperCase() + sec.slice(1)}
                  </button>
                ))}
              </nav>
            )}
          </div>

          <div className="flex-1">
            {activeSection === "script" ? (
              <div>
                <div className="mb-4 border-b pb-2">
                  <h2 className="text-xl font-medium">
                    {currentView === "title-page"
                      ? "Title Page"
                      : `Scene ${
                          scenes.findIndex((s) => s.id === currentSceneId) + 1
                        }`}
                  </h2>
                </div>
                <div className="border p-8 min-h-[600px] font-mono">
                  {currentView === "title-page" ? (
                    <TitlePage
                      title={title}
                      initialData={titlePageData}
                      onUpdate={(d) => {
                        setTitlePageData(d)
                        markUnsaved()
                      }}
                    />
                  ) : currentSceneId ? (
                    <ScriptEditor
                      key = {currentSceneId}
                      scene={{
                        id: currentSceneId,
                        content: scenes.find((s) => s.id === currentSceneId)!
                          .content,
                      }}
                      onChange={({ id, content }) =>
                        updateSceneContent(id, content)
                      }
                    />
                  ) : (
                    <p className="text-center text-gray-500 mt-20">
                      Select Title Page or a Scene to start
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="p-4 text-center text-gray-500">
                Select an option from the menu to get started
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
