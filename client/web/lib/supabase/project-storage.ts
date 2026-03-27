import type { SupabaseClient } from "@supabase/supabase-js"
import type { SpriteDef } from "@/features/editor/constants"
import type { BlockProjectData } from "@/features/editor/block-editor/types"

const BUCKET = "project-files"
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

/** Storage パスから公開URLを構築。`/` 始まりはローカル静的ファイルとしてそのまま返す */
export function getStorageUrl(path: string, bucket: string = BUCKET): string {
  if (!path) return ""
  if (path.startsWith("http") || path.startsWith("/")) return path
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}

/** プロジェクトデータの JSON 構造 */
export interface ProjectData {
  version: number
  sprites: SpriteDef[]
  /** スプライトごとのブロックデータ（spriteId → BlockProjectData） */
  blocks: Record<string, BlockProjectData>
}

/** project.json のデフォルト値 */
export function createDefaultProjectData(): ProjectData {
  return {
    version: 1,
    sprites: [],
    blocks: {},
  }
}

/** Storage 内のファイルパスを構築 */
function filePath(userId: string, projectId: string, filename: string) {
  return `${userId}/${projectId}/${filename}`
}

/** 公開URLを取得 */
export function getProjectFileUrl(userId: string, projectId: string, filename: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${filePath(userId, projectId, filename)}`
}

/** project.json を保存 */
export async function saveProjectData(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  data: ProjectData,
) {
  const path = filePath(userId, projectId, "project.json")
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" })

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true })

  if (error) throw error
}

/** project.json を読み込み */
export async function loadProjectData(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<ProjectData | null> {
  const path = filePath(userId, projectId, "project.json")

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(path)

  if (error) return null

  const text = await data.text()
  const parsed = JSON.parse(text) as Partial<ProjectData>

  return {
    version: parsed.version ?? 1,
    sprites: parsed.sprites ?? [],
    blocks:
      parsed.blocks &&
      typeof parsed.blocks === "object" &&
      !Array.isArray(parsed.blocks)
        ? (parsed.blocks as Record<string, BlockProjectData>)
        : {},
  }
}

/** サムネイル画像をアップロードし、公開URLを返す */
export async function uploadThumbnail(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  file: Blob,
) {
  const path = filePath(userId, projectId, "thumbnail.png")

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: "image/png",
    })

  if (error) throw error

  return filePath(userId, projectId, "thumbnail.png")
}

/** 素材ファイルをアップロード（将来用） */
export async function uploadAsset(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  filename: string,
  file: Blob,
) {
  const path = filePath(userId, projectId, `assets/${filename}`)

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true })

  if (error) throw error

  return path
}
