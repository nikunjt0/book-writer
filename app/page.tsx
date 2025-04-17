import { ImageGallery } from "@/components/image-gallery"
import { ProjectCreation } from "@/components/project-creation"
import { WritingTracker } from "@/components/writing-tracker"
import { PastProjects } from "@/components/past-projects"
import { getCurrentDate } from "@/lib/utils"

export default function Home() {
  const currentDate = getCurrentDate()

  return (
    <main className="min-h-screen bg-white">
      {/* Top image gallery with rotating themes */}
      <ImageGallery />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            {/* Project creation section */}
            <ProjectCreation />

            {/* Past projects section */}
            <PastProjects />
          </div>

          {/* Writing tracker on the right */}
          <div className="w-full md:w-80 lg:w-96">
            <h2 className="text-xl font-medium mb-2 text-black">{currentDate}</h2>
            <WritingTracker />
          </div>
        </div>
      </div>
    </main>
  )
}
