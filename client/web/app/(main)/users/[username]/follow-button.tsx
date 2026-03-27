"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, UserCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toggleFollow } from "@/lib/supabase/mutations"

interface FollowButtonProps {
  targetUserId: string
  currentUserId: string | null
  initialFollowing: boolean
}

export function FollowButton({ targetUserId, currentUserId, initialFollowing }: FollowButtonProps) {
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  const handleToggle = useCallback(async () => {
    if (!currentUserId || loading) return
    setLoading(true)

    const prev = following
    setFollowing(!following)

    try {
      const result = await toggleFollow(targetUserId)
      setFollowing(result)
      router.refresh()
    } catch {
      setFollowing(prev)
    } finally {
      setLoading(false)
    }
  }, [targetUserId, currentUserId, following, loading, router])

  // 自分自身のプロフィールではフォローボタンを表示しない
  if (currentUserId === targetUserId) return null

  // 未ログイン
  if (!currentUserId) {
    return (
      <Button className="bg-[#4d97ff] hover:bg-[#4d97ff]/90" disabled>
        <UserPlus className="size-4 mr-1" />
        フォローする
      </Button>
    )
  }

  if (following) {
    return (
      <Button
        variant="outline"
        onClick={handleToggle}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="size-4 mr-1 animate-spin" />
        ) : (
          <UserCheck className="size-4 mr-1" />
        )}
        フォロー中
      </Button>
    )
  }

  return (
    <Button
      className="bg-[#4d97ff] hover:bg-[#4d97ff]/90"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="size-4 mr-1 animate-spin" />
      ) : (
        <UserPlus className="size-4 mr-1" />
      )}
      フォローする
    </Button>
  )
}
