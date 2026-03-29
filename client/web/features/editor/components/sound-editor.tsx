"use client"

import { useRef, useState } from "react"
import { Plus, Play, Trash2, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { SpriteDef, SoundDef } from "@/features/editor/constants"

interface SoundEditorProps {
  sprite: SpriteDef
  onAddSound: (spriteId: string, sound: SoundDef) => void
  onDeleteSound: (spriteId: string, soundId: string) => void
}

export function SoundEditor({ sprite, onAddSound, onDeleteSound }: SoundEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const sounds = sprite.sounds ?? []

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const sound: SoundDef = {
        id: `sound-${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, ""),
        dataUrl,
      }
      onAddSound(sprite.id, sound)
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const handlePlay = (sound: SoundDef) => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    if (playingId === sound.id) {
      setPlayingId(null)
      return
    }

    const audio = new Audio(sound.dataUrl)
    audio.onended = () => setPlayingId(null)
    audio.play()
    audioRef.current = audio
    setPlayingId(sound.id)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Volume2 className="size-3.5" />
          サウンド ({sounds.length})
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus className="size-3 mr-1" />
          追加
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-1">
          {sounds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Volume2 className="size-8 mb-2 opacity-30" />
              <p className="text-xs">サウンドがありません</p>
              <p className="text-[10px] mt-1">音声ファイルを追加してください</p>
            </div>
          ) : (
            sounds.map((sound) => (
              <div
                key={sound.id}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
                  playingId === sound.id ? "bg-blue-50 border border-blue-200" : "hover:bg-muted/50"
                }`}
              >
                <button
                  type="button"
                  className="shrink-0 text-blue-500 hover:text-blue-700"
                  onClick={() => handlePlay(sound)}
                  title={playingId === sound.id ? "停止" : "再生"}
                >
                  <Play className={`size-3.5 ${playingId === sound.id ? "fill-current" : ""}`} />
                </button>
                <span className="flex-1 truncate">{sound.name}</span>
                <button
                  type="button"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => onDeleteSound(sprite.id, sound.id)}
                  title="削除"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
