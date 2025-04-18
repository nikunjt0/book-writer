"use client"

import { useState, useEffect, MouseEvent } from "react"
import Link from "next/link"
import { FilmIcon, Trash2 } from "lucide-react"
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

import { useAuth } from "@/contexts/AuthContext"
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore"
import { firestore } from "@/lib/firebaseClient"

interface Project {
  id: string
  title: string
  updatedAt: number
}

export function PastProjects() {
  const { currentUser } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [open, setOpen] = useState(false)

  /* ---- load screenplays for this user ---- */
  useEffect(() => {
    if (currentUser) loadProjects()
  }, [currentUser])

  const loadProjects = async () => {
    if (!currentUser) return

    const colRef = collection(firestore, "users", currentUser.uid, "screenplays")
    const snap = await getDocs(colRef)

    const list: Project[] = snap.docs.map((d) => {
      const data = d.data() as any
      return {
        id: d.id,
        title: data.screenplayTitle || "Untitled",
        updatedAt: data.updatedAt || 0,
      }
    })

    setProjects(list.sort((a, b) => b.updatedAt - a.updatedAt))
  }

  /* ---- delete ---- */
  const handleDeleteClick = (p: Project, e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setProjectToDelete(p)
    setOpen(true)
  }

  const confirmDelete = async () => {
    if (!currentUser || !projectToDelete) return
    const docRef = doc(
      firestore,
      "users",
      currentUser.uid,
      "screenplays",
      projectToDelete.id,
    )

    await deleteDoc(docRef)
    // optional: also delete sub‑collections (script, storyboard…) here

    setOpen(false)
    setProjectToDelete(null)
    loadProjects()
  }

  /* ---- UI ---- */
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
            <Link href={`/screenplay?id=${p.id}`} className="flex flex-1 items-center gap-3">
              <FilmIcon className="h-5 w-5 text-gray-700" />
              <span className="font-medium truncate">{p.title}</span>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => handleDeleteClick(p, e)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* delete confirmation */}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this screenplay?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting “{projectToDelete?.title}” cannot be undone.
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
