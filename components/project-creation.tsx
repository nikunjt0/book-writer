"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { firestore } from "@/lib/firebaseClient"
import { useAuth } from "@/contexts/AuthContext"
import { FilmIcon, BookIcon, MusicIcon } from "lucide-react"
import { v4 as uuid } from "uuid"

/* ---------- reusable card ---------- */
function ProjectCard({
  title,
  icon,
  onClick,
}: {
  title: string
  icon: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="border rounded-md p-4 flex flex-col items-center justify-center h-40 cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <div className="text-lg font-medium mb-4 text-black">{title}</div>
      <div className="flex items-center justify-center text-black">{icon}</div>
    </div>
  )
}

/* ---------- main ---------- */
export function ProjectCreation() {
  const { currentUser } = useAuth()
  const router = useRouter()

  const handleCreateScreenplay = async () => {
    if (!currentUser) {
      alert("You must be signed in to create a project.")
      return
    }

    const uid = currentUser.uid
    const screenplayId = uuid()

    /* doc path: users/{uid}/screenplays/{screenplayId} */
    const screenplayRef = doc(
      collection(firestore, "users", uid, "screenplays"),
      screenplayId,
    )

    /* basic metadata */
    await setDoc(screenplayRef, {
      screenplayTitle: "",
      authorName: "",
      authorAddress: "",
      authorCity: "",
      authorPhone: "",
      authorEmail: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    /* optional: create empty sub‑collections (no docs yet) */
    // await setDoc(doc(collection(screenplayRef, "script")), { placeholder: true })

    router.push(`/screenplay?id=${screenplayId}`)
  }

  return (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-4xl font-bold text-black">Create a new project</h1>
      </div>

      <p className="text-lg italic mb-6 text-black">
        "There is nothing impossible to him who will try" – Alexander the Great
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProjectCard
          title="Create Screenplay"
          icon={<FilmIcon className="h-8 w-8" />}
          onClick={handleCreateScreenplay}
        />

        {/* future placeholders */}
        <ProjectCard title="Create Book" icon={<BookIcon className="h-8 w-8" />} />
        <ProjectCard title="Create Song" icon={<MusicIcon className="h-8 w-8" />} />
      </div>
    </div>
  )
}
