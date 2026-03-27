import { createClient } from "./server"
import type { Tables } from "./database.types"

// プロジェクト + 著者情報の型
export type ProjectWithAuthor = Tables<"projects"> & {
  profiles: Pick<Tables<"profiles">, "username" | "display_name" | "avatar_url">
}

// コメント + 著者情報の型
export type CommentWithAuthor = Tables<"comments"> & {
  profiles: Pick<Tables<"profiles">, "username" | "display_name" | "avatar_url">
}

// 通知 + アクター情報 + プロジェクト情報の型
export type NotificationWithActor = Tables<"notifications"> & {
  profiles: Pick<Tables<"profiles">, "username" | "display_name" | "avatar_url">
  projects: Pick<Tables<"projects">, "title"> | null
}

// スタジオ + キュレーター + プロジェクトの型
export type StudioWithDetails = Tables<"studios"> & {
  studio_curators: {
    profiles: Pick<Tables<"profiles">, "username" | "display_name" | "avatar_url">
  }[]
  studio_projects: {
    projects: ProjectWithAuthor
  }[]
}

const PROJECT_WITH_AUTHOR_SELECT = "*, profiles!projects_author_id_fkey(username, display_name, avatar_url)" as const

/** 注目プロジェクトを取得 */
export async function getFeaturedProjects() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_WITH_AUTHOR_SELECT)
    .eq("featured", true)
    .eq("shared", true)
    .order("created_at", { ascending: false })
  return (data ?? []) as ProjectWithAuthor[]
}

/** 公開プロジェクトを取得（カテゴリフィルタ対応） */
export async function getSharedProjects(category?: string) {
  const supabase = await createClient()
  let query = supabase
    .from("projects")
    .select(PROJECT_WITH_AUTHOR_SELECT)
    .eq("shared", true)
    .order("created_at", { ascending: false })

  if (category && category !== "all") {
    query = query.contains("tags", [category])
  }

  const { data } = await query
  return (data ?? []) as ProjectWithAuthor[]
}

/** プロジェクトをIDで取得 */
export async function getProjectById(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_WITH_AUTHOR_SELECT)
    .eq("id", id)
    .single()
  return data as ProjectWithAuthor | null
}

/** プロジェクトの全コメントを取得（トップレベル + 返信） */
export async function getCommentsByProjectId(projectId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("comments")
    .select("*, profiles!comments_author_id_fkey(username, display_name, avatar_url)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
  return (data ?? []) as CommentWithAuthor[]
}

/** ユーザーがいいね済みのコメントIDセットを取得 */
export async function getCommentLovesByUser(userId: string, commentIds: string[]) {
  if (commentIds.length === 0) return new Set<string>()
  const supabase = await createClient()
  const { data } = await supabase
    .from("comment_loves")
    .select("comment_id")
    .eq("user_id", userId)
    .in("comment_id", commentIds)
  return new Set((data ?? []).map((d) => d.comment_id))
}

/** コメントの返信を取得 */
export async function getRepliesByCommentId(commentId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("comments")
    .select("*, profiles!comments_author_id_fkey(username, display_name, avatar_url)")
    .eq("parent_id", commentId)
    .order("created_at", { ascending: true })
  return (data ?? []) as CommentWithAuthor[]
}

/** ログインユーザーの全作品を取得（公開・非公開両方） */
export async function getMyProjects(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_WITH_AUTHOR_SELECT)
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
  return (data ?? []) as ProjectWithAuthor[]
}

/** プロジェクト検索 */
export async function searchProjects(query: string) {
  const supabase = await createClient()
  const pattern = `%${query}%`
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_WITH_AUTHOR_SELECT)
    .eq("shared", true)
    .or(`title.ilike.${pattern},description.ilike.${pattern}`)
    .order("created_at", { ascending: false })
  return (data ?? []) as ProjectWithAuthor[]
}

/** ユーザー検索 */
export async function searchProfiles(query: string) {
  const supabase = await createClient()
  const pattern = `%${query}%`
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
  return (data ?? []) as Tables<"profiles">[]
}

/** スタジオ検索 */
export async function searchStudios(query: string) {
  const supabase = await createClient()
  const pattern = `%${query}%`
  const { data } = await supabase
    .from("studios")
    .select("*, studio_projects(project_id)")
    .or(`title.ilike.${pattern},description.ilike.${pattern}`)
  return (data ?? []) as (Tables<"studios"> & { studio_projects: { project_id: number }[] })[]
}

/** スタジオをIDで取得（キュレーター・プロジェクト含む） */
export async function getStudioById(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("studios")
    .select(`
      *,
      studio_curators(profiles(username, display_name, avatar_url)),
      studio_projects(projects(*, profiles!projects_author_id_fkey(username, display_name, avatar_url)))
    `)
    .eq("id", id)
    .single()
  return data as StudioWithDetails | null
}

/** ユーザーをユーザー名で取得 */
export async function getProfileByUsername(username: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single()
  return data as Tables<"profiles"> | null
}

/** ユーザーの公開プロジェクトを取得 */
export async function getProjectsByAuthor(authorId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_WITH_AUTHOR_SELECT)
    .eq("author_id", authorId)
    .eq("shared", true)
    .order("created_at", { ascending: false })
  return (data ?? []) as ProjectWithAuthor[]
}

/** ユーザーの作品数を取得 */
export async function getProjectCountByAuthor(authorId: string) {
  const supabase = await createClient()
  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("author_id", authorId)
    .eq("shared", true)
  return count ?? 0
}

/** プロジェクトを新規作成し、IDを返す */
export async function createProject(userId: string, title: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .insert({ author_id: userId, title })
    .select("id")
    .single()

  if (error) throw error
  return data.id as number
}

/** プロジェクトを更新 */
export async function updateProject(
  projectId: string,
  updates: Partial<Pick<Tables<"projects">, "title" | "description" | "instructions" | "thumbnail_url" | "tags" | "shared">>,
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)

  if (error) throw error
}

/** プロジェクトを削除 */
export async function deleteProject(projectId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)

  if (error) throw error
}

// ==========================================
// Love（いいね）
// ==========================================

/** ユーザーがプロジェクトをいいね済みか確認 */
export async function hasUserLovedProject(userId: string, projectId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("project_loves")
    .select("user_id")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .maybeSingle()
  return !!data
}

// ==========================================
// リミックス
// ==========================================

/** プロジェクトのリミックス一覧を取得 */
export async function getRemixesByProjectId(projectId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_WITH_AUTHOR_SELECT)
    .eq("parent_id", projectId)
    .eq("shared", true)
    .order("created_at", { ascending: false })
  return (data ?? []) as ProjectWithAuthor[]
}

/** リミックス元のプロジェクトを取得 */
export async function getParentProject(parentId: number) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_WITH_AUTHOR_SELECT)
    .eq("id", parentId)
    .single()
  return data as ProjectWithAuthor | null
}

// ==========================================
// フォロー
// ==========================================

/** フォロー済みか確認 */
export async function isFollowing(followerId: string, followingId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle()
  return !!data
}

/** フォロワー数・フォロー数を取得 */
export async function getFollowCounts(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase.rpc("get_follow_counts", { p_user_id: userId }).single()
  return (data ?? { follower_count: 0, following_count: 0 }) as {
    follower_count: number
    following_count: number
  }
}

/** フォロワー一覧を取得 */
export async function getFollowers(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("follows")
    .select("follower:profiles!follows_follower_id_fkey(id, username, display_name, avatar_url)")
    .eq("following_id", userId)
    .order("created_at", { ascending: false })
  type Row = { follower: Pick<Tables<"profiles">, "id" | "username" | "display_name" | "avatar_url"> }
  return (data ?? []).map((d) => (d as unknown as Row).follower)
}

/** フォロー中一覧を取得 */
export async function getFollowing(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("follows")
    .select("following:profiles!follows_following_id_fkey(id, username, display_name, avatar_url)")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
  type Row = { following: Pick<Tables<"profiles">, "id" | "username" | "display_name" | "avatar_url"> }
  return (data ?? []).map((d) => (d as unknown as Row).following)
}

// ==========================================
// 通知
// ==========================================

/** 通知一覧を取得 */
export async function getNotifications(limit = 50) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("notifications")
    .select("*, profiles!notifications_actor_id_fkey(username, display_name, avatar_url), projects(title)")
    .order("created_at", { ascending: false })
    .limit(limit)
  return (data ?? []) as NotificationWithActor[]
}

/** 未読通知数を取得 */
export async function getUnreadNotificationCount() {
  const supabase = await createClient()
  const { data } = await supabase.rpc("get_unread_notification_count")
  return (data ?? 0) as number
}

// ==========================================
// ランキング（著者情報付き）
// ==========================================

/** トレンドプロジェクトを取得（loves*3 + views*0.1 + remixes*5 を新しさで割る） */
export async function getTrendingProjects(limit = 20) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_WITH_AUTHOR_SELECT)
    .eq("shared", true)
    .order("loves", { ascending: false })
    .limit(limit * 2)
  if (!data) return [] as ProjectWithAuthor[]

  const now = Date.now()
  const scored = (data as ProjectWithAuthor[]).map((p) => {
    const ageInDays = (now - new Date(p.created_at).getTime()) / 86_400_000
    const score = (p.loves * 3 + p.views * 0.1 + p.remixes * 5) / (1 + ageInDays)
    return { project: p, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.project)
}

/** いいね数ランキングを取得 */
export async function getMostLovedProjects(limit = 20) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_WITH_AUTHOR_SELECT)
    .eq("shared", true)
    .order("loves", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)
  return (data ?? []) as ProjectWithAuthor[]
}

/** 閲覧数ランキングを取得 */
export async function getMostViewedProjects(limit = 20) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_WITH_AUTHOR_SELECT)
    .eq("shared", true)
    .order("views", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)
  return (data ?? []) as ProjectWithAuthor[]
}

/** 最新プロジェクトを取得 */
export async function getRecentProjects(limit = 20) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_WITH_AUTHOR_SELECT)
    .eq("shared", true)
    .order("created_at", { ascending: false })
    .limit(limit)
  return (data ?? []) as ProjectWithAuthor[]
}

// ==========================================
// ブックマーク
// ==========================================

// ブックマーク + プロジェクト情報の型
export type BookmarkWithProject = Tables<"bookmarks"> & {
  projects: ProjectWithAuthor
}

/** ブックマークフォルダ一覧を取得 */
export async function getBookmarkFolders() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("bookmark_folders")
    .select("*")
    .order("created_at", { ascending: true })
  return (data ?? []) as Tables<"bookmark_folders">[]
}

/** 全ブックマークを取得（プロジェクト情報付き） */
export async function getAllBookmarks() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("bookmarks")
    .select(`*, projects(${PROJECT_WITH_AUTHOR_SELECT})`)
    .order("created_at", { ascending: false })
  return (data ?? []) as BookmarkWithProject[]
}

/** ユーザーがブックマーク済みか確認 */
export async function hasUserBookmarked(userId: string, projectId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("project_id", Number(projectId))
    .maybeSingle()
  return !!data
}
