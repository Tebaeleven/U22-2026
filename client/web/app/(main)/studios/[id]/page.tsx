import { notFound } from "next/navigation"
import { Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ProjectCard } from "@/components/shared/project-card"
import { getStudioById } from "@/lib/supabase/queries"

export default async function StudioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const studio = await getStudioById(id)

  if (!studio) {
    notFound()
  }

  const projects = studio.studio_projects.map((sp) => sp.projects)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* スタジオヘッダー */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {/* サムネイル */}
            <div className="size-24 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <span className="text-4xl">🎨</span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{studio.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {studio.description}
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span>{projects.length} プロジェクト</span>
                <span>{studio.follower_count} フォロワー</span>
                <span>{studio.created_at} 作成</span>
              </div>
            </div>
            <Button className="bg-[#4d97ff] hover:bg-[#4d97ff]/90">
              <Users className="size-4 mr-1" />
              フォローする
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* キュレーター */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">キュレーター</h2>
        <div className="flex gap-3">
          {studio.studio_curators.map((curator) => (
            <div key={curator.profiles.username} className="flex items-center gap-2">
              <Avatar className="size-8">
                <AvatarFallback className="bg-[#4d97ff] text-white text-xs">
                  {curator.profiles.display_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Badge variant="secondary">{curator.profiles.display_name}</Badge>
            </div>
          ))}
        </div>
      </section>

      {/* プロジェクト一覧 */}
      <section>
        <h2 className="text-lg font-semibold mb-4">プロジェクト</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>
    </div>
  )
}
