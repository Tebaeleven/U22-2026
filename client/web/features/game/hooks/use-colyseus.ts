"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Client, Room, Callbacks } from "@colyseus/sdk";
import { WS_SERVER_URL } from "../constants";

interface PlayerData {
  x: number;
  y: number;
  color: string;
}

export function useColyseus() {
  const [players, setPlayers] = useState<Map<string, PlayerData>>(new Map());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    const client = new Client(WS_SERVER_URL);
    let room: Room;

    const connect = async () => {
      try {
        room = await client.joinOrCreate("game_room");
        roomRef.current = room;
        setSessionId(room.sessionId);
        setConnected(true);

        const callbacks = Callbacks.get(room);

        // プレイヤー追加時
        callbacks.onAdd("players", (player: any, rawKey: unknown) => {
          const key = String(rawKey);
          setPlayers((prev) => {
            const next = new Map(prev);
            next.set(key, { x: player.x, y: player.y, color: player.color });
            return next;
          });

          // プレイヤーの状態変更を監視
          callbacks.onChange(player, () => {
            setPlayers((prev) => {
              const next = new Map(prev);
              next.set(key, {
                x: player.x,
                y: player.y,
                color: player.color,
              });
              return next;
            });
          });
        });

        // プレイヤー削除時
        callbacks.onRemove("players", (_player: any, rawKey: unknown) => {
          const key = String(rawKey);
          setPlayers((prev) => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
        });
      } catch (e) {
        console.error("Colyseus接続エラー:", e);
      }
    };

    connect();

    return () => {
      room?.leave();
      roomRef.current = null;
      setConnected(false);
    };
  }, []);

  const sendMove = useCallback((x: number, y: number) => {
    roomRef.current?.send("move", { x, y });
  }, []);

  return { players, sessionId, connected, sendMove };
}
