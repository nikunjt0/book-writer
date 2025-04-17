"use client"

import { useState, useEffect, type MouseEvent } from "react"
import Link from "next/link"
import { FilmIcon, MusicIcon, BookIcon, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface Project {
  id: string
  title: string
  type: "screenplay" | "book" | "music"
  updatedAt: number
}

export function PastProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [open, setOpen] = useState(false)

  /* ───── load once ───── */
  useEffect(() => {
    loadProjects()
  }, [])

  /* helper to (re)load --------------------------------------------------- */
  const loadProjects = () => {
    /* screenplays */
    const screenplays = JSON.parse(localStorage.getItem("screenplays") || "[]")
    const screenplayProjects = screenplays.map((s: any) => ({
      id: s.id,
      title: s.title,
      type: "screenplay" as const,
      updatedAt: s.updatedAt,
    }))

    /* TODO: books / music later … */

    const all = [...screenplayProjects].sort((a, b) => b.updatedAt - a.updatedAt)
    setProjects(all)
  }

  /* delete handler ------------------------------------------------------- */
  const handleDeleteClick = (p: Project, e: MouseEvent) => {
    e.stopPropagation() /* don't trigger the row link */
    e.preventDefault()
    setProjectToDelete(p)
    setOpen(true)
  }

  const confirmDelete = () => {
    if (!projectToDelete) return

    if (projectToDelete.type === "screenplay") {
      const stored = JSON.parse(localStorage.getItem("screenplays") || "[]")
      const updated = stored.filter((s: any) => s.id !== projectToDelete.id)
      localStorage.setItem("screenplays", JSON.stringify(updated))
    }
    /* add similar blocks for books / music when you store them */

    loadProjects()
    setProjectToDelete(null)
    setOpen(false)
  }

  /* ───── render --------------------------------------------------------- */
  if (projects.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Open Past Project</h2>
        <div className="text-gray-500 p-4 border rounded-md">
          <p>No projects yet. Create a new project to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Open Past Project</h2>

      <div className="space-y-1">
        {projects.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3 border-b hover:bg-gray-50">
            {/* clickable title / icon */}
            <Link
              href={`/${p.type === "screenplay" ? "screenplay" : p.type}?id=${p.id}`}
              className="flex flex-1 items-center gap-3"
            >
              {p.type === "screenplay" ? (
                <FilmIcon className="h-5 w-5 text-gray-700" />
              ) : p.type === "music" ? (
                <MusicIcon className="h-5 w-5 text-gray-700" />
              ) : (
                <BookIcon className="h-5 w-5 text-gray-700" />
              )}
              <span className="font-medium truncate">{p.title}</span>
            </Link>

            {/* trash button */}
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => handleDeleteClick(p, e)}
              aria-label="Delete project"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{projectToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
