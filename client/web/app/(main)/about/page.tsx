import { Code2, Gamepad2, Users, Blocks } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const FEATURES = [
  {
    icon: Blocks,
    title: "ビジュアルプログラミング",
    description:
      "ブロックを組み合わせるだけでプログラムが作れます。テキストコーディングの経験は不要です。",
  },
  {
    icon: Gamepad2,
    title: "ゲーム制作に特化",
    description:
      "スプライト、ステージ、当たり判定など、ゲーム制作に必要な機能がすべて揃っています。",
  },
  {
    icon: Users,
    title: "コミュニティ",
    description:
      "作った作品をワンクリックで公開。いいね、コメント、リミックスでクリエイター同士がつながります。",
  },
  {
    icon: Code2,
    title: "オープンソース",
    description:
      "このプロジェクトはオープンソースで開発されています。U22プログラミングコンテスト2026出展作品です。",
  },
]

const TECH_STACK = [
  { name: "Next.js 16", description: "React フレームワーク" },
  { name: "React 19", description: "UI ライブラリ" },
  { name: "Tailwind CSS v4", description: "スタイリング" },
  { name: "shadcn/ui", description: "コンポーネントライブラリ" },
  { name: "Colyseus", description: "リアルタイムマルチプレイヤー" },
  { name: "headless-vpl", description: "ビジュアルプログラミングエンジン" },
]

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* ヘッダー */}
      <div className="text-center mb-12">
        <span className="text-6xl block mb-4">🎮</span>
        <h1 className="text-4xl font-bold">GameEngine</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          ブロックプログラミングでゲームを作り、共有できるプラットフォーム
        </p>
      </div>

      {/* 特徴 */}
      <section className="mb-12">
        <div className="grid gap-6 md:grid-cols-2">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="flex items-start gap-4 p-6">
                <div className="rounded-lg bg-[#4d97ff]/10 p-2.5">
                  <feature.icon className="size-5 text-[#4d97ff]" />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="my-8" />

      {/* 技術スタック */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-center">技術スタック</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {TECH_STACK.map((tech) => (
            <Card key={tech.name}>
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold text-sm">{tech.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tech.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="my-8" />

      <div className="text-center text-sm text-muted-foreground">
        <p>U22 プログラミングコンテスト 2026 出展作品</p>
      </div>
    </div>
  )
}
