import { defineServer, defineRoom } from "colyseus";
import { GameRoom } from "./rooms/game-room";
import { CloudVariableRoom } from "./rooms/cloud-variable-room";

const PORT = 4200;

const server = defineServer({
  rooms: {
    game_room: defineRoom(GameRoom),
    cloud_variable_room: defineRoom(CloudVariableRoom).filterBy(["projectId"]),
  },
});

server.listen(PORT).then(() => {
  console.log(`Colyseus サーバー起動: ws://localhost:${PORT}`);
});
