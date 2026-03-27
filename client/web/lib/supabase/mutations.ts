import { createClient } from "./client"

// ==========================================
// Love（いいね）- クライアントサイドミューテーション
// ==========================================

/** いいねをトグル（true=loved, false=unloved） */
export async function toggleProjectLove(projectId: number) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc("toggle_project_love", {
    p_project_id: projectId,
  })
  if (error) throw error
  return data as boolean
}

// ==========================================
// 閲覧数
// ==========================================

/** ビューカウントをインクリメント */
export async function incrementProjectViews(projectId: number) {
  const supabase = createClient()
  const { error } = await supabase.rpc("increment_project_views", {
    p_project_id: projectId,
  })
  if (error) throw error
}

// ==========================================
// リミックス
// ==========================================

/** リミックスを作成し、新プロジェクトIDを返す */
export async function createRemix(parentId: number, title: string) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc("create_remix", {
    p_parent_id: parentId,
    p_title: title,
  })
  if (error) throw error
  return data as number
}

// ==========================================
// フォロー
// ==========================================

/** フォローをトグル（true=followed, false=unfollowed） */
export async function toggleFollow(followingId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc("toggle_follow", {
    p_following_id: followingId,
  })
  if (error) throw error
  return data as boolean
}

// ==========================================
// 通知
// ==========================================

/** 全通知を既読にする */
export async function markNotificationsRead() {
  const supabase = createClient()
  const { error } = await supabase.rpc("mark_notifications_read")
  if (error) throw error
}

// ==========================================
// コメントいいね
// ==========================================

/** コメントいいねをトグル（true=loved, false=unloved） */
export async function toggleCommentLove(commentId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc("toggle_comment_love", {
    p_comment_id: commentId,
  })
  if (error) throw error
  return data as boolean
}

// ==========================================
// コメント
// ==========================================

/** コメントを投稿（parentId があれば返信） */
export async function addComment(projectId: number, content: string, parentId?: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("ログインが必要です")

  const { error } = await supabase
    .from("comments")
    .insert({
      project_id: projectId,
      author_id: user.id,
      content,
      ...(parentId ? { parent_id: parentId } : {}),
    })
  if (error) throw error
}

/** コメントを編集 */
export async function updateComment(commentId: string, content: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("comments")
    .update({ content })
    .eq("id", commentId)
  if (error) throw error
}

/** コメントを削除 */
export async function deleteComment(commentId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
  if (error) throw error
}

// ==========================================
// ブックマーク
// ==========================================

/** ブックマークをトグル（true=bookmarked, false=unbookmarked） */
export async function toggleBookmark(projectId: number, folderId?: string) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc("toggle_bookmark", {
    p_project_id: projectId,
    p_folder_id: folderId ?? null,
  })
  if (error) throw error
  return data as boolean
}

/** ブックマークフォルダを作成 */
export async function createBookmarkFolder(name: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("ログインが必要です")

  const { data, error } = await supabase
    .from("bookmark_folders")
    .insert({ user_id: user.id, name })
    .select()
    .single()
  if (error) throw error
  return data
}

/** ブックマークフォルダを削除 */
export async function deleteBookmarkFolder(folderId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("bookmark_folders")
    .delete()
    .eq("id", folderId)
  if (error) throw error
}

/** ブックマークフォルダ名を変更 */
export async function renameBookmarkFolder(folderId: string, name: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("bookmark_folders")
    .update({ name })
    .eq("id", folderId)
  if (error) throw error
}

/** ブックマークのフォルダを移動 */
export async function moveBookmarkToFolder(projectId: number, folderId: string | null) {
  const supabase = createClient()
  const { error } = await supabase.rpc("move_bookmark_to_folder", {
    p_project_id: projectId,
    p_folder_id: folderId,
  })
  if (error) throw error
}
