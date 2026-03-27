"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useColyseus } from "../hooks/use-colyseus";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_SIZE,
  MOVE_SPEED,
  LERP_FACTOR,
} from "../constants";

interface VisualPlayer {
  x: number;
  y: number;
  color: string;
}

function lerp(current: number, target: number, factor: number): number {
  const diff = target - current;
  if (Math.abs(diff) < 0.5) return target;
  return current + diff * factor;
}

export function GameCanvas() {
  const { players, sessionId, connected, sendMove } = useColyseus();
  const posRef = useRef({ x: 0, y: 0 });
  const keysRef = useRef(new Set<string>());

  // 補間された描画用位置
  const visualRef = useRef(new Map<string, VisualPlayer>());
  const [visualPlayers, setVisualPlayers] = useState(new Map<string, VisualPlayer>());

  // 自分のプレイヤー位置が確定したら同期
  useEffect(() => {
    if (!sessionId) return;
    const me = players.get(sessionId);
    if (me && posRef.current.x === 0 && posRef.current.y === 0) {
      posRef.current = { x: me.x, y: me.y };
    }
  }, [players, sessionId]);

  // rAFで補間ループ
  useEffect(() => {
    let rafId: number;

    const tick = () => {
      const visual = visualRef.current;
      let changed = false;

      // 退出したプレイヤーを削除
      for (const id of visual.keys()) {
        if (!players.has(id)) {
          visual.delete(id);
          changed = true;
        }
      }

      for (const [id, server] of players.entries()) {
        const isSelf = id === sessionId;
        // 自プレイヤーはローカル予測位置をそのまま使う
        const targetX = isSelf ? posRef.current.x : server.x;
        const targetY = isSelf ? posRef.current.y : server.y;

        const prev = visual.get(id);
        if (!prev) {
          // 初回は即座に配置
          visual.set(id, { x: targetX, y: targetY, color: server.color });
          changed = true;
          continue;
        }

        const newX = isSelf ? targetX : lerp(prev.x, targetX, LERP_FACTOR);
        const newY = isSelf ? targetY : lerp(prev.y, targetY, LERP_FACTOR);

        if (newX !== prev.x || newY !== prev.y || prev.color !== server.color) {
          visual.set(id, { x: newX, y: newY, color: server.color });
          changed = true;
        }
      }

      if (changed) {
        setVisualPlayers(new Map(visual));
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [players, sessionId]);

  const handleMove = useCallback(() => {
    const keys = keysRef.current;
    let { x, y } = posRef.current;
    let moved = false;

    if (keys.has("ArrowUp") || keys.has("w")) {
      y = Math.max(0, y - MOVE_SPEED);
      moved = true;
    }
    if (keys.has("ArrowDown") || keys.has("s")) {
      y = Math.min(CANVAS_HEIGHT - PLAYER_SIZE, y + MOVE_SPEED);
      moved = true;
    }
    if (keys.has("ArrowLeft") || keys.has("a")) {
      x = Math.max(0, x - MOVE_SPEED);
      moved = true;
    }
    if (keys.has("ArrowRight") || keys.has("d")) {
      x = Math.min(CANVAS_WIDTH - PLAYER_SIZE, x + MOVE_SPEED);
      moved = true;
    }

    if (moved) {
      posRef.current = { x, y };
      sendMove(x, y);
    }
  }, [sendMove]);

  // キー入力をゲームループで処理
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(e.key)) {
        e.preventDefault();
        keysRef.current.add(e.key);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const interval = setInterval(handleMove, 1000 / 60);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      clearInterval(interval);
    };
  }, [handleMove]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* ステータスバー */}
      <div className="flex items-center justify-between w-full max-w-[700px] px-2">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span
            className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
          />
          {connected ? "接続済み" : "接続中..."}
        </div>
        <div className="text-sm text-zinc-500">
          プレイヤー: {visualPlayers.size}人
        </div>
      </div>

      {/* ゲームエリア */}
      <div
        className="relative border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 overflow-hidden"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      >
        {Array.from(visualPlayers.entries()).map(([id, player]) => (
          <div key={id} className="absolute will-change-transform">
            {/* プレイヤーアバター */}
            <div
              className="rounded-full shadow-md"
              style={{
                width: PLAYER_SIZE,
                height: PLAYER_SIZE,
                backgroundColor: player.color,
                transform: `translate(${player.x}px, ${player.y}px)`,
              }}
            />
            {/* 自分のプレイヤーにラベル表示 */}
            {id === sessionId && (
              <span
                className="absolute text-xs font-bold text-zinc-700 dark:text-zinc-300 whitespace-nowrap"
                style={{
                  transform: `translate(${player.x - 4}px, ${player.y + PLAYER_SIZE + 2}px)`,
                }}
              >
                あなた
              </span>
            )}
          </div>
        ))}

        {/* 未接続時のオーバーレイ */}
        {!connected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <p className="text-zinc-600 dark:text-zinc-400">
              サーバーに接続中...
            </p>
          </div>
        )}
      </div>

      {/* 操作説明 */}
      <p className="text-sm text-zinc-400">
        矢印キー または WASD で移動
      </p>
    </div>
  );
}
