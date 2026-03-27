import Link from "next/link"
import { Plus, Globe, Lock, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getMyProjects } from "@/lib/supabase/queries"
import { requireAuth } from "@/lib/supabase/auth"
import { getStorageUrl } from "@/lib/supabase/project-storage"
import { ProjectActions } from "./project-actions"

export default async function MyStuffPage() {
  const { user } = await requireAuth()
  const myProjects = await getMyProjects(user.id)
  const sharedProjects = myProjects.filter((p) => p.shared)
  const unsharedProjects = myProjects.filter((p) => !p.shared)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">作品一覧</h1>
        <Link href="/editor">
          <Button className="bg-[#4d97ff] hover:bg-[#4d97ff]/90">
            <Plus className="size-4 mr-1" />
            新しいプロジェクト
          </Button>
        </Link>
      </div>

      {myProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">🎨</span>
          <h2 className="text-xl font-bold mb-2">まだ作品がありません</h2>
          <p className="text-muted-foreground mb-6">
            最初の作品を作って、みんなにシェアしよう！
          </p>
          <Link href="/editor">
            <Button className="bg-[#4d97ff] hover:bg-[#4d97ff]/90">
              <Plus className="size-4 mr-1" />
              作品をつくる
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* 公開済み */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="size-4 text-green-600" />
              公開済み ({sharedProjects.length})
            </h2>
            <div className="space-y-3">
              {sharedProjects.map((project) => (
                <Card key={project.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    {/* サムネイル */}
                    <div className="relative w-32 h-24 rounded-lg overflow-hidden shrink-0">
                      {getStorageUrl(project.thumbnail_url) ? (
                        <img
                          src={getStorageUrl(project.thumbnail_url)}
                          alt={project.title}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="size-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-3xl">🎮</span>
                        </div>
                      )}
                    </div>

                    {/* 情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/editor?id=${project.id}`}
                          className="font-semibold hover:text-[#4d97ff] transition-colors"
                        >
                          {project.title}
                        </Link>
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-muted-foreground hover:text-[#4d97ff] transition-colors"
                          title="公開ページを見る"
                        >
                          <ExternalLink className="size-3.5" />
                        </Link>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {project.description}
                      </p>
                      <div className="flex gap-2 mt-1.5">
                        {project.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* 統計 */}
                    <div className="text-right text-xs text-muted-foreground hidden sm:block">
                      <div>❤️ {project.loves}</div>
                      <div>👁 {project.views}</div>
                    </div>

                    {/* メニュー */}
                    <ProjectActions projectId={project.id} shared={true} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Separator className="my-8" />

          {/* 非公開 */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lock className="size-4 text-orange-500" />
              非公開 ({unsharedProjects.length})
            </h2>
            <div className="space-y-3">
              {unsharedProjects.map((project) => (
                <Card key={project.id} className="opacity-80">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="size-16 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shrink-0">
                      <span className="text-2xl">📝</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/editor?id=${project.id}`}
                        className="font-semibold hover:text-[#4d97ff] transition-colors"
                      >
                        {project.title}
                      </Link>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {project.description}
                      </p>
                    </div>
                    <ProjectActions projectId={project.id} shared={false} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
