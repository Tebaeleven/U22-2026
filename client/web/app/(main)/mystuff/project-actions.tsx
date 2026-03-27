"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { MoreHorizontal, Globe, Lock, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

interface ProjectActionsProps {
  projectId: number
  shared: boolean
}

export function ProjectActions({ projectId, shared }: ProjectActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  async function handleToggleShared() {
    const { error } = await supabase
      .from("projects")
      .update({ shared: !shared })
      .eq("id", projectId)

    if (error) {
      console.error("公開状態の変更に失敗:", error.message)
      return
    }
    startTransition(() => router.refresh())
  }

  async function handleDelete() {
    if (!confirm("この作品を削除しますか？この操作は取り消せません。")) return

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)

    if (error) {
      console.error("削除に失敗:", error.message)
      return
    }
    startTransition(() => router.refresh())
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" disabled={isPending}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {shared ? (
          <DropdownMenuItem onClick={handleToggleShared}>
            <Lock className="size-4 mr-2" />
            非公開にする
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleToggleShared}>
            <Globe className="size-4 mr-2" />
            公開する
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
          <Trash2 className="size-4 mr-2" />
          削除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
