import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Heart, Share2, Flag, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getProjectById, getCommentsByProjectId, getCommentLovesByUser, hasUserBookmarked, getBookmarkFolders } from "@/lib/supabase/queries"
import { createClient } from "@/lib/supabase/server"
import { getStorageUrl } from "@/lib/supabase/project-storage"
import { ShareButton } from "@/components/shared/share-button"
import { BookmarkButton } from "@/components/shared/bookmark-button"
import { ProjectSidebar } from "./project-sidebar"
import { CommentSection } from "./comment-section"
import { ViewCounter } from "./view-counter"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const project = await getProjectById(id)
  if (!project) return { title: "プロジェクトが見つかりません" }

  const thumbnailUrl = getStorageUrl(project.thumbnail_url)
  const description =
    project.description || `${project.profiles.display_name}の作品`

  return {
    title: `${project.title} | GameEngine`,
    description,
    openGraph: {
      title: project.title,
      description,
      ...(thumbnailUrl && { images: [{ url: thumbnailUrl }] }),
    },
    twitter: {
      card: thumbnailUrl ? "summary_large_image" : "summary",
    },
  }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await getProjectById(id)

  if (!project) {
    notFound()
  }

  const comments = await getCommentsByProjectId(id)
  const thumbnailUrl = getStorageUrl(project.thumbnail_url)

  // ログインユーザーが作者かどうか判定
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = !!user && user.id === project.author_id

  // ログインユーザーのブックマーク・いいね状態を取得
  const [lovedCommentIds, isBookmarked, bookmarkFolders] = await Promise.all([
    user
      ? getCommentLovesByUser(user.id, comments.map((c) => c.id))
      : Promise.resolve(new Set<string>()),
    user ? hasUserBookmarked(user.id, id) : Promise.resolve(false),
    user ? getBookmarkFolders() : Promise.resolve([]),
  ])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* 左側: ステージ */}
        <div>
          {/* プレイヤーエリア */}
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={project.title}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
                unoptimized
                priority
              />
            ) : null}
            {/* オーバーレイ */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Button size="sm" className="bg-green-500 hover:bg-green-600">
                <Flag className="size-3.5 mr-1" />
                実行
              </Button>
            </div>
          </div>

          {/* アクションバー */}
          <div className="flex items-center gap-4 mt-4">
            <Button variant="outline" size="sm">
              <Heart className="size-4 mr-1 text-red-500" />
              {project.loves}
            </Button>
            <ViewCounter projectId={project.id} initialViews={project.views} isOwner={isOwner} />
            <Button variant="outline" size="sm">
              <Share2 className="size-4 mr-1" />
              リミックス ({project.remixes})
            </Button>
            <ShareButton title={project.title} />
            <BookmarkButton
              projectId={project.id}
              currentUserId={user?.id ?? null}
              initialBookmarked={isBookmarked}
              folders={bookmarkFolders.map((f) => ({ id: f.id, name: f.name }))}
            />
            <div className="flex-1" />
            <Link href={`/editor?id=${id}`}>
              <Button variant="outline" size="sm">
                <Code className="size-4 mr-1" />
                中を見る
              </Button>
            </Link>
          </div>

          {/* コメントセクション */}
          <CommentSection
            projectId={project.id}
            comments={comments}
            currentUserId={user?.id ?? null}
            lovedCommentIds={[...lovedCommentIds]}
          />
        </div>

        {/* 右側: プロジェクト情報 */}
        <ProjectSidebar project={project} isOwner={isOwner} />
      </div>
    </div>
  )
}
