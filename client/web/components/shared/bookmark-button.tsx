"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toggleBookmark, moveBookmarkToFolder } from "@/lib/supabase/mutations"

interface BookmarkButtonProps {
  projectId: number
  currentUserId: string | null
  initialBookmarked: boolean
  folders?: { id: string; name: string }[]
  currentFolderId?: string | null
}

export function BookmarkButton({
  projectId,
  currentUserId,
  initialBookmarked,
  folders = [],
  currentFolderId = null,
}: BookmarkButtonProps) {
  const router = useRouter()
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [loading, setLoading] = useState(false)

  const handleToggle = useCallback(async () => {
    if (!currentUserId) return
    setBookmarked((prev) => !prev)
    setLoading(true)
    try {
      const result = await toggleBookmark(projectId)
      setBookmarked(result)
      router.refresh()
    } catch {
      setBookmarked(initialBookmarked)
    } finally {
      setLoading(false)
    }
  }, [currentUserId, projectId, initialBookmarked, router])

  const handleMoveToFolder = useCallback(
    async (folderId: string | null) => {
      if (!currentUserId) return
      try {
        if (!bookmarked) {
          // まだブックマークしていない場合は追加
          await toggleBookmark(projectId, folderId ?? undefined)
          setBookmarked(true)
        } else {
          await moveBookmarkToFolder(projectId, folderId)
        }
        router.refresh()
      } catch {
        // エラー時は何もしない
      }
    },
    [currentUserId, projectId, bookmarked, router],
  )

  if (!currentUserId) return null

  // フォルダがある場合はドロップダウンメニュー付き
  if (bookmarked && folders.length > 0) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            className={bookmarked ? "text-yellow-600" : ""}
          >
            <Bookmark
              className={`size-4 mr-1 ${bookmarked ? "fill-yellow-500 text-yellow-600" : ""}`}
            />
            {bookmarked ? "保存済み" : "保存"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={handleToggle}>
            ブックマークを解除
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleMoveToFolder(null)}
            className={currentFolderId === null ? "font-bold" : ""}
          >
            未分類
          </DropdownMenuItem>
          {folders.map((folder) => (
            <DropdownMenuItem
              key={folder.id}
              onClick={() => handleMoveToFolder(folder.id)}
              className={currentFolderId === folder.id ? "font-bold" : ""}
            >
              {folder.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={bookmarked ? "text-yellow-600" : ""}
    >
      <Bookmark
        className={`size-4 mr-1 ${bookmarked ? "fill-yellow-500 text-yellow-600" : ""}`}
      />
      {bookmarked ? "保存済み" : "保存"}
    </Button>
  )
}
