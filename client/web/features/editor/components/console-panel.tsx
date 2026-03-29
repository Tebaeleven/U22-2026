"use client"

import { useRef, useEffect, useCallback, useSyncExternalStore } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

// --- ログエントリの型 ---

type LogType = "log" | "warn" | "error"

interface LogEntry {
  timestamp: string
  message: string
  type: LogType
}

// --- グローバルログストア ---

const MAX_ENTRIES = 200
let logs: LogEntry[] = []
let listeners: Set<() => void> = new Set()
let version = 0

function emitChange() {
  version++
  for (const listener of listeners) {
    listener()
  }
}

function formatTimestamp(): string {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, "0")
  const m = String(now.getMinutes()).padStart(2, "0")
  const s = String(now.getSeconds()).padStart(2, "0")
  const ms = String(now.getMilliseconds()).padStart(3, "0")
  return `${h}:${m}:${s}.${ms}`
}

/** コンソールにログを出力する */
export function consoleLog(message: string, type: LogType = "log") {
  const entry: LogEntry = {
    timestamp: formatTimestamp(),
    message,
    type,
  }
  logs = [...logs, entry]
  if (logs.length > MAX_ENTRIES) {
    logs = logs.slice(logs.length - MAX_ENTRIES)
  }
  emitChange()
}

/** コンソールのログを全て消去する */
export function consoleClear() {
  logs = []
  emitChange()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): LogEntry[] {
  return logs
}

/** コンソールログを購読するフック */
export function useConsoleLogs(): LogEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

// --- 表示色 ---

const TYPE_COLORS: Record<LogType, string> = {
  log: "text-zinc-300",
  warn: "text-yellow-400",
  error: "text-red-400",
}

// --- コンポーネント ---

export function ConsolePanel() {
  const entries = useConsoleLogs()
  const scrollRef = useRef<HTMLDivElement>(null)

  // 新しいログが追加されたら自動スクロール
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [entries])

  const handleClear = useCallback(() => {
    consoleClear()
  }, [])

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-300 text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-700 bg-zinc-800 shrink-0">
        <span className="font-semibold text-zinc-400">コンソール</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-zinc-400 hover:text-zinc-200"
          onClick={handleClear}
        >
          クリア
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="p-2 space-y-0.5 font-mono text-[11px] leading-4">
          {entries.length === 0 && (
            <span className="text-zinc-600">ログはありません</span>
          )}
          {entries.map((entry, i) => (
            <div key={`${entry.timestamp}-${i}`} className={`flex gap-2 ${TYPE_COLORS[entry.type]}`}>
              <span className="text-zinc-500 shrink-0">{entry.timestamp}</span>
              <span className="break-all">{entry.message}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
