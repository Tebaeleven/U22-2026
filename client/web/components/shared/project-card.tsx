import Link from "next/link"
import Image from "next/image"
import { Heart, Eye } from "lucide-react"
import type { ProjectWithAuthor } from "@/lib/supabase/queries"
import { getStorageUrl } from "@/lib/supabase/project-storage"

interface ProjectCardProps {
  project: ProjectWithAuthor
  size?: "default" | "large"
}

// サムネイルのグラデーションカラー（画像がない場合のフォールバック）
const GRADIENT_PAIRS = [
  ["#3B82F6", "#9333EA"],
  ["#EF4444", "#7C3AED"],
  ["#22C55E", "#06B6D4"],
  ["#F97316", "#EF4444"],
  ["#8B5CF6", "#EC4899"],
  ["#14B8A6", "#3B82F6"],
  ["#F59E0B", "#EF4444"],
  ["#6366F1", "#8B5CF6"],
]

const EMOJIS = ["🎮", "⚔️", "🚀", "🎨", "🎵", "🧩", "🌟", "🏰", "🐱", "🎯"]

function getGradient(id: string | number) {
  const s = String(id)
  let hash = 0
  for (const char of s) hash = char.charCodeAt(0) + ((hash << 5) - hash)
  return GRADIENT_PAIRS[Math.abs(hash) % GRADIENT_PAIRS.length]
}

function getEmoji(id: string | number) {
  const s = String(id)
  let hash = 0
  for (const char of s) hash = char.charCodeAt(0) + ((hash << 3) - hash)
  return EMOJIS[Math.abs(hash) % EMOJIS.length]
}

export function ProjectCard({ project, size = "default" }: ProjectCardProps) {
  const [from, to] = getGradient(project.id)
  const emoji = getEmoji(project.id)
  const thumbnailUrl = getStorageUrl(project.thumbnail_url)
  const hasImage = !!thumbnailUrl
  const isLarge = size === "large"

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="group overflow-hidden rounded-xl border border-[#E5E7EB] bg-white transition-shadow hover:shadow-lg">
        {/* サムネイル */}
        <div
          className="relative overflow-hidden"
          style={{ height: isLarge ? 220 : 180 }}
        >
          {hasImage ? (
            <Image
              src={thumbnailUrl}
              alt={project.title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div
              className="flex h-full items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${from}, ${to})`,
              }}
            >
              <span className={isLarge ? "text-[56px]" : "text-[40px]"}>{emoji}</span>
            </div>
          )}
        </div>

        {/* コンテンツ */}
        <div className={isLarge ? "p-5 space-y-2" : "p-4 space-y-1.5"}>
          <h3
            className={`font-semibold text-[#18181B] group-hover:text-[#6366F1] transition-colors truncate ${
              isLarge ? "text-lg" : "text-sm"
            }`}
          >
            {project.title}
          </h3>
          {isLarge && project.description && (
            <p className="text-[13px] text-[#6B7280] line-clamp-2">
              {project.description}
            </p>
          )}
          <p className="text-xs text-[#6B7280]">
            {project.profiles.display_name}
          </p>
          <div className="flex items-center gap-3 text-xs text-[#9CA3AF] font-medium">
            <span className="flex items-center gap-1">
              <Heart className="size-3" />
              {project.loves.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="size-3" />
              {project.views.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
