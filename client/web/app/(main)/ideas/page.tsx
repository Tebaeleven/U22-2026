import Link from "next/link"
import { Play, BookOpen, Lightbulb } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const TUTORIALS = [
  {
    title: "はじめてのゲーム作り",
    description: "ネコを動かす簡単なゲームを作ってみよう。プログラミングの基本を学べます。",
    difficulty: "初級",
    emoji: "🐱",
  },
  {
    title: "シューティングゲームを作ろう",
    description: "弾を発射して敵を倒すシューティングゲームの作り方。",
    difficulty: "中級",
    emoji: "🚀",
  },
  {
    title: "プラットフォーマーを作ろう",
    description: "横スクロールアクションゲームの基本。ジャンプ、重力、当たり判定を実装。",
    difficulty: "中級",
    emoji: "🏃",
  },
  {
    title: "アニメーションの基本",
    description: "スプライトのコスチュームを切り替えてアニメーションを作る方法。",
    difficulty: "初級",
    emoji: "🎬",
  },
  {
    title: "音楽プロジェクトを作ろう",
    description: "キーボードを使った楽器や、ビートメーカーの作り方。",
    difficulty: "初級",
    emoji: "🎵",
  },
  {
    title: "マルチプレイヤーゲーム入門",
    description: "友達と一緒に遊べるリアルタイムゲームの作り方。",
    difficulty: "上級",
    emoji: "🌐",
  },
]

const STARTER_CATEGORIES = [
  { name: "ゲーム", emoji: "🎮", count: 5 },
  { name: "アニメーション", emoji: "🎬", count: 5 },
  { name: "アート", emoji: "🎨", count: 5 },
  { name: "音楽", emoji: "🎵", count: 5 },
  { name: "ストーリー", emoji: "📖", count: 5 },
  { name: "数学", emoji: "🔢", count: 5 },
]

const DIFFICULTY_COLORS: Record<string, string> = {
  "初級": "bg-green-100 text-green-700",
  "中級": "bg-yellow-100 text-yellow-700",
  "上級": "bg-red-100 text-red-700",
}

export default function IdeasPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* ヘッダー */}
      <div className="text-center mb-12">
        <Lightbulb className="size-12 mx-auto text-[#4d97ff] mb-4" />
        <h1 className="text-3xl font-bold">アイデア</h1>
        <p className="mt-2 text-muted-foreground">
          チュートリアルやサンプルプロジェクトでインスピレーションを得よう
        </p>
      </div>

      {/* チュートリアル */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BookOpen className="size-6" />
          チュートリアル
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TUTORIALS.map((tutorial) => (
            <Card key={tutorial.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{tutorial.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{tutorial.title}</h3>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${DIFFICULTY_COLORS[tutorial.difficulty]}`}
                      >
                        {tutorial.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tutorial.description}
                    </p>
                    <Button size="sm" variant="outline" className="mt-3">
                      <Play className="size-3 mr-1" />
                      はじめる
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* スタータープロジェクト */}
      <section>
        <h2 className="text-2xl font-bold mb-6">スタータープロジェクト</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {STARTER_CATEGORIES.map((cat) => (
            <Link key={cat.name} href="/explore">
              <Card className="hover:shadow-md transition-shadow text-center">
                <CardContent className="p-6">
                  <span className="text-4xl block mb-2">{cat.emoji}</span>
                  <h3 className="font-semibold text-sm">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {cat.count}個のプロジェクト
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
