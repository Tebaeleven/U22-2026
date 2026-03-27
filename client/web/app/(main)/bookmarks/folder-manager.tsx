"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  FolderPlus,
  Trash2,
  Pencil,
  Bookmark,
  FolderOpen,
  Inbox,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ProjectCard } from "@/components/shared/project-card"
import {
  createBookmarkFolder,
  deleteBookmarkFolder,
  renameBookmarkFolder,
  moveBookmarkToFolder,
  toggleBookmark,
} from "@/lib/supabase/mutations"
import type { Tables } from "@/lib/supabase/database.types"
import type { BookmarkWithProject } from "@/lib/supabase/queries"

// フォルダID: null=未分類、"all"=すべて
type FolderFilter = string | null | "all"

interface FolderManagerProps {
  folders: Tables<"bookmark_folders">[]
  bookmarks: BookmarkWithProject[]
}

export function FolderManager({ folders, bookmarks }: FolderManagerProps) {
  const router = useRouter()
  const [selectedFolder, setSelectedFolder] = useState<FolderFilter>("all")
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [renameTarget, setRenameTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [renameValue, setRenameValue] = useState("")

  const filteredBookmarks =
    selectedFolder === "all"
      ? bookmarks
      : bookmarks.filter((b) => b.folder_id === selectedFolder)

  const handleCreateFolder = useCallback(async () => {
    const trimmed = newFolderName.trim()
    if (!trimmed) return
    await createBookmarkFolder(trimmed)
    setNewFolderName("")
    setNewFolderDialogOpen(false)
    router.refresh()
  }, [newFolderName, router])

  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      await deleteBookmarkFolder(folderId)
      if (selectedFolder === folderId) setSelectedFolder("all")
      router.refresh()
    },
    [selectedFolder, router],
  )

  const handleRename = useCallback(async () => {
    if (!renameTarget) return
    const trimmed = renameValue.trim()
    if (!trimmed) return
    await renameBookmarkFolder(renameTarget.id, trimmed)
    setRenameTarget(null)
    setRenameValue("")
    router.refresh()
  }, [renameTarget, renameValue, router])

  const handleRemoveBookmark = useCallback(
    async (projectId: number) => {
      await toggleBookmark(projectId)
      router.refresh()
    },
    [router],
  )

  const handleMoveToFolder = useCallback(
    async (projectId: number, folderId: string | null) => {
      await moveBookmarkToFolder(projectId, folderId)
      router.refresh()
    },
    [router],
  )

  return (
    <div className="grid gap-6 md:grid-cols-[240px_1fr]">
      {/* フォルダサイドバー */}
      <aside className="space-y-1">
        <button
          onClick={() => setSelectedFolder("all")}
          className={`flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            selectedFolder === "all"
              ? "bg-[#18181B]/[0.08] text-[#18181B]"
              : "text-muted-foreground hover:bg-[#18181B]/[0.04]"
          }`}
        >
          <Bookmark className="size-4" />
          すべて
          <span className="ml-auto text-xs text-muted-foreground">
            {bookmarks.length}
          </span>
        </button>
        <button
          onClick={() => setSelectedFolder(null)}
          className={`flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            selectedFolder === null
              ? "bg-[#18181B]/[0.08] text-[#18181B]"
              : "text-muted-foreground hover:bg-[#18181B]/[0.04]"
          }`}
        >
          <Inbox className="size-4" />
          未分類
          <span className="ml-auto text-xs text-muted-foreground">
            {bookmarks.filter((b) => b.folder_id === null).length}
          </span>
        </button>

        {folders.map((folder) => {
          const count = bookmarks.filter(
            (b) => b.folder_id === folder.id,
          ).length
          return (
            <div
              key={folder.id}
              className={`group flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                selectedFolder === folder.id
                  ? "bg-[#18181B]/[0.08] text-[#18181B]"
                  : "text-muted-foreground hover:bg-[#18181B]/[0.04]"
              }`}
              onClick={() => setSelectedFolder(folder.id)}
            >
              <FolderOpen className="size-4 shrink-0" />
              <span className="truncate flex-1">{folder.name}</span>
              <span className="text-xs text-muted-foreground">{count}</span>
              <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setRenameTarget({ id: folder.id, name: folder.name })
                    setRenameValue(folder.name)
                  }}
                  className="p-0.5 rounded hover:bg-[#18181B]/10"
                >
                  <Pencil className="size-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteFolder(folder.id)
                  }}
                  className="p-0.5 rounded hover:bg-red-100 text-red-500"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>
          )
        })}

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground mt-2"
          onClick={() => setNewFolderDialogOpen(true)}
        >
          <FolderPlus className="size-4 mr-2" />
          新しいフォルダ
        </Button>
      </aside>

      {/* ブックマーク一覧 */}
      <div>
        {filteredBookmarks.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3">
            {filteredBookmarks.map((bookmark) => (
              <div key={bookmark.id} className="group relative">
                <ProjectCard project={bookmark.projects} />
                {/* ホバー時の操作メニュー */}
                <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1">
                  {folders.length > 0 && (
                    <select
                      className="text-xs bg-white/90 rounded px-1 py-0.5 border shadow-sm"
                      value={bookmark.folder_id ?? ""}
                      onChange={(e) =>
                        handleMoveToFolder(
                          bookmark.project_id,
                          e.target.value || null,
                        )
                      }
                      onClick={(e) => e.preventDefault()}
                    >
                      <option value="">未分類</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleRemoveBookmark(bookmark.project_id)
                    }}
                    className="p-1 rounded bg-white/90 shadow-sm hover:bg-red-50 text-red-500"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bookmark className="size-12 mb-4 opacity-30" />
            <p>
              {selectedFolder === "all"
                ? "ブックマークはまだありません"
                : "このフォルダにはブックマークがありません"}
            </p>
          </div>
        )}
      </div>

      {/* 新規フォルダダイアログ */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>新しいフォルダ</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="フォルダ名"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              作成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* フォルダ名変更ダイアログ */}
      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>フォルダ名を変更</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="フォルダ名"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
          />
          <DialogFooter>
            <Button onClick={handleRename} disabled={!renameValue.trim()}>
              変更
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
