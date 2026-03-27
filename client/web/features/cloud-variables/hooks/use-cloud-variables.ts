"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Client, Room, Callbacks } from "@colyseus/sdk";
import { WS_SERVER_URL } from "@/features/game/constants";
import { MIN_UPDATE_INTERVAL_MS } from "../constants";

export interface CloudVariableData {
  name: string;
  value: string;
  updatedAt: number;
}

export interface UseCloudVariablesReturn {
  variables: Map<string, CloudVariableData>;
  connected: boolean;
  createVariable: (name: string, value?: string) => void;
  setVariable: (name: string, value: string) => void;
  deleteVariable: (name: string) => void;
  error: string | null;
}

export function useCloudVariables(
  projectId: string | null
): UseCloudVariablesReturn {
  const [variables, setVariables] = useState<Map<string, CloudVariableData>>(
    new Map()
  );
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);
  const lastSendRef = useRef<number>(0);

  useEffect(() => {
    if (!projectId) return;

    const client = new Client(WS_SERVER_URL);
    let room: Room;

    const connect = async () => {
      try {
        room = await client.joinOrCreate("cloud_variable_room", { projectId });
        roomRef.current = room;
        setConnected(true);
        setError(null);
        setVariables(new Map());

        const callbacks = Callbacks.get(room);

        // 変数追加時
        callbacks.onAdd("variables", (variable: any, rawKey: unknown) => {
          const key = String(rawKey);
          setVariables((prev) => {
            const next = new Map(prev);
            next.set(key, {
              name: variable.name,
              value: variable.value,
              updatedAt: variable.updatedAt,
            });
            return next;
          });

          // 変数の値変更を監視
          callbacks.onChange(variable, () => {
            setVariables((prev) => {
              const next = new Map(prev);
              next.set(key, {
                name: variable.name,
                value: variable.value,
                updatedAt: variable.updatedAt,
              });
              return next;
            });
          });
        });

        // 変数削除時
        callbacks.onRemove("variables", (_variable: any, rawKey: unknown) => {
          const key = String(rawKey);
          setVariables((prev) => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
        });

        // サーバーからのエラーメッセージ
        room.onMessage(
          "error",
          (data: { type: string; message: string }) => {
            setError(data.message);
            // 3秒後にエラーをクリア
            setTimeout(() => setError(null), 3000);
          }
        );
      } catch (e) {
        console.error("クラウド変数ルーム接続エラー:", e);
        setError("サーバーに接続できません");
      }
    };

    connect();

    return () => {
      room?.leave();
      roomRef.current = null;
      setConnected(false);
      setVariables(new Map());
    };
  }, [projectId]);

  const createVariable = useCallback((name: string, value?: string) => {
    roomRef.current?.send("create_variable", { name, value: value ?? "" });
  }, []);

  const setVariable = useCallback((name: string, value: string) => {
    const now = Date.now();
    if (now - lastSendRef.current < MIN_UPDATE_INTERVAL_MS) return;
    lastSendRef.current = now;
    roomRef.current?.send("set_variable", { name, value });
  }, []);

  const deleteVariable = useCallback((name: string) => {
    roomRef.current?.send("delete_variable", { name });
  }, []);

  return {
    variables,
    connected,
    createVariable,
    setVariable,
    deleteVariable,
    error,
  };
}
