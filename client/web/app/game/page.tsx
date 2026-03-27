import { GameCanvas } from "@/features/game/components/game-canvas";

export default function GamePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
      <h1 className="text-2xl font-bold mb-6 text-zinc-800 dark:text-zinc-100">
        マルチプレイヤーデモ
      </h1>
      <GameCanvas />
    </div>
  );
}
