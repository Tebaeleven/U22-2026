import Link from "next/link"
import Image from "next/image"
import { Play } from "lucide-react"

// カテゴリタブ
const CATEGORIES = [
  { id: "all", label: "すべて" },
  { id: "action", label: "アクション" },
  { id: "puzzle", label: "パズル" },
  { id: "art", label: "アート" },
  { id: "music", label: "音楽" },
  { id: "simulation", label: "シミュレーション" },
  { id: "shooting", label: "シューティング" },
] as const

const ACTIVE_CATEGORY = "all"

// トレンドタグ
const TRENDING_TAGS = [
  { label: "#プラットフォーマー", color: "#6366F1", bg: "linear-gradient(90deg, #6366F130, #A855F730)", border: "#6366F140" },
  { label: "#サバイバル", color: "#22C55E", bg: "#22C55E15", border: "#22C55E30" },
  { label: "#ドット絵", color: "#F97316", bg: "#F9731615", border: "#F9731630" },
  { label: "#ホラー", color: "#EF4444", bg: "#EF444415", border: "#EF444430" },
  { label: "#RPG", color: "#6366F1", bg: "#6366F115", border: "#6366F130" },
  { label: "#協力プレイ", color: "#22C55E", bg: "#22C55E15", border: "#22C55E30" },
  { label: "#レトロ", color: "#F97316", bg: "#F9731615", border: "#F9731630" },
  { label: "#音ゲー", color: "#A855F7", bg: "#A855F715", border: "#A855F730" },
] as const

// 注目プロジェクト用の大きなカードデータ
const FEATURED_CARDS = [
  {
    id: 4,
    title: "ブロックパラダイス",
    description: "カラフルなブロックを組み合わせてステージをクリアしよう",
    tag: "パズル",
    tagColor: "#6366F1",
    loves: 1240,
    views: 8500,
    image: "/images/generated-1774335252148.png",
  },
  {
    id: 1,
    title: "スターウォーズ・コマンド",
    description: "銀河の司令官として艦隊を率い、宇宙の覇権を争え",
    tag: "ストラテジー",
    tagColor: "#F97316",
    loves: 980,
    views: 6200,
    image: "/images/generated-1774335284546.png",
  },
  {
    id: 3,
    title: "ほのぼの牧場物語",
    description: "自分だけの牧場を作り、動物たちと穏やかな日々を過ごそう",
    tag: "アドベンチャー",
    tagColor: "#22C55E",
    loves: 3450,
    views: 22100,
    image: "/images/generated-1774335304687.png",
  },
]

// 新着 & 人気用のダミーデータ
const RECENT_PROJECTS = [
  { id: 9, title: "ネオンレーサー", author: "speed_king", loves: 342, views: 1890, image: "/images/generated-1774335511201.png" },
  { id: 2, title: "星空ペイント", author: "art_hana", loves: 567, views: 3200, image: "/images/generated-1774335360264.png" },
  { id: 11, title: "リズムバトル", author: "beat_master", loves: 234, views: 1450, image: "/images/generated-1774336940551.png" },
  { id: 6, title: "迷路メーカー", author: "puzzle_yuki", loves: 189, views: 980, image: "/images/generated-1774337089992.png" },
  { id: 8, title: "タイピングヒーロー", author: "key_fighter", loves: 423, views: 2100, image: "/images/generated-1774336921344.png" },
  { id: 10, title: "フラクタルアート", author: "math_lover", loves: 156, views: 870, image: "/images/generated-1774337130246.png" },
  { id: 5, title: "サバイバルクラフト", author: "craft_pro", loves: 678, views: 4500, image: "/images/generated-1774336923022.png" },
  { id: 7, title: "音楽スタジオ", author: "dj_kenji", loves: 291, views: 1670, image: "/images/generated-1774335527835.png" },
]

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* ヒーローセクション */}
      <section
        className="relative flex items-center justify-center px-20 py-0"
        style={{
          height: 520,
          background: "linear-gradient(180deg, #6366F140 0%, #0A0A0F00 60%)",
        }}
      >
        <div className="flex items-center gap-12 w-full max-w-[1440px]">
          {/* 左側テキスト */}
          <div className="flex-1 space-y-6">
            {/* タグ */}
            <div className="flex gap-2">
              <span className="rounded bg-[#6366F1]/[0.08] px-2.5 py-1 text-[11px] font-semibold text-[#6366F1]">
                アドベンチャー
              </span>
              <span className="rounded bg-[#22C55E]/[0.12] px-2.5 py-1 text-[11px] font-semibold text-[#22C55E]">
                マルチプレイヤー
              </span>
              <span className="rounded bg-[#F97316]/[0.12] px-2.5 py-1 text-[11px] font-semibold text-[#F97316]">
                人気
              </span>
            </div>

            <h1 className="text-[38px] font-bold leading-none tracking-tight text-[#18181B]">
              空の城塞 – Sky Fortress
            </h1>

            <p className="max-w-[480px] text-[15px] leading-relaxed text-[#6B7280]">
              壮大な空の世界を冒険しよう。仲間と共に謎を解き、浮遊する城塞を探索する大規模マルチプレイヤーアドベンチャー。
            </p>

            {/* ボタン */}
            <div className="flex items-center gap-3">
              <Link
                href="/projects/1"
                className="flex items-center gap-2 rounded-lg bg-[#6366F1] px-7 py-3 text-sm font-semibold text-white hover:bg-[#5558E6] transition-colors"
              >
                <Play className="size-4" />
                今すぐプレイ
              </Link>
              <Link
                href="/explore"
                className="rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-7 py-3 text-sm font-medium text-[#6B7280] hover:bg-[#E5E7EB] transition-colors"
              >
                詳細を見る
              </Link>
            </div>

            {/* 統計 */}
            <div className="flex items-center gap-6 text-xs font-medium text-[#9CA3AF]">
              <span>👥 2,400+ プレイヤー</span>
              <span>⭐ 4.8 評価</span>
            </div>
          </div>

          {/* 右側画像 */}
          <div className="relative w-[560px] h-[360px] shrink-0 rounded-2xl border border-[#E5E7EB] overflow-hidden">
            <Image
              src="/images/generated-1774335212730.png"
              alt="空の城塞 - Sky Fortress"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* カテゴリセクション */}
      <section className="mx-auto max-w-[1440px] px-20 py-8">
        <div className="flex items-center mb-5">
          <h2 className="text-[22px] font-bold tracking-tight text-[#18181B]">
            カテゴリで探す
          </h2>
          <div className="flex-1" />
          <Link
            href="/explore"
            className="text-[13px] font-medium text-[#6366F1] hover:underline"
          >
            すべて見る →
          </Link>
        </div>
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/explore?category=${cat.id}`}
              className={`rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-colors ${
                cat.id === ACTIVE_CATEGORY
                  ? "bg-[#6366F1] text-white"
                  : "border border-[#E5E7EB] bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"
              }`}
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </section>

      {/* トレンドタグ */}
      <section className="mx-auto max-w-[1440px] px-20 pb-8">
        <h2 className="text-lg font-bold text-[#18181B] mb-4">
          🔥 トレンドタグ
        </h2>
        <div className="flex flex-wrap gap-2">
          {TRENDING_TAGS.map((tag) => (
            <Link
              key={tag.label}
              href={`/search?q=${encodeURIComponent(tag.label)}`}
              className="rounded-full px-4 py-2 text-xs font-medium transition-opacity hover:opacity-80"
              style={{
                color: tag.color,
                background: tag.bg,
                border: `1px solid ${tag.border}`,
              }}
            >
              {tag.label}
            </Link>
          ))}
        </div>
      </section>

      {/* 注目のプロジェクト */}
      <section className="mx-auto max-w-[1440px] px-20 py-8">
        <div className="flex items-center mb-5">
          <h2 className="text-[22px] font-bold tracking-tight text-[#18181B]">
            ⭐ 注目のプロジェクト
          </h2>
          <div className="flex-1" />
          <Link
            href="/explore"
            className="text-[13px] font-medium text-[#6366F1] hover:underline"
          >
            すべて見る →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {FEATURED_CARDS.map((card) => (
            <Link key={card.id} href={`/projects/${card.id}`}>
              <div className="group overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white transition-shadow hover:shadow-lg">
                {/* 画像 */}
                <div className="relative h-[220px]">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover"
                  />
                </div>
                {/* 本文 */}
                <div className="p-5 space-y-2">
                  <span
                    className="inline-block rounded px-2 py-0.5 text-[11px] font-semibold"
                    style={{
                      color: card.tagColor,
                      backgroundColor: `${card.tagColor}15`,
                    }}
                  >
                    {card.tag}
                  </span>
                  <h3 className="text-lg font-bold tracking-tight text-[#18181B] group-hover:text-[#6366F1] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-[13px] text-[#6B7280]">
                    {card.description}
                  </p>
                  <div className="flex gap-4 text-xs font-medium text-[#9CA3AF]">
                    <span>❤️ {card.loves.toLocaleString()}</span>
                    <span>👁️ {card.views.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 新着 & 人気 */}
      <section className="mx-auto max-w-[1440px] px-20 py-8 pb-16">
        <div className="flex items-center mb-5">
          <h2 className="text-[22px] font-bold tracking-tight text-[#18181B]">
            🚀 新着 &amp; 人気
          </h2>
          <div className="flex-1" />
          <Link
            href="/explore"
            className="text-[13px] font-medium text-[#6366F1] hover:underline"
          >
            すべて見る →
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-5">
          {RECENT_PROJECTS.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="group overflow-hidden rounded-xl border border-[#E5E7EB] bg-white transition-shadow hover:shadow-lg">
                <div className="relative h-[180px] overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4 space-y-1.5">
                  <h3 className="text-sm font-semibold text-[#18181B] group-hover:text-[#6366F1] transition-colors truncate">
                    {project.title}
                  </h3>
                  <p className="text-xs text-[#6B7280]">{project.author}</p>
                  <div className="flex items-center gap-3 text-xs text-[#9CA3AF] font-medium">
                    <span>❤️ {project.loves.toLocaleString()}</span>
                    <span>👁️ {project.views.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
