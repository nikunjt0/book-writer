import type React from "react"
import Link from "next/link"
import { FilmIcon, BookIcon, MusicIcon } from "lucide-react"

export function ProjectCreation() {
  return (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-4xl font-bold text-black">Create a new project</h1>
      </div>

      <p className="text-lg italic mb-6 text-black">"There is nothing impossible to him who will try" - Alexander the Great</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/screenplay">
          <ProjectCard title="Create Screenplay" icon={<FilmIcon className="h-8 w-8" />} />
        </Link>
        <ProjectCard title="Create Book" icon={<BookIcon className="h-8 w-8" />} />
        <ProjectCard title="Create Song" icon={<MusicIcon className="h-8 w-8" />} />
      </div>
    </div>
  )
}

function ProjectCard({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="border rounded-md p-4 flex flex-col items-center justify-center h-40 cursor-pointer hover:bg-gray-50 transition-colors">
      <div className="text-lg font-medium mb-4 text-black">{title}</div>
      <div className="flex items-center justify-center text-black">{icon}</div>
    </div>
  )
}
