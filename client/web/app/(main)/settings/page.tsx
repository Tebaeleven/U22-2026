"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("ゲーム太郎")
  const [bio, setBio] = useState(
    "ゲーム作りが大好きな高校生です。アクションゲームをたくさん作っています！"
  )
  const [country, setCountry] = useState("jp")
  const [emailNotif, setEmailNotif] = useState(true)
  const [commentNotif, setCommentNotif] = useState(true)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">設定</h1>

      {/* プロフィール */}
      <Card>
        <CardHeader>
          <CardTitle>プロフィール</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="bg-[#4d97ff] text-white text-xl">
                太
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">
              画像を変更
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">表示名</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">自己紹介</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/200文字
            </p>
          </div>

          <div className="space-y-2">
            <Label>お住まいの国</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jp">日本</SelectItem>
                <SelectItem value="us">アメリカ</SelectItem>
                <SelectItem value="kr">韓国</SelectItem>
                <SelectItem value="other">その他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="bg-[#4d97ff] hover:bg-[#4d97ff]/90">
            保存
          </Button>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* パスワード */}
      <Card>
        <CardHeader>
          <CardTitle>パスワード変更</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current">現在のパスワード</Label>
            <Input id="current" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new">新しいパスワード</Label>
            <Input id="new" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">確認</Label>
            <Input id="confirm" type="password" />
          </div>
          <Button variant="outline">パスワードを変更</Button>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* 通知設定 */}
      <Card>
        <CardHeader>
          <CardTitle>通知設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>メール通知</Label>
              <p className="text-xs text-muted-foreground">
                重要な通知をメールで受け取る
              </p>
            </div>
            <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>コメント通知</Label>
              <p className="text-xs text-muted-foreground">
                作品にコメントがついたら通知する
              </p>
            </div>
            <Switch checked={commentNotif} onCheckedChange={setCommentNotif} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
