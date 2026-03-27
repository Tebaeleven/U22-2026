"use client";

import { useState, useRef } from "react";
import { useCloudVariables } from "../hooks/use-cloud-variables";
import { CLOUD_PREFIX, MAX_CLOUD_VARIABLES, MAX_VALUE_LENGTH } from "../constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export function CloudVariablePanel() {
  const [projectIdInput, setProjectIdInput] = useState("demo-project");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [newVarName, setNewVarName] = useState("");

  const {
    variables,
    connected,
    createVariable,
    setVariable,
    deleteVariable,
    error,
  } = useCloudVariables(activeProjectId);

  const handleConnect = () => {
    if (projectIdInput.trim()) {
      setActiveProjectId(projectIdInput.trim());
    }
  };

  const handleDisconnect = () => {
    setActiveProjectId(null);
  };

  const handleCreateVariable = () => {
    if (!newVarName.trim()) return;
    createVariable(newVarName.trim());
    setNewVarName("");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{CLOUD_PREFIX}クラウド変数デモ</h1>
        <p className="text-muted-foreground text-sm">
          プロジェクトごとに独立したリアルタイム共有変数。複数タブで同じプロジェクトIDに接続して試してみてください。
        </p>
      </div>

      {/* 接続セクション */}
      <Card className="p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="project-id">プロジェクトID</Label>
            <Input
              id="project-id"
              value={projectIdInput}
              onChange={(e) => setProjectIdInput(e.target.value)}
              placeholder="project-id を入力"
              disabled={connected}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !connected) handleConnect();
              }}
            />
          </div>
          {connected ? (
            <Button variant="outline" onClick={handleDisconnect}>
              切断
            </Button>
          ) : (
            <Button onClick={handleConnect} disabled={!projectIdInput.trim()}>
              接続
            </Button>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {connected ? "接続済み" : "未接続"}
          </span>
        </div>
      </Card>

      {/* エラー表示 */}
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 変数一覧 */}
      {connected && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">変数一覧</h2>
            <Badge variant="secondary">
              {variables.size} / {MAX_CLOUD_VARIABLES}
            </Badge>
          </div>

          {variables.size === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              変数がありません。下のフォームから追加してください。
            </p>
          ) : (
            <div className="space-y-2">
              {Array.from(variables.entries()).map(([key, variable]) => (
                <VariableRow
                  key={key}
                  name={variable.name}
                  value={variable.value}
                  onSetValue={(value) => setVariable(variable.name, value)}
                  onDelete={() => deleteVariable(variable.name)}
                />
              ))}
            </div>
          )}

          {/* 変数追加フォーム */}
          {variables.size < MAX_CLOUD_VARIABLES && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-muted-foreground text-sm">{CLOUD_PREFIX}</span>
              <Input
                value={newVarName}
                onChange={(e) => setNewVarName(e.target.value)}
                placeholder="変数名"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateVariable();
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateVariable}
                disabled={!newVarName.trim()}
              >
                追加
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function VariableRow({
  name,
  value,
  onSetValue,
  onDelete,
}: {
  name: string;
  value: string;
  onSetValue: (value: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = () => {
    setEditValue(value);
    setEditing(true);
    // inputRefへのフォーカスは次のレンダー後
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCommit = () => {
    onSetValue(editValue);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditValue(value);
  };

  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
      <span className="text-muted-foreground text-sm shrink-0">
        {CLOUD_PREFIX}
      </span>
      <span className="font-mono text-sm min-w-[80px]">{name}</span>
      <div className="flex-1">
        {editing ? (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => {
              if (e.target.value.length <= MAX_VALUE_LENGTH) {
                setEditValue(e.target.value);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCommit();
              if (e.key === "Escape") handleCancel();
            }}
            onBlur={handleCommit}
            className="h-7 text-sm font-mono"
          />
        ) : (
          <button
            onClick={handleStartEdit}
            className="text-sm font-mono text-left w-full px-2 py-0.5 rounded hover:bg-muted truncate"
          >
            {value || <span className="text-muted-foreground italic">空</span>}
          </button>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="text-destructive hover:text-destructive shrink-0 h-7 px-2"
      >
        削除
      </Button>
    </div>
  );
}
