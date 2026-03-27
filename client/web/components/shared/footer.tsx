import Link from "next/link"

const FOOTER_SECTIONS = [
  {
    title: "プラットフォーム",
    links: [
      { href: "/about", label: "サイト概要" },
      { href: "/faq", label: "よくある質問" },
      { href: "/ideas", label: "アイデア" },
    ],
  },
  {
    title: "コミュニティ",
    links: [
      { href: "/explore", label: "作品を探す" },
      { href: "/studios/studio-1", label: "スタジオ" },
    ],
  },
  {
    title: "アカウント",
    links: [
      { href: "/signin", label: "ログイン" },
      { href: "/join", label: "アカウント作成" },
    ],
  },
] as const

export function Footer() {
  return (
    <footer className="border-t border-[#E5E7EB] bg-[#F9FAFB]">
      <div className="mx-auto max-w-[1440px] px-[100px] py-8">
        <div className="flex gap-20">
          {/* ブランド */}
          <div className="w-60">
            <div className="text-lg font-bold text-[#18181B]">
              🎮 GameEngine
            </div>
            <p className="mt-3 text-[13px] text-[#6B7280] leading-relaxed">
              ブロックプログラミングで
              <br />
              ゲームを作ろう
            </p>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-[13px] font-semibold text-[#18181B] mb-3">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-[#6B7280] hover:text-[#18181B] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 区切り線 */}
        <div className="mx-auto mt-6 mb-6 h-px w-full max-w-[1240px] bg-[#E5E7EB]" />

        <p className="text-center text-xs text-[#9CA3AF]">
          © 2026 GameEngine. U22 プログラミングコンテスト作品.
        </p>
      </div>
    </footer>
  )
}
