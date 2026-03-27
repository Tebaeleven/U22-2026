import { ProjectCard } from "@/components/shared/project-card"
import { Badge } from "@/components/ui/badge"
import {
  getSharedProjects,
  getTrendingProjects,
  getMostLovedProjects,
  getMostViewedProjects,
  getRecentProjects,
} from "@/lib/supabase/queries"

const CATEGORIES = [
  { id: "all", label: "すべて" },
  { id: "game", label: "ゲーム" },
  { id: "animation", label: "アニメーション" },
  { id: "art", label: "アート" },
  { id: "music", label: "音楽" },
  { id: "simulation", label: "シミュレーション" },
  { id: "puzzle", label: "パズル" },
] as const

const SORT_OPTIONS = [
  { id: "trending", label: "トレンド" },
  { id: "loved", label: "人気順" },
  { id: "viewed", label: "閲覧順" },
  { id: "recent", label: "新着順" },
] as const

async function fetchProjects(sort: string, category: string) {
  if (category !== "all") {
    return getSharedProjects(category)
  }
  switch (sort) {
    case "loved":
      return getMostLovedProjects(40)
    case "viewed":
      return getMostViewedProjects(40)
    case "recent":
      return getRecentProjects(40)
    case "trending":
    default:
      return getTrendingProjects(40)
  }
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>
}) {
  const { category = "all", sort = "trending" } = await searchParams
  const projects = await fetchProjects(sort, category)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">探す</h1>

      {/* カテゴリフィルター */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map((cat) => (
          <a key={cat.id} href={`/explore?category=${cat.id}&sort=${sort}`}>
            <Badge
              variant={category === cat.id ? "default" : "secondary"}
              className="cursor-pointer text-sm px-3 py-1"
            >
              {cat.label}
            </Badge>
          </a>
        ))}
      </div>

      {/* ソート */}
      <div className="flex flex-wrap gap-2 mb-8">
        {SORT_OPTIONS.map((opt) => (
          <a key={opt.id} href={`/explore?category=${category}&sort=${opt.id}`}>
            <Badge
              variant={sort === opt.id ? "default" : "outline"}
              className="cursor-pointer text-xs px-2.5 py-0.5"
            >
              {opt.label}
            </Badge>
          </a>
        ))}
      </div>

      {/* プロジェクトグリッド */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground">
          このカテゴリにはまだプロジェクトがありません。
        </div>
      )}
    </div>
  )
}
