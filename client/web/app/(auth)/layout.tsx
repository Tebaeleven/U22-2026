import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 認証済みユーザーはトップページにリダイレクト
  if (user) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-2xl font-bold text-[#4d97ff]"
      >
        <span className="text-3xl">🎮</span>
        GameEngine
      </Link>
      {children}
    </div>
  )
}
