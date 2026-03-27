import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { MapPin, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ProjectCard } from "@/components/shared/project-card"
import { getProfileByUsername, getProjectsByAuthor, getProjectCountByAuthor, getFollowCounts, isFollowing } from "@/lib/supabase/queries"
import { createClient } from "@/lib/supabase/server"
import { FollowButton } from "./follow-button"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) return { title: "ユーザーが見つかりません" }

  const description = profile.bio || `${profile.display_name}のプロフィール`

  return {
    title: `${profile.display_name} (@${profile.username}) | GameEngine`,
    description,
    openGraph: {
      title: `${profile.display_name} (@${profile.username})`,
      description,
    },
    twitter: { card: "summary" },
  }
}

export default async function UserProfilePage({
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

  const [projects, projectCount, followCounts, userFollowing] = await Promise.all([
    getProjectsByAuthor(profile.id),
    getProjectCountByAuthor(profile.id),
    getFollowCounts(profile.id),
    user && user.id !== profile.id ? isFollowing(user.id, profile.id) : Promise.resolve(false),
  ])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* プロフィールヘッダー */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Avatar className="size-20">
              <AvatarFallback className="bg-[#4d97ff] text-white text-2xl">
                {profile.display_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">{profile.display_name}</h1>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
              {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
              <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground sm:justify-start">
                {profile.country && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {profile.country}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  {profile.created_at.slice(0, 10)} に参加
                </span>
              </div>
              {/* フォロー数 */}
              <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm sm:justify-start">
                <Link href={`/users/${username}/following`} className="hover:underline">
                  <span className="font-bold">{followCounts.following_count}</span>
                  <span className="text-muted-foreground ml-1">フォロー中</span>
                </Link>
                <Link href={`/users/${username}/followers`} className="hover:underline">
                  <span className="font-bold">{followCounts.follower_count}</span>
                  <span className="text-muted-foreground ml-1">フォロワー</span>
                </Link>
              </div>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-lg font-bold">{projectCount}</div>
                <div className="text-xs text-muted-foreground">作品</div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-center sm:justify-start">
            <FollowButton
              targetUserId={profile.id}
              currentUserId={user?.id ?? null}
              initialFollowing={userFollowing}
            />
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* 作品 */}
      {profile.working_on && (
        <section>
          <h2 className="text-xl font-bold mb-4">
            制作中: {profile.working_on}
          </h2>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-xl font-bold mb-4">公開プロジェクト</h2>
        {projects.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">まだ公開プロジェクトがありません。</p>
        )}
      </section>
    </div>
  )
}
