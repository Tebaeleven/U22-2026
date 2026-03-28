import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // リクエスト側にも cookie をセット（後続のサーバーコンポーネント用）
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          // レスポンス側にもセット（ブラウザに返す）
          supabaseResponse = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  // セッションリフレッシュ（期限切れトークンの更新）
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    // 静的ファイル・画像・favicon を除外
    "/((?!_next/static|_next/image|favicon.ico|images/|editor).*)",
  ],
}
