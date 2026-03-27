"use client"

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useState } from "react"
import { STAGE_WIDTH, STAGE_HEIGHT } from "../engine/types"
import type { SpriteRuntime } from "../engine/types"
import type { SpriteDef } from "../constants"

export interface PhaserStageHandle {
  updateSprites: (sprites: SpriteRuntime[]) => void
  showInitialSprites: (sprites: SpriteDef[]) => void
  getScene: () => import("./game-scene").GameScene | null
}

interface PhaserStageProps {
  sprites: SpriteDef[]
  isRunning: boolean
  selectedSpriteId?: string | null
  onSelectSprite?: (id: string) => void
  onSpritePositionChange?: (id: string, x: number, y: number) => void
}

// ─── Unity スタイル Gizmo ──────────────────────────────

const ARROW_LEN = 70
const ARROWHEAD_SIZE = 10

function UnityGizmo({
  sprite,
  overlayRef,
  onMove,
  onMoveEnd,
}: {
  sprite: SpriteDef
  overlayRef: React.RefObject<HTMLDivElement | null>
  onMove: (x: number, y: number) => void
  onMoveEnd: (x: number, y: number) => void
}) {
  const leftPct = ((sprite.x + STAGE_WIDTH / 2) / STAGE_WIDTH) * 100
  const topPct = ((STAGE_HEIGHT / 2 - sprite.y) / STAGE_HEIGHT) * 100

  const startRef = useRef<{
    px: number; py: number; sx: number; sy: number; mode: "x" | "y" | "xy"
  } | null>(null)

  const calcPos = useCallback(
    (clientX: number, clientY: number) => {
      if (!startRef.current) return null
      const overlay = overlayRef.current
      if (!overlay) return null
      const rect = overlay.getBoundingClientRect()
      const scaleX = STAGE_WIDTH / rect.width
      const scaleY = STAGE_HEIGHT / rect.height
      const dx = (clientX - startRef.current.px) * scaleX
      const dy = -(clientY - startRef.current.py) * scaleY
      const { mode, sx, sy } = startRef.current
      return {
        x: mode === "y" ? sx : sx + dx,
        y: mode === "x" ? sy : sy + dy,
      }
    },
    [overlayRef]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, mode: "x" | "y" | "xy") => {
      e.preventDefault()
      e.stopPropagation()
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      startRef.current = { px: e.clientX, py: e.clientY, sx: sprite.x, sy: sprite.y, mode }
    },
    [sprite.x, sprite.y]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const pos = calcPos(e.clientX, e.clientY)
      if (pos) onMove(pos.x, pos.y)
    },
    [calcPos, onMove]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      const pos = calcPos(e.clientX, e.clientY)
      if (pos) onMoveEnd(pos.x, pos.y)
      startRef.current = null
    },
    [calcPos, onMoveEnd]
  )

  const dragHandlers = { onPointerMove: handlePointerMove, onPointerUp: handlePointerUp }

  return (
    <div
      className="absolute"
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        width: 0,
        height: 0,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }}
    >
      <svg
        viewBox={`-12 ${-(ARROW_LEN + ARROWHEAD_SIZE + 12)} ${ARROW_LEN + ARROWHEAD_SIZE + 24} ${ARROW_LEN + ARROWHEAD_SIZE + 24}`}
        width={ARROW_LEN + ARROWHEAD_SIZE + 24}
        height={ARROW_LEN + ARROWHEAD_SIZE + 24}
        style={{
          position: "absolute",
          left: -12,
          top: -(ARROW_LEN + ARROWHEAD_SIZE + 12),
          pointerEvents: "none",
        }}
      >
        {/* X 軸（赤） */}
        <line x1={0} y1={0} x2={ARROW_LEN} y2={0} stroke="#e03030" strokeWidth={3} strokeLinecap="round" />
        <polygon
          points={`${ARROW_LEN - ARROWHEAD_SIZE},${-ARROWHEAD_SIZE / 2} ${ARROW_LEN + ARROWHEAD_SIZE},0 ${ARROW_LEN - ARROWHEAD_SIZE},${ARROWHEAD_SIZE / 2}`}
          fill="#e03030"
        />
        {/* Y 軸（緑） */}
        <line x1={0} y1={0} x2={0} y2={-ARROW_LEN} stroke="#30c030" strokeWidth={3} strokeLinecap="round" />
        <polygon
          points={`${-ARROWHEAD_SIZE / 2},${-ARROW_LEN + ARROWHEAD_SIZE} 0,${-ARROW_LEN - ARROWHEAD_SIZE} ${ARROWHEAD_SIZE / 2},${-ARROW_LEN + ARROWHEAD_SIZE}`}
          fill="#30c030"
        />
        {/* 中心（青） */}
        <rect x={-8} y={-8} width={16} height={16} fill="#4488ff" stroke="white" strokeWidth={1.5} rx={2} />
      </svg>

      {/* X ドラッグハンドル */}
      <div
        className="absolute cursor-ew-resize"
        style={{ left: 0, top: -10, width: ARROW_LEN + ARROWHEAD_SIZE, height: 20, pointerEvents: "auto" }}
        onPointerDown={(e) => handlePointerDown(e, "x")}
        {...dragHandlers}
      />
      {/* Y ドラッグハンドル */}
      <div
        className="absolute cursor-ns-resize"
        style={{ left: -10, top: -(ARROW_LEN + ARROWHEAD_SIZE), width: 20, height: ARROW_LEN + ARROWHEAD_SIZE, pointerEvents: "auto" }}
        onPointerDown={(e) => handlePointerDown(e, "y")}
        {...dragHandlers}
      />
      {/* XY 中心ドラッグハンドル */}
      <div
        className="absolute cursor-move"
        style={{ left: -10, top: -10, width: 20, height: 20, pointerEvents: "auto" }}
        onPointerDown={(e) => handlePointerDown(e, "xy")}
        {...dragHandlers}
      />
    </div>
  )
}

// ─── メインコンポーネント ──────────────────────────────

export const PhaserStage = forwardRef<PhaserStageHandle, PhaserStageProps>(
  function PhaserStage({ sprites, isRunning, onSelectSprite, onSpritePositionChange }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const overlayRef = useRef<HTMLDivElement>(null)
    const gameRef = useRef<import("phaser").Game | null>(null)
    const sceneRef = useRef<import("./game-scene").GameScene | null>(null)
    const spritesRef = useRef(sprites)
    spritesRef.current = sprites

    // コールバック ref（Phaser create() 内のクロージャが常に最新を参照するため）
    const onSelectSpriteRef = useRef(onSelectSprite)
    onSelectSpriteRef.current = onSelectSprite

    const [gizmoSpriteId, setGizmoSpriteId] = useState<string | null>(null)
    const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)

    useImperativeHandle(ref, () => ({
      updateSprites: (runtimeSprites: SpriteRuntime[]) => {
        sceneRef.current?.updateSprites(runtimeSprites, spritesRef.current)
      },
      showInitialSprites: (defs: SpriteDef[]) => {
        sceneRef.current?.showInitialSprites(defs)
      },
      getScene: () => sceneRef.current,
    }))

    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      let game: import("phaser").Game | null = null
      let destroyed = false

      Promise.all([
        import("phaser"),
        import("./game-scene"),
      ]).then(([Phaser, sceneModule]) => {
        if (destroyed) return

        const GameSceneClass = sceneModule.GameScene

        class InitializedScene extends GameSceneClass {
          create() {
            super.create()

            // デフォルトテクスチャ（テクスチャ未設定時のフォールバック）
            const g = this.add.graphics()
            g.fillStyle(0xcccccc)
            g.fillRect(0, 0, 48, 48)
            g.lineStyle(1, 0x999999)
            g.strokeRect(0, 0, 48, 48)
            g.generateTexture("__DEFAULT", 48, 48)
            g.destroy()

            sceneRef.current = this
            // 初回表示だけここで作る。停止中の prop 同期は下の effect から同じ scene に差分適用する。
            this.showInitialSprites(spritesRef.current)

            // Phaser 側のクリックイベントを React に通知
            this.onSpriteClicked = (id: string) => {
              setGizmoSpriteId(id)
              onSelectSpriteRef.current?.(id)
            }
            this.onBackgroundClicked = () => {
              setGizmoSpriteId(null)
            }
          }
        }

        game = new Phaser.Game({
          type: Phaser.AUTO,
          parent: container,
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          backgroundColor: "#ffffff",
          scene: InitializedScene,
          scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
          physics: {
            default: "arcade",
            arcade: {
              gravity: { x: 0, y: 0 },
              debug: false,
            },
          },
          render: {
            antialias: false,
          },
          audio: {
            disableWebAudio: true,
          },
        })

        gameRef.current = game
      })

      return () => {
        destroyed = true
        game?.destroy(true)
        gameRef.current = null
        sceneRef.current = null
      }
    }, [])

    // 停止中のスプライト同期は scene 内で差分更新する。
    useEffect(() => {
      if (isRunning) return
      sceneRef.current?.showInitialSprites(sprites)
    }, [sprites, isRunning])

    // 実行中は Gizmo を非表示
    useEffect(() => {
      if (isRunning) {
        setGizmoSpriteId(null)
        setDragPos(null)
      }
    }, [isRunning])

    useEffect(() => {
      setDragPos(null)
    }, [gizmoSpriteId])

    const gizmoSprite = gizmoSpriteId ? sprites.find((s) => s.id === gizmoSpriteId) ?? null : null
    const effectiveGizmoSprite = gizmoSprite && dragPos
      ? { ...gizmoSprite, x: dragPos.x, y: dragPos.y }
      : gizmoSprite

    const handleSpriteMove = useCallback(
      (x: number, y: number) => {
        if (!gizmoSpriteId) return
        sceneRef.current?.moveSpritePosition(gizmoSpriteId, x, y)
        setDragPos({ x, y })
      },
      [gizmoSpriteId]
    )

    const handleSpriteMoveEnd = useCallback(
      (x: number, y: number) => {
        if (!gizmoSpriteId || !onSpritePositionChange) return
        setDragPos(null)
        onSpritePositionChange(gizmoSpriteId, x, y)
      },
      [gizmoSpriteId, onSpritePositionChange]
    )

    return (
      <div className="flex flex-col border-b">
        <div
          className="relative bg-white"
          style={{ aspectRatio: `${STAGE_WIDTH}/${STAGE_HEIGHT}` }}
        >
          {/* Phaser キャンバス（入力イベントも Phaser が処理） */}
          <div ref={containerRef} className="absolute inset-0 overflow-hidden" />
          {/* Gizmo オーバーレイ（pointer-events: none でキャンバスの入力を遮らない） */}
          {!isRunning && effectiveGizmoSprite && (
            <div
              ref={overlayRef}
              className="absolute inset-0 z-10 pointer-events-none"
            >
              <UnityGizmo
                sprite={effectiveGizmoSprite}
                overlayRef={overlayRef}
                onMove={handleSpriteMove}
                onMoveEnd={handleSpriteMoveEnd}
              />
            </div>
          )}
        </div>
      </div>
    )
  }
)
