import { Room, Client } from "colyseus";
import { Schema, type, MapSchema } from "@colyseus/schema";

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 500;
const PLAYER_SIZE = 20;

// プレイヤーの色候補
const PLAYER_COLORS = [
  "#ef4444", "#3b82f6", "#22c55e", "#f59e0b",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];

export class Player extends Schema {
  @type("number")
  x: number = 0;

  @type("number")
  y: number = 0;

  @type("string")
  color: string = "#ef4444";
}

export class GameState extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();
}

export class GameRoom extends Room<{ state: GameState }> {
  private colorIndex = 0;

  onCreate() {
    this.setState(new GameState());

    // クライアントからの移動メッセージを処理
    this.onMessage("move", (client, message: { x: number; y: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      // キャンバス範囲内に制限
      player.x = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_SIZE, message.x));
      player.y = Math.max(0, Math.min(CANVAS_HEIGHT - PLAYER_SIZE, message.y));
    });
  }

  onJoin(client: Client) {
    const player = new Player();
    player.x = Math.floor(Math.random() * (CANVAS_WIDTH - PLAYER_SIZE));
    player.y = Math.floor(Math.random() * (CANVAS_HEIGHT - PLAYER_SIZE));
    player.color = PLAYER_COLORS[this.colorIndex % PLAYER_COLORS.length];
    this.colorIndex++;

    this.state.players.set(client.sessionId, player);
    console.log(`${client.sessionId} が参加しました`);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    console.log(`${client.sessionId} が退出しました`);
  }

  onDispose() {
    console.log("ルームが破棄されました");
  }
}
