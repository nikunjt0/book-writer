"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, ChevronLeft, Trash2 } from "lucide-react"
import { ScriptEditor } from "@/components/script-editor"
import { TitlePage, type TitlePageData } from "@/components/title-page"

// Define the screenplay data structure
interface ScreenplayData {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  titlePageData: TitlePageData
  scenes: {
    id: string
    content: string
  }[]
}

export default function ScreenplayPage() {
  const router = useRouter()
  const [screenplayId, setScreenplayId] = useState<string>("")
  const [title, setTitle] = useState("Screenplay Title")
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [scenes, setScenes] = useState<{ id: string; content: string }[]>([])
  const [currentView, setCurrentView] = useState<"title-page" | "scene" | null>("title-page")
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null)
  const [showScriptMenu, setShowScriptMenu] = useState(false)
  const [titlePageData, setTitlePageData] = useState<TitlePageData>({
    authorName: "Author Name",
    authorAddress: "Author's Address",
    authorCity: "City, State ZIP",
    authorPhone: "(555) 555-5555",
    authorEmail: "author@example.com",
  })

  // Initialize screenplay or load from localStorage
  useEffect(() => {
    // Check if we're creating a new screenplay or editing an existing one
    const urlParams = new URLSearchParams(window.location.search)
    const id = urlParams.get("id")

    if (id) {
      // Load existing screenplay
      const savedScreenplays = JSON.parse(localStorage.getItem("screenplays") || "[]")
      const screenplay = savedScreenplays.find((s: ScreenplayData) => s.id === id)

      if (screenplay) {
        setScreenplayId(screenplay.id)
        setTitle(screenplay.title)
        setScenes(screenplay.scenes)
        setTitlePageData(screenplay.titlePageData)
      } else {
        // Screenplay not found, create new
        createNewScreenplay()
      }
    } else {
      // Create new screenplay
      createNewScreenplay()
    }
  }, [])

  // Auto-save screenplay when changes are made
  useEffect(() => {
    if (screenplayId) {
      saveScreenplay()
    }
  }, [title, scenes, titlePageData, screenplayId])

  const createNewScreenplay = () => {
    const newId = `screenplay-${Date.now()}`
    setScreenplayId(newId)
    setTitle("Screenplay Title")
    setScenes([])
    setTitlePageData({
      authorName: "Author Name",
      authorAddress: "Author's Address",
      authorCity: "City, State ZIP",
      authorPhone: "(555) 555-5555",
      authorEmail: "author@example.com",
    })
  }

  const saveScreenplay = () => {
    const savedScreenplays = JSON.parse(localStorage.getItem("screenplays") || "[]")

    const screenplayData: ScreenplayData = {
      id: screenplayId,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      titlePageData,
      scenes,
    }

    // Update if exists, otherwise add new
    const existingIndex = savedScreenplays.findIndex((s: ScreenplayData) => s.id === screenplayId)
    if (existingIndex >= 0) {
      savedScreenplays[existingIndex] = screenplayData
    } else {
      savedScreenplays.push(screenplayData)
    }

    localStorage.setItem("screenplays", JSON.stringify(savedScreenplays))
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }

  const addNewScene = () => {
    const newScene = {
      id: `scene-${Date.now()}`,
      content: "INT. LOCATION - DAY\n\n",
    }
    setScenes([...scenes, newScene])
    setCurrentView("scene")
    setCurrentSceneId(newScene.id)
  }

  const deleteScene = (sceneId: string) => {
    const updatedScenes = scenes.filter((scene) => scene.id !== sceneId)
    setScenes(updatedScenes)

    // If we're deleting the current scene, switch to title page or another scene
    if (currentSceneId === sceneId) {
      if (updatedScenes.length > 0) {
        setCurrentSceneId(updatedScenes[0].id)
      } else {
        setCurrentView("title-page")
        setCurrentSceneId(null)
      }
    }
  }

  const handleSceneSelect = (sceneId: string) => {
    setCurrentView("scene")
    setCurrentSceneId(sceneId)
  }

  const handleTitlePageSelect = () => {
    setCurrentView("title-page")
    setCurrentSceneId(null)
  }

  const handleMainMenuSelect = (section: string) => {
    if (section === "script") {
      setShowScriptMenu(true)
      setActiveSection("script")
      // Default to title page when entering script section
      setCurrentView("title-page")
    } else {
      setActiveSection(section)
      setShowScriptMenu(false)
    }
  }

  const handleBackToMainMenu = () => {
    setShowScriptMenu(false)
    setActiveSection(null)
  }

  const handleTitlePageUpdate = (data: TitlePageData) => {
    setTitlePageData(data)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-gray-700 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back</span>
          </Link>
        </div>

        <div className="mb-6">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="text-3xl font-bold border-b-2 border-black focus:outline-none w-full"
          />
        </div>

        <div className="flex gap-6">
          {/* Left sidebar menu */}
          <div className="w-64 border border-gray-300">
            {showScriptMenu ? (
              <nav className="flex flex-col">
                <button
                  className="p-4 text-left hover:bg-gray-100 flex items-center text-gray-700"
                  onClick={handleBackToMainMenu}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  <span>Back</span>
                </button>

                <div className="border-t border-gray-200"></div>

                <button
                  className={`p-4 text-left hover:bg-gray-100 ${
                    currentView === "title-page" ? "bg-gray-100 font-medium" : ""
                  }`}
                  onClick={handleTitlePageSelect}
                >
                  Title Page
                </button>

                {scenes.map((scene, index) => (
                  <div key={scene.id} className="relative group">
                    <button
                      className={`p-4 text-left hover:bg-gray-100 w-full ${
                        currentSceneId === scene.id ? "bg-gray-100 font-medium" : ""
                      }`}
                      onClick={() => handleSceneSelect(scene.id)}
                    >
                      Scene {index + 1}
                    </button>
                    <button
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteScene(scene.id)
                      }}
                      title="Delete scene"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <button
                  className="p-4 text-left hover:bg-gray-100 text-gray-500 flex items-center"
                  onClick={addNewScene}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span>Add Scene</span>
                </button>
              </nav>
            ) : (
              <nav className="flex flex-col">
                <button
                  className={`p-4 text-left hover:bg-gray-100 ${
                    activeSection === "script" ? "bg-gray-100 font-medium" : ""
                  }`}
                  onClick={() => handleMainMenuSelect("script")}
                >
                  Script
                </button>
                <button
                  className={`p-4 text-left hover:bg-gray-100 ${
                    activeSection === "shot-list" ? "bg-gray-100 font-medium" : ""
                  }`}
                  onClick={() => handleMainMenuSelect("shot-list")}
                >
                  Shot List
                </button>
                <button
                  className={`p-4 text-left hover:bg-gray-100 ${
                    activeSection === "storyboard" ? "bg-gray-100 font-medium" : ""
                  }`}
                  onClick={() => handleMainMenuSelect("storyboard")}
                >
                  Storyboard
                </button>
                <button
                  className={`p-4 text-left hover:bg-gray-100 ${
                    activeSection === "ideation" ? "bg-gray-100 font-medium" : ""
                  }`}
                  onClick={() => handleMainMenuSelect("ideation")}
                >
                  Ideation
                </button>
              </nav>
            )}
          </div>

          {/* Main content area */}
          <div className="flex-1">
            {activeSection === "script" && (
              <div>
                <div className="mb-4 border-b pb-2">
                  <h2 className="text-xl font-medium">
                    {currentView === "title-page"
                      ? "Title Page"
                      : `Scene ${scenes.findIndex((s) => s.id === currentSceneId) + 1}`}
                  </h2>
                </div>

                <div className="border p-8 min-h-[600px] font-mono">
                  {currentView === "title-page" ? (
                    <TitlePage title={title} initialData={titlePageData} onUpdate={handleTitlePageUpdate} />
                  ) : currentView === "scene" && currentSceneId ? (
                    <ScriptEditor
                      scene={scenes.find((s) => s.id === currentSceneId)!}
                      onChange={(updatedScene) => {
                        setScenes(
                          scenes.map((s) => (s.id === currentSceneId ? { ...s, content: updatedScene.content } : s)),
                        )
                      }}
                    />
                  ) : (
                    <div className="text-center text-gray-500 mt-20">
                      <p>Select Title Page or add a new scene to get started</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === "shot-list" && (
              <div className="p-4 text-center text-gray-500">
                <p>Shot List section (not implemented in this demo)</p>
              </div>
            )}

            {activeSection === "storyboard" && (
              <div className="p-4 text-center text-gray-500">
                <p>Storyboard section (not implemented in this demo)</p>
              </div>
            )}

            {activeSection === "ideation" && (
              <div className="p-4 text-center text-gray-500">
                <p>Ideation section (not implemented in this demo)</p>
              </div>
            )}

            {!activeSection && (
              <div className="p-4 text-center text-gray-500">
                <p>Select an option from the menu to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
