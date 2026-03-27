"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Pencil, X, Check, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

const TAG_SUGGESTIONS = [
  "ゲーム",
  "アート",
  "シューティング",
  "パズル",
  "アニメーション",
  "音楽",
  "物語",
  "シミュレーション",
] as const

interface ProjectSidebarProps {
  project: {
    id: number
    title: string
    description: string | null
    instructions: string | null
    tags: string[]
    created_at: string
    profiles: {
      username: string
      display_name: string
    }
  }
  isOwner: boolean
}

type EditingField = "description" | "instructions" | null

export function ProjectSidebar({ project, isOwner }: ProjectSidebarProps) {
  const router = useRouter()
  const supabase = createClient()

  const [editingField, setEditingField] = useState<EditingField>(null)
  const [editValue, setEditValue] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isEditingTags, setIsEditingTags] = useState(false)
  const [tagInput, setTagInput] = useState("")
  const [localTags, setLocalTags] = useState(project.tags)

  const startEditing = useCallback((field: "description" | "instructions") => {
    setEditingField(field)
    setEditValue(
      field === "description"
        ? project.description ?? ""
        : project.instructions ?? ""
    )
  }, [project.description, project.instructions])

  const cancelEditing = useCallback(() => {
    setEditingField(null)
    setEditValue("")
  }, [])

  const saveField = useCallback(async () => {
    if (!editingField) return
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("projects")
        .update({ [editingField]: editValue, updated_at: new Date().toISOString() })
        .eq("id", project.id)
      if (error) {
        console.error("保存に失敗:", error.message)
        return
      }
      setEditingField(null)
      setEditValue("")
      router.refresh()
    } finally {
      setIsSaving(false)
    }
  }, [editingField, editValue, project.id, supabase, router])

  const saveTags = useCallback(async (newTags: string[]) => {
    setLocalTags(newTags)
    const { error } = await supabase
      .from("projects")
      .update({ tags: newTags, updated_at: new Date().toISOString() })
      .eq("id", project.id)
    if (error) {
      console.error("タグの保存に失敗:", error.message)
      setLocalTags(project.tags)
      return
    }
    router.refresh()
  }, [project.id, project.tags, supabase, router])

  const addTag = useCallback((tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed || localTags.includes(trimmed)) return
    saveTags([...localTags, trimmed])
  }, [localTags, saveTags])

  const removeTag = useCallback((tag: string) => {
    saveTags(localTags.filter((t) => t !== tag))
  }, [localTags, saveTags])

  const handleTagInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag(tagInput)
      setTagInput("")
    }
  }, [tagInput, addTag])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{project.title}</h1>
        <Link
          href={`/users/${project.profiles.username}`}
          className="text-sm text-[#4d97ff] hover:underline mt-1 block"
        >
          {project.profiles.display_name}
        </Link>
      </div>

      <Separator />

      {/* 使い方 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">使い方</h3>
          {isOwner && editingField !== "instructions" && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => startEditing("instructions")}
            >
              <Pencil className="size-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
        {editingField === "instructions" ? (
          <div className="space-y-2">
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="使い方を入力..."
              rows={4}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEditing}
                disabled={isSaving}
              >
                <X className="size-3.5 mr-1" />
                キャンセル
              </Button>
              <Button
                size="sm"
                onClick={saveField}
                disabled={isSaving}
              >
                <Check className="size-3.5 mr-1" />
                保存
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {project.instructions || "使い方の説明はありません。"}
          </p>
        )}
      </div>

      <Separator />

      {/* 説明 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">説明</h3>
          {isOwner && editingField !== "description" && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => startEditing("description")}
            >
              <Pencil className="size-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
        {editingField === "description" ? (
          <div className="space-y-2">
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="説明を入力..."
              rows={4}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEditing}
                disabled={isSaving}
              >
                <X className="size-3.5 mr-1" />
                キャンセル
              </Button>
              <Button
                size="sm"
                onClick={saveField}
                disabled={isSaving}
              >
                <Check className="size-3.5 mr-1" />
                保存
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {project.description || "説明はありません。"}
          </p>
        )}
      </div>

      <Separator />

      {/* タグ */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">タグ</h3>
          {isOwner && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsEditingTags(!isEditingTags)}
            >
              {isEditingTags ? (
                <Check className="size-3.5 text-muted-foreground" />
              ) : (
                <Pencil className="size-3.5 text-muted-foreground" />
              )}
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {localTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              {isOwner && isEditingTags && (
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 hover:text-red-500"
                >
                  <X className="size-3" />
                </button>
              )}
            </Badge>
          ))}
          {localTags.length === 0 && !isEditingTags && (
            <p className="text-sm text-muted-foreground">タグはありません。</p>
          )}
        </div>

        {isOwner && isEditingTags && (
          <div className="mt-3 space-y-2">
            {/* 自由入力 */}
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="タグを入力して Enter..."
                className="h-8 text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  addTag(tagInput)
                  setTagInput("")
                }}
                disabled={!tagInput.trim()}
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
            {/* 候補タグ */}
            <div className="flex flex-wrap gap-1.5">
              {TAG_SUGGESTIONS.filter((s) => !localTags.includes(s)).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => addTag(tag)}
                >
                  <Plus className="size-3 mr-0.5" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      <div className="text-xs text-muted-foreground">
        作成日: {project.created_at}
      </div>
    </div>
  )
}
