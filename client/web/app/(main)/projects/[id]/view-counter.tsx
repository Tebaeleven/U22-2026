"use client"

import { useEffect, useState } from "react"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { incrementProjectViews } from "@/lib/supabase/mutations"

interface ViewCounterProps {
  projectId: number
  initialViews: number
  isOwner: boolean
}

export function ViewCounter({ projectId, initialViews, isOwner }: ViewCounterProps) {
  const [views, setViews] = useState(initialViews)

  useEffect(() => {
    if (isOwner) return

    const key = `viewed_project_${projectId}`
    if (sessionStorage.getItem(key)) return

    sessionStorage.setItem(key, "1")
    setViews((v) => v + 1)
    incrementProjectViews(projectId)
  }, [projectId, isOwner])

  return (
    <Button variant="outline" size="sm">
      <Eye className="size-4 mr-1" />
      {views}
    </Button>
  )
}
