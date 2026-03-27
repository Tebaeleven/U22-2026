import { redirect } from "next/navigation"
import { createClient } from "./server"

/**
 * 認証が必要なページで呼び出す。
 * 未認証の場合は /signin にリダイレクトする。
 * 認証済みの場合はユーザー情報を返す。
 */
export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  return { user, supabase }
}
