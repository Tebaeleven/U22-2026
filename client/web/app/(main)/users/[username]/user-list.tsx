"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { UserPlus, UserCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toggleFollow } from "@/lib/supabase/mutations"

interface UserProfile {
  id: string
  username: string
  display_name: string
  avatar_url: string
}

interface UserListProps {
  users: UserProfile[]
  currentUserId: string | null
  followingIds: Set<string>
}

function UserRow({
  user,
  currentUserId,
  initialFollowing,
}: {
  user: UserProfile
  currentUserId: string | null
  initialFollowing: boolean
}) {
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)
  const isSelf = currentUserId === user.id

  const handleToggle = useCallback(async () => {
    if (!currentUserId || loading) return
    setLoading(true)
    const prev = following
    setFollowing(!following)
    try {
      const result = await toggleFollow(user.id)
      setFollowing(result)
      router.refresh()
    } catch {
      setFollowing(prev)
    } finally {
      setLoading(false)
    }
  }, [user.id, currentUserId, following, loading, router])

  return (
    <div className="flex items-center gap-3 py-3">
      <Link href={`/users/${user.username}`}>
        <Avatar className="size-10">
          <AvatarFallback className="bg-[#4d97ff] text-white text-sm">
            {user.display_name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/users/${user.username}`} className="text-sm font-semibold hover:underline block truncate">
          {user.display_name}
        </Link>
        <Link href={`/users/${user.username}`} className="text-xs text-muted-foreground block truncate">
          @{user.username}
        </Link>
      </div>
      {currentUserId && !isSelf && (
        <Button
          variant={following ? "outline" : "default"}
          size="sm"
          className={following ? "" : "bg-[#4d97ff] hover:bg-[#4d97ff]/90"}
          onClick={handleToggle}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : following ? (
            <>
              <UserCheck className="size-3.5 mr-1" />
              フォロー中
            </>
          ) : (
            <>
              <UserPlus className="size-3.5 mr-1" />
              フォロー
            </>
          )}
        </Button>
      )}
    </div>
  )
}

export function UserList({ users, currentUserId, followingIds }: UserListProps) {
  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">ユーザーがいません。</p>
  }

  return (
    <div className="divide-y">
      {users.map((user) => (
        <UserRow
          key={user.id}
          user={user}
          currentUserId={currentUserId}
          initialFollowing={followingIds.has(user.id)}
        />
      ))}
    </div>
  )
}
