import { Room, Client } from "colyseus";
import { Schema, type, MapSchema } from "@colyseus/schema";

const MAX_VARIABLES = 10;
const MAX_VALUE_LENGTH = 256;
const MIN_UPDATE_INTERVAL_MS = 100;

export class CloudVariable extends Schema {
  @type("string")
  name: string = "";

  @type("string")
  value: string = "";

  @type("number")
  updatedAt: number = 0;
}

export class CloudVariableState extends Schema {
  @type("string")
  projectId: string = "";

  @type({ map: CloudVariable })
  variables = new MapSchema<CloudVariable>();
}

export class CloudVariableRoom extends Room<{ state: CloudVariableState }> {
  // レートリミット用: sessionId -> 最終更新タイムスタンプ
  private lastUpdateTime = new Map<string, number>();

  onCreate(options: { projectId?: string }) {
    this.setState(new CloudVariableState());
    this.state.projectId = options.projectId ?? "";

    // 変数作成
    this.onMessage(
      "create_variable",
      (client, message: { name: string; value?: string }) => {
        const { name, value } = message;

        if (!name || typeof name !== "string") {
          client.send("error", {
            type: "invalid_name",
            message: "変数名が無効です",
          });
          return;
        }

        if (this.state.variables.size >= MAX_VARIABLES) {
          client.send("error", {
            type: "max_variables",
            message: `変数数が上限(${MAX_VARIABLES}個)に達しています`,
          });
          return;
        }

        if (this.state.variables.has(name)) {
          client.send("error", {
            type: "variable_exists",
            message: `変数 "${name}" は既に存在します`,
          });
          return;
        }

        const initialValue = value ?? "";
        if (!isValidCloudValue(initialValue)) {
          client.send("error", {
            type: "invalid_value",
            message: `値は${MAX_VALUE_LENGTH}文字以内にしてください`,
          });
          return;
        }

        const variable = new CloudVariable();
        variable.name = name;
        variable.value = initialValue;
        variable.updatedAt = Date.now();

        this.state.variables.set(name, variable);
        console.log(
          `[${this.state.projectId}] 変数作成: ${name} = "${initialValue}"`
        );
      }
    );

    // 変数更新
    this.onMessage(
      "set_variable",
      (client, message: { name: string; value: string }) => {
        const { name, value } = message;

        if (!this.checkRateLimit(client.sessionId)) {
          client.send("error", {
            type: "rate_limited",
            message: "更新が早すぎます。100ms以上空けてください",
          });
          return;
        }

        const variable = this.state.variables.get(name);
        if (!variable) {
          client.send("error", {
            type: "variable_not_found",
            message: `変数 "${name}" が見つかりません`,
          });
          return;
        }

        if (!isValidCloudValue(value)) {
          client.send("error", {
            type: "invalid_value",
            message: `値は${MAX_VALUE_LENGTH}文字以内の文字列にしてください`,
          });
          return;
        }

        variable.value = value;
        variable.updatedAt = Date.now();
      }
    );

    // 変数削除
    this.onMessage("delete_variable", (client, message: { name: string }) => {
      const { name } = message;

      if (!this.state.variables.has(name)) {
        client.send("error", {
          type: "variable_not_found",
          message: `変数 "${name}" が見つかりません`,
        });
        return;
      }

      this.state.variables.delete(name);
      console.log(`[${this.state.projectId}] 変数削除: ${name}`);
    });
  }

  onJoin(client: Client) {
    console.log(
      `[${this.state.projectId}] ${client.sessionId} がクラウド変数ルームに参加`
    );
  }

  onLeave(client: Client) {
    this.lastUpdateTime.delete(client.sessionId);
    console.log(
      `[${this.state.projectId}] ${client.sessionId} がクラウド変数ルームから退出`
    );
  }

  onDispose() {
    console.log(
      `[${this.state.projectId}] クラウド変数ルームが破棄されました`
    );
  }

  private checkRateLimit(sessionId: string): boolean {
    const now = Date.now();
    const last = this.lastUpdateTime.get(sessionId) ?? 0;
    if (now - last < MIN_UPDATE_INTERVAL_MS) return false;
    this.lastUpdateTime.set(sessionId, now);
    return true;
  }
}

function isValidCloudValue(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_VALUE_LENGTH;
}
