import Link from "next/link"
import { Heart, MessageSquare, UserPlus, Share2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { requireAuth } from "@/lib/supabase/auth"
import { getNotifications } from "@/lib/supabase/queries"
import type { NotificationWithActor } from "@/lib/supabase/queries"
import { MarkReadButton } from "./mark-read-button"

type NotificationType = "love" | "follow" | "comment" | "remix"

const NOTIFICATION_CONFIG: Record<
  NotificationType,
  { icon: typeof Heart; label: string; color: string }
> = {
  love: { icon: Heart, label: "いいね", color: "text-red-500" },
  comment: { icon: MessageSquare, label: "コメント", color: "text-blue-500" },
  follow: { icon: UserPlus, label: "フォロー", color: "text-green-500" },
  remix: { icon: Share2, label: "リミックス", color: "text-purple-500" },
}

function getNotificationText(notif: NotificationWithActor): string {
  const actorName = notif.profiles.display_name
  const projectTitle = notif.projects?.title

  switch (notif.type) {
    case "love":
      return `${actorName} が「${projectTitle}」にいいねしました`
    case "comment":
      return `${actorName} が「${projectTitle}」にコメントしました`
    case "follow":
      return `${actorName} があなたをフォローしました`
    case "remix":
      return `${actorName} が「${projectTitle}」をリミックスしました`
    default:
      return `${actorName} からの通知`
  }
}

function getNotificationHref(notif: NotificationWithActor): string | null {
  switch (notif.type) {
    case "love":
    case "comment":
    case "remix":
      return notif.project_id ? `/projects/${notif.project_id}` : null
    case "follow":
      return `/users/${notif.profiles.username}`
    default:
      return null
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return "たった今"
  if (diffMin < 60) return `${diffMin}分前`
  if (diffHour < 24) return `${diffHour}時間前`
  if (diffDay < 7) return `${diffDay}日前`
  return date.toLocaleDateString("ja-JP")
}

export default async function MessagesPage() {
  await requireAuth()
  const notifications = await getNotifications(50)

  const unread = notifications.filter((n) => !n.read)
  const read = notifications.filter((n) => n.read)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">通知</h1>
        {unread.length > 0 && (
          <Badge className="bg-red-500">{unread.length}件の未読</Badge>
        )}
        <div className="flex-1" />
        {unread.length > 0 && <MarkReadButton />}
      </div>

      {notifications.length === 0 && (
        <p className="text-muted-foreground text-center py-12">
          通知はまだありません
        </p>
      )}

      {/* 未読 */}
      {unread.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            新しい通知
          </h2>
          <div className="space-y-2">
            {unread.map((notif) => {
              const config = NOTIFICATION_CONFIG[notif.type as NotificationType]
              if (!config) return null
              const Icon = config.icon
              const href = getNotificationHref(notif)
              const content = (
                <Card key={notif.id} className="border-l-4 border-l-[#4d97ff] hover:bg-muted/50 transition-colors">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Icon className={`size-5 shrink-0 ${config.color}`} />
                    <div className="flex-1">
                      <p className="text-sm">{getNotificationText(notif)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(notif.created_at)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {config.label}
                    </Badge>
                  </CardContent>
                </Card>
              )
              return href ? (
                <Link key={notif.id} href={href}>
                  {content}
                </Link>
              ) : (
                <div key={notif.id}>{content}</div>
              )
            })}
          </div>
        </section>
      )}

      {/* 既読 */}
      {read.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            過去の通知
          </h2>
          <div className="space-y-2">
            {read.map((notif) => {
              const config = NOTIFICATION_CONFIG[notif.type as NotificationType]
              if (!config) return null
              const Icon = config.icon
              const href = getNotificationHref(notif)
              const content = (
                <Card key={notif.id} className="opacity-70 hover:opacity-100 transition-opacity">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Icon className={`size-5 shrink-0 ${config.color}`} />
                    <div className="flex-1">
                      <p className="text-sm">{getNotificationText(notif)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(notif.created_at)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {config.label}
                    </Badge>
                  </CardContent>
                </Card>
              )
              return href ? (
                <Link key={notif.id} href={href}>
                  {content}
                </Link>
              ) : (
                <div key={notif.id}>{content}</div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
