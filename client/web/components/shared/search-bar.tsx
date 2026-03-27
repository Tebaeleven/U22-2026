"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Search } from "lucide-react"

export function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
      setQuery("")
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-md bg-[#18181B]/[0.06] px-3 h-8 w-full"
    >
      <Search className="size-3.5 text-[#18181B]/40 shrink-0" />
      <input
        type="search"
        placeholder="検索..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="bg-transparent text-[13px] text-[#18181B] placeholder:text-[#6B7280] outline-none w-full"
      />
    </form>
  )
}
