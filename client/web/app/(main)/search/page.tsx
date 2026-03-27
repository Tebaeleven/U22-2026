import { Search } from "lucide-react"
import { ProjectCard } from "@/components/shared/project-card"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { searchProjects, searchProfiles, searchStudios } from "@/lib/supabase/queries"
import Link from "next/link"

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = "" } = await searchParams
  const projects = q ? await searchProjects(q) : []
  const users = q ? await searchProfiles(q) : []
  const studios = q ? await searchStudios(q) : []
  const totalResults = projects.length + users.length + studios.length

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Search className="size-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">
          {q ? `「${q}」の検索結果` : "検索"}
        </h1>
        {q && (
          <Badge variant="secondary">{totalResults}件</Badge>
        )}
      </div>

      {!q && (
        <div className="py-20 text-center text-muted-foreground">
          上部の検索バーからキーワードを入力してください。
        </div>
      )}

      {q && totalResults === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          「{q}」に一致する結果は見つかりませんでした。
        </div>
      )}

      {/* プロジェクト */}
      {projects.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">
            プロジェクト ({projects.length})
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (users.length > 0 || studios.length > 0) && (
        <Separator className="my-8" />
      )}

      {/* ユーザー */}
      {users.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">
            ユーザー ({users.length})
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {users.map((user) => (
              <Link key={user.id} href={`/users/${user.username}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Avatar className="size-10">
                      <AvatarFallback className="bg-[#4d97ff] text-white">
                        {user.display_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{user.display_name}</div>
                      <div className="text-xs text-muted-foreground">
                        @{user.username}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* スタジオ */}
      {studios.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">
            スタジオ ({studios.length})
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {studios.map((studio) => (
              <Link key={studio.id} href={`/studios/${studio.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="size-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                      <span className="text-lg">🎨</span>
                    </div>
                    <div>
                      <div className="font-semibold">{studio.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {studio.studio_projects.length}プロジェクト · {studio.follower_count}フォロワー
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
