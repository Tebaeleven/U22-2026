"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ShortcutsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Shortcut = {
  keys: string[]
  description: string
}

type ShortcutGroup = {
  title: string
  shortcuts: Shortcut[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "一般",
    shortcuts: [
      { keys: ["Ctrl", "Z"], description: "元に戻す" },
      { keys: ["Ctrl", "Shift", "Z"], description: "やり直す" },
      { keys: ["Ctrl", "S"], description: "保存" },
      { keys: ["?"], description: "ショートカット一覧" },
    ],
  },
  {
    title: "ブロック操作",
    shortcuts: [
      { keys: ["Delete / Backspace"], description: "ブロックを削除" },
      { keys: ["Ctrl", "Space"], description: "ブロック検索" },
      { keys: ["Ctrl", "D"], description: "スプライトを複製" },
    ],
  },
  {
    title: "ナビゲーション",
    shortcuts: [
      { keys: ["ホイール"], description: "スクロール" },
      { keys: ["ピンチ"], description: "拡大/縮小" },
      { keys: ["ドラッグ(背景)"], description: "パン" },
    ],
  },
]

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-[11px] text-muted-foreground">
      {children}
    </kbd>
  )
}

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-sm text-muted-foreground">
        {shortcut.description}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        {shortcut.keys.map((key, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <span className="text-[10px] text-muted-foreground/60">+</span>
            )}
            <Kbd>{key}</Kbd>
          </span>
        ))}
      </div>
    </div>
  )
}

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>キーボードショートカット</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                {group.title}
              </h3>
              <div className="flex flex-col">
                {group.shortcuts.map((shortcut) => (
                  <ShortcutRow
                    key={shortcut.description}
                    shortcut={shortcut}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
