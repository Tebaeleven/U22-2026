"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"

const EditorContent = dynamic(
  () => import("@/features/editor/components/editor-content").then((m) => m.EditorContent),
  { ssr: false },
)

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  )
}
