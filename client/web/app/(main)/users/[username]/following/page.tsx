import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getProfileByUsername, getFollowing } from "@/lib/supabase/queries"
import { createClient } from "@/lib/supabase/server"
import { UserList } from "../user-list"

export default async function FollowingPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const profile = await getProfileByUsername(username)

  if (!profile) {
    notFound()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const following = await getFollowing(profile.id)

  // ログインユーザーがフォロー中のIDセットを取得
  const currentFollowingIds = user
    ? new Set((await getFollowing(user.id)).map((u) => u.id))
    : new Set<string>()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/users/${username}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-4" />
        {profile.display_name} のプロフィールに戻る
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            フォロー中
            <span className="text-sm font-normal text-muted-foreground ml-2">
              {following.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UserList
            users={following}
            currentUserId={user?.id ?? null}
            followingIds={currentFollowingIds}
          />
        </CardContent>
      </Card>
    </div>
  )
}
