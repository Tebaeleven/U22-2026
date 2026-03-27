"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import {
  Plus,
  Compass,
  Lightbulb,
  Bell,
  FolderOpen,
  Bookmark,
  Search,
  Menu,
  User,
  Settings,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"

const NAV_LINKS = [
  { href: "/editor", label: "作る", icon: Plus },
  { href: "/explore", label: "探す", icon: Compass },
  { href: "/ideas", label: "アイデア", icon: Lightbulb },
] as const

type NavbarUser = {
  username: string
  displayName: string
} | null

export function Navbar({ user, unreadCount = 0 }: { user?: NavbarUser; unreadCount?: number }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
      setSearchQuery("")
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  // 表示名の頭文字
  const initial = user?.displayName?.charAt(0) || user?.username?.charAt(0) || ""

  return (
    <header className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white">
      <div className="mx-auto flex h-12 items-center gap-4 px-4 max-w-[1440px]">
        {/* ロゴ */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0">
          <div className="size-7 rounded-lg bg-[#18181B]/[0.08] flex items-center justify-center text-sm">
            🎮
          </div>
          <span className="hidden sm:inline font-bold text-[#18181B]">
            GameEngine
          </span>
        </Link>

        {/* ナビリンク（デスクトップ） */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <button
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  pathname === href
                    ? "bg-[#18181B]/[0.08] text-[#18181B]"
                    : "text-[#374151] hover:bg-[#18181B]/[0.05]"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            </Link>
          ))}
        </nav>

        {/* 検索バー */}
        <form onSubmit={handleSearch} className="hidden sm:flex items-center gap-2 rounded-md bg-[#18181B]/[0.06] px-3 h-8 w-80">
          <Search className="size-3.5 text-[#18181B]/40 shrink-0" />
          <input
            type="search"
            placeholder="検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-[13px] text-[#18181B] placeholder:text-[#6B7280] outline-none w-full"
          />
        </form>

        {/* スペーサー */}
        <div className="flex-1" />

        {/* 右側 */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/messages" className="hidden sm:block relative">
                <Bell className="size-[18px] text-[#18181B]/50 hover:text-[#18181B] transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/mystuff" className="hidden sm:block">
                <FolderOpen className="size-[18px] text-[#18181B]/50 hover:text-[#18181B] transition-colors" />
              </Link>

              {/* ユーザーメニュー */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="size-7 rounded-full bg-[#18181B]/[0.08] flex items-center justify-center">
                    <Avatar className="size-7">
                      <AvatarFallback className="text-[11px] font-medium">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={`/users/${user.username}`}>
                      <User className="size-4 mr-2" />
                      プロフィール
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/mystuff">
                      <FolderOpen className="size-4 mr-2" />
                      作品一覧
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookmarks">
                      <Bookmark className="size-4 mr-2" />
                      ブックマーク
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="size-4 mr-2" />
                      設定
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="size-4 mr-2" />
                    ログアウト
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/signin">
                <Button variant="ghost" size="sm" className="text-[13px]">
                  ログイン
                </Button>
              </Link>
              <Link href="/join">
                <Button size="sm" className="text-[13px] bg-[#4d97ff] hover:bg-[#4d97ff]/90">
                  新規登録
                </Button>
              </Link>
            </>
          )}

          {/* モバイルメニュー */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetTitle>メニュー</SheetTitle>
              <nav className="mt-4 flex flex-col gap-2">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
                    <Button
                      variant={pathname === href ? "secondary" : "ghost"}
                      className="w-full justify-start"
                    >
                      <Icon className="size-4 mr-2" />
                      {label}
                    </Button>
                  </Link>
                ))}
                {user && (
                  <>
                    <Link href="/messages" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <Bell className="size-4 mr-2" />
                        通知
                        {unreadCount > 0 && (
                          <span className="ml-auto size-5 rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </Button>
                    </Link>
                    <Link href="/mystuff" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <FolderOpen className="size-4 mr-2" />
                        作品一覧
                      </Button>
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
