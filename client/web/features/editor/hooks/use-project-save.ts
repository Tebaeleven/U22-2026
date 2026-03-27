"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  saveProjectData,
  loadProjectData,
  uploadThumbnail,
  type ProjectData,
} from "@/lib/supabase/project-storage"
import type { SpriteDef } from "@/features/editor/constants"

interface UseProjectSaveOptions {
  projectName: string
  setProjectName: (name: string) => void
  sprites: SpriteDef[]
  setSprites: (sprites: SpriteDef[]) => void
}

export function useProjectSave({
  projectName,
  setProjectName,
  sprites,
  setSprites,
}: UseProjectSaveOptions) {
  const router = useRouter()
  const supabase = createClient()

  const [projectId, setProjectId] = useState<number | null>(null)
  const [authorId, setAuthorId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  /** 認証チェック。未認証ならリダイレクト */
  const ensureAuth = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/signin")
      return null
    }
    return user
  }, [supabase, router])

  /** プロジェクトを保存 */
  const saveProject = useCallback(async () => {
    const user = await ensureAuth()
    if (!user) return

    setIsSaving(true)
    try {
      let currentId: number

      // 新規プロジェクトなら DB にレコード作成
      if (!projectId) {
        const { data, error } = await supabase
          .from("projects")
          .insert({ author_id: user.id, title: projectName })
          .select("id")
          .single()

        if (error) throw error
        currentId = data.id
        setProjectId(currentId)
        setAuthorId(user.id)

        // URL を更新（履歴に追加）
        window.history.replaceState(null, "", `/editor?id=${currentId}`)
      } else {
        currentId = projectId
        // 既存プロジェクトのタイトルを更新
        await supabase
          .from("projects")
          .update({ title: projectName, updated_at: new Date().toISOString() })
          .eq("id", currentId)
      }

      // project.json を Storage に保存
      const projectData: ProjectData = {
        version: 1,
        sprites,
        blocks: {},
      }
      await saveProjectData(supabase, user.id, String(currentId), projectData)
    } finally {
      setIsSaving(false)
    }
  }, [ensureAuth, projectId, projectName, sprites, supabase])

  /** プロジェクトを共有（保存 + shared=true） */
  const shareProject = useCallback(async () => {
    await saveProject()
    if (!projectId) return

    await supabase
      .from("projects")
      .update({ shared: true, updated_at: new Date().toISOString() })
      .eq("id", projectId)
  }, [saveProject, projectId, supabase])

  /** プロジェクトを読み込み */
  const loadProject = useCallback(async (id: string) => {
    const numericId = Number(id)
    setIsLoading(true)
    try {
      // DB からメタデータを取得
      const { data: project } = await supabase
        .from("projects")
        .select("*, profiles!projects_author_id_fkey(username)")
        .eq("id", numericId)
        .single()

      if (!project) return

      setProjectId(numericId)
      setAuthorId(project.author_id)
      setProjectName(project.title)

      // Storage から project.json を読み込み
      const projectData = await loadProjectData(supabase, project.author_id, String(numericId))
      if (projectData?.sprites && projectData.sprites.length > 0) {
        setSprites(projectData.sprites)
      }
    } finally {
      setIsLoading(false)
    }
  }, [supabase, setProjectName, setSprites])

  /** サムネイルを設定 */
  const saveThumbnail = useCallback(async (blob: Blob) => {
    const user = await ensureAuth()
    if (!user || !projectId) return

    const url = await uploadThumbnail(supabase, user.id, String(projectId), blob)

    await supabase
      .from("projects")
      .update({ thumbnail_url: url, updated_at: new Date().toISOString() })
      .eq("id", projectId)
  }, [ensureAuth, projectId, supabase])

  return {
    projectId,
    authorId,
    isSaving,
    isLoading,
    saveProject,
    shareProject,
    loadProject,
    saveThumbnail,
  }
}
