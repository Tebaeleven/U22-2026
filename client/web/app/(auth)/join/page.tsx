"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

const STEPS = ["アカウント情報", "プロフィール", "完了"] as const

export default function JoinPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [country, setCountry] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleNext = async () => {
    setError("")

    if (step === 0) {
      if (password !== confirmPassword) {
        setError("パスワードが一致しません")
        return
      }
      if (password.length < 8) {
        setError("パスワードは8文字以上で入力してください")
        return
      }
      if (!username.trim()) {
        setError("ユーザー名を入力してください")
        return
      }
      setStep(1)
      return
    }

    if (step === 1) {
      setLoading(true)
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim(),
            country,
          },
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setLoading(false)
      setStep(2)
      return
    }

    // Step 2: 完了 → トップへ
    router.refresh()
    router.push("/")
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">アカウント作成</CardTitle>
        {/* ステップインジケーター */}
        <div className="flex justify-center gap-2 mt-3">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className={`size-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  i <= step
                    ? "bg-[#4d97ff] text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs hidden sm:inline ${
                  i <= step ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s}
              </span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-sm text-red-500 text-center mb-4">{error}</p>
        )}

        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレスを入力"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="英数字で入力"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8文字以上"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">パスワード確認</Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="もう一度入力"
                required
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>お住まいの国</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="国を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jp">日本</SelectItem>
                  <SelectItem value="us">アメリカ</SelectItem>
                  <SelectItem value="kr">韓国</SelectItem>
                  <SelectItem value="cn">中国</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="text-center py-4">
            <span className="text-4xl block mb-3">🎉</span>
            <p className="font-semibold text-lg">準備完了！</p>
            <p className="text-sm text-muted-foreground mt-2">
              さっそくゲームを作り始めましょう。
            </p>
          </div>
        )}

        <Button
          onClick={handleNext}
          className="w-full mt-6 bg-[#4d97ff] hover:bg-[#4d97ff]/90"
          disabled={loading}
        >
          {loading
            ? "登録中..."
            : step === STEPS.length - 1
              ? "始める"
              : "次へ"}
        </Button>

        {step === 0 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            すでにアカウントをお持ちの方は{" "}
            <Link href="/signin" className="text-[#4d97ff] hover:underline">
              ログイン
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
