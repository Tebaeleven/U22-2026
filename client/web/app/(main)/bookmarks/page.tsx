import { requireAuth } from "@/lib/supabase/auth"
import { getBookmarkFolders, getAllBookmarks } from "@/lib/supabase/queries"
import { FolderManager } from "./folder-manager"

export default async function BookmarksPage() {
  await requireAuth()

  const [folders, bookmarks] = await Promise.all([
    getBookmarkFolders(),
    getAllBookmarks(),
  ])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">ブックマーク</h1>
      <FolderManager folders={folders} bookmarks={bookmarks} />
    </div>
  )
}
