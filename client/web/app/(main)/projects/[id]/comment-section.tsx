"use client"

import { useState, useCallback, useMemo, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MessageCircle, Reply, Send, Pencil, Trash2, X, Check, Heart, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { addComment, updateComment, deleteComment, toggleCommentLove } from "@/lib/supabase/mutations"

interface Comment {
  id: string
  author_id: string
  content: string
  created_at: string
  parent_id: string | null
  love_count: number
  profiles: {
    username: string
    display_name: string
    avatar_url: string | null
  }
}

interface CommentSectionProps {
  projectId: number
  comments: Comment[]
  currentUserId: string | null
  lovedCommentIds: string[]
}

/** 最初に表示する返信数 */
const INITIAL_REPLIES_SHOWN = 2

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffDays === 0) return "今日"
  if (diffDays === 1) return "昨日"
  if (diffDays < 7) return `${diffDays}日前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })
}

/** コメント本文中の @username をリンクに変換 */
function renderContentWithMentions(content: string): ReactNode[] {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g
  const parts: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = mentionRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }
    const username = match[1]
    parts.push(
      <Link
        key={`mention-${match.index}`}
        href={`/users/${username}`}
        className="text-blue-500 font-semibold hover:underline"
      >
        @{username}
      </Link>
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }

  return parts
}

function CommentForm({
  projectId,
  parentId,
  onCancel,
  placeholder,
  defaultContent,
}: {
  projectId: number
  parentId?: string
  onCancel?: () => void
  placeholder: string
  defaultContent?: string
}) {
  const router = useRouter()
  const [content, setContent] = useState(defaultContent ?? "")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim()
    if (!trimmed || submitting) return

    setSubmitting(true)
    try {
      await addComment(projectId, trimmed, parentId)
      setContent("")
      onCancel?.()
      router.refresh()
    } catch {
      // RLS エラー等
    } finally {
      setSubmitting(false)
    }
  }, [content, submitting, projectId, parentId, onCancel, router])

  return (
    <div className="flex gap-3">
      <div className="flex-1 space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="resize-none text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleSubmit()
            }
          }}
          autoFocus={!!parentId}
        />
        <div className="flex items-center justify-end gap-2">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              キャンセル
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
          >
            <Send className="size-3.5 mr-1" />
            {submitting ? "送信中..." : "投稿"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function EditForm({
  commentId,
  initialContent,
  onCancel,
}: {
  commentId: string
  initialContent: string
  onCancel: () => void
}) {
  const router = useRouter()
  const [content, setContent] = useState(initialContent)
  const [submitting, setSubmitting] = useState(false)

  const handleSave = useCallback(async () => {
    const trimmed = content.trim()
    if (!trimmed || submitting) return

    setSubmitting(true)
    try {
      await updateComment(commentId, trimmed)
      onCancel()
      router.refresh()
    } catch {
      // RLS エラー等
    } finally {
      setSubmitting(false)
    }
  }, [content, submitting, commentId, onCancel, router])

  return (
    <div className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
        className="resize-none text-sm"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            handleSave()
          }
          if (e.key === "Escape") {
            onCancel()
          }
        }}
        autoFocus
      />
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="size-3.5 mr-1" />
          キャンセル
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!content.trim() || submitting}
        >
          <Check className="size-3.5 mr-1" />
          {submitting ? "保存中..." : "保存"}
        </Button>
      </div>
    </div>
  )
}

function LoveButton({
  commentId,
  initialCount,
  initialLoved,
  disabled,
}: {
  commentId: string
  initialCount: number
  initialLoved: boolean
  disabled: boolean
}) {
  const [loved, setLoved] = useState(initialLoved)
  const [count, setCount] = useState(initialCount)
  const [toggling, setToggling] = useState(false)

  const handleToggle = useCallback(async () => {
    if (toggling || disabled) return
    setToggling(true)

    // 楽観的更新
    const prevLoved = loved
    const prevCount = count
    setLoved(!loved)
    setCount(loved ? count - 1 : count + 1)

    try {
      await toggleCommentLove(commentId)
    } catch {
      // ロールバック
      setLoved(prevLoved)
      setCount(prevCount)
    } finally {
      setToggling(false)
    }
  }, [commentId, loved, count, toggling, disabled])

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-6 px-2 text-xs gap-1 ${loved ? "text-red-500" : "text-muted-foreground"}`}
      onClick={handleToggle}
      disabled={disabled}
    >
      <Heart className={`size-3 ${loved ? "fill-red-500" : ""}`} />
      {count > 0 && count}
    </Button>
  )
}

function CommentActions({
  comment,
  currentUserId,
  onEdit,
  onReply,
  lovedSet,
}: {
  comment: Comment
  currentUserId: string | null
  onEdit: () => void
  onReply?: () => void
  lovedSet: Set<string>
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const isOwner = currentUserId === comment.author_id

  const handleDelete = useCallback(async () => {
    if (!window.confirm("このコメントを削除しますか？")) return
    setDeleting(true)
    try {
      await deleteComment(comment.id)
      router.refresh()
    } catch {
      setDeleting(false)
    }
  }, [comment.id, router])

  return (
    <div className="flex items-center gap-1 mt-1">
      <LoveButton
        commentId={comment.id}
        initialCount={comment.love_count}
        initialLoved={lovedSet.has(comment.id)}
        disabled={!currentUserId}
      />
      {currentUserId && onReply && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground"
          onClick={onReply}
        >
          <Reply className="size-3 mr-1" />
          返信
        </Button>
      )}
      {isOwner && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={onEdit}
          >
            <Pencil className="size-3 mr-1" />
            編集
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="size-3 mr-1" />
            {deleting ? "削除中..." : "削除"}
          </Button>
        </>
      )}
    </div>
  )
}

function ReplyItem({
  reply,
  parentCommentId,
  projectId,
  currentUserId,
  lovedSet,
  onReplyToReply,
}: {
  reply: Comment
  parentCommentId: string
  projectId: number
  currentUserId: string | null
  lovedSet: Set<string>
  onReplyToReply: (username: string) => void
}) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="flex gap-3">
      <Link href={`/users/${reply.profiles.username}`}>
        <Avatar className="size-6 shrink-0">
          <AvatarFallback className="bg-[#4d97ff] text-white text-[10px]">
            {reply.profiles.display_name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <Link href={`/users/${reply.profiles.username}`} className="text-sm font-semibold hover:underline">
            {reply.profiles.display_name}
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatDate(reply.created_at)}
          </span>
        </div>
        {editing ? (
          <EditForm
            commentId={reply.id}
            initialContent={reply.content}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <p className="text-sm mt-0.5">
              {renderContentWithMentions(reply.content)}
            </p>
            <CommentActions
              comment={reply}
              currentUserId={currentUserId}
              onEdit={() => setEditing(true)}
              onReply={() => onReplyToReply(reply.profiles.username)}
              lovedSet={lovedSet}
            />
          </>
        )}
      </div>
    </div>
  )
}

function CommentItem({
  comment,
  replies,
  projectId,
  currentUserId,
  lovedSet,
}: {
  comment: Comment
  replies: Comment[]
  projectId: number
  currentUserId: string | null
  lovedSet: Set<string>
}) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyPrefix, setReplyPrefix] = useState("")
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const hiddenCount = replies.length - INITIAL_REPLIES_SHOWN
  const visibleReplies = expanded ? replies : replies.slice(0, INITIAL_REPLIES_SHOWN)

  const handleReply = useCallback((username?: string) => {
    setReplyPrefix(username ? `@${username} ` : "")
    setShowReplyForm(true)
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Link href={`/users/${comment.profiles.username}`}>
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-[#4d97ff] text-white text-xs">
              {comment.profiles.display_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <Link href={`/users/${comment.profiles.username}`} className="text-sm font-semibold hover:underline">
              {comment.profiles.display_name}
            </Link>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.created_at)}
            </span>
          </div>
          {editing ? (
            <EditForm
              commentId={comment.id}
              initialContent={comment.content}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              <p className="text-sm mt-0.5">
                {renderContentWithMentions(comment.content)}
              </p>
              <CommentActions
                comment={comment}
                currentUserId={currentUserId}
                onEdit={() => setEditing(true)}
                onReply={() => handleReply()}
                lovedSet={lovedSet}
              />
            </>
          )}
        </div>
      </div>

      {/* 返信一覧 */}
      {replies.length > 0 && (
        <div className="ml-11 space-y-3 border-l-2 border-muted pl-4">
          {/* 折りたたみ: 展開ボタン（上部） */}
          {!expanded && hiddenCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-blue-500 hover:text-blue-600"
              onClick={() => setExpanded(true)}
            >
              <ChevronDown className="size-3 mr-1" />
              他 {hiddenCount} 件の返信を表示
            </Button>
          )}

          {visibleReplies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              parentCommentId={comment.id}
              projectId={projectId}
              currentUserId={currentUserId}
              lovedSet={lovedSet}
              onReplyToReply={(username) => handleReply(username)}
            />
          ))}

          {/* 折りたたみ: 非表示ボタン（下部） */}
          {expanded && hiddenCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => setExpanded(false)}
            >
              <ChevronUp className="size-3 mr-1" />
              返信を非表示
            </Button>
          )}
        </div>
      )}

      {/* 返信フォーム */}
      {showReplyForm && (
        <div className="ml-11 pl-4">
          <CommentForm
            projectId={projectId}
            parentId={comment.id}
            onCancel={() => setShowReplyForm(false)}
            placeholder={`@${comment.profiles.display_name} に返信...`}
            defaultContent={replyPrefix}
          />
        </div>
      )}
    </div>
  )
}

export function CommentSection({ projectId, comments, currentUserId, lovedCommentIds }: CommentSectionProps) {
  const lovedSet = useMemo(() => new Set(lovedCommentIds), [lovedCommentIds])

  // トップレベルコメントと返信を分離
  const topLevel = comments.filter((c) => !c.parent_id)
  const repliesMap = new Map<string, Comment[]>()
  for (const c of comments) {
    if (c.parent_id) {
      const arr = repliesMap.get(c.parent_id) ?? []
      arr.push(c)
      repliesMap.set(c.parent_id, arr)
    }
  }

  // 返信は時系列順（昇順）にソート
  for (const [, replies] of repliesMap) {
    replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="size-5" />
          コメント
          {comments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {/* 投稿フォーム */}
          {currentUserId ? (
            <CommentForm projectId={projectId} placeholder="コメントを入力... (Ctrl+Enter で送信)" />
          ) : (
            <p className="text-sm text-muted-foreground">
              コメントするには
              <Link href="/signin" className="text-primary hover:underline mx-1">
                ログイン
              </Link>
              してください。
            </p>
          )}

          {/* コメント一覧（最新順） */}
          {topLevel.length === 0 && (
            <p className="text-sm text-muted-foreground">まだコメントはありません。最初のコメントを書いてみよう！</p>
          )}
          {topLevel.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={repliesMap.get(comment.id) ?? []}
              projectId={projectId}
              currentUserId={currentUserId}
              lovedSet={lovedSet}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
