"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { markNotificationsRead } from "@/lib/supabase/mutations"

export function MarkReadButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleMarkRead = async () => {
    setLoading(true)
    try {
      await markNotificationsRead()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMarkRead}
      disabled={loading}
    >
      <CheckCheck className="size-4 mr-1" />
      {loading ? "処理中..." : "すべて既読にする"}
    </Button>
  )
}
