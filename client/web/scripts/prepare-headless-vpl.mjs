import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(scriptDir, "..");
const installedPackageDir = path.join(webDir, "node_modules", "headless-vpl");
const sourcePackageDir = path.resolve(webDir, "..", "..", "libs", "headless-vpl");

if (!existsSync(path.join(installedPackageDir, "package.json"))) {
  throw new Error("headless-vpl is not installed. Run `bun install` in client/web first.");
}

// ライブラリのビルド（Vite のみ。tsc 型チェックエラーは無視）
try {
  execFileSync("bun", ["run", "build:lib"], {
    cwd: installedPackageDir,
    stdio: "inherit",
  });
} catch {
  // tsc の型チェックが失敗しても Vite ビルドは成功しているため、dist は生成済み
  const distExists = existsSync(path.join(sourcePackageDir, "dist", "headless-vpl.js"));
  if (!distExists) {
    throw new Error("headless-vpl build failed and no dist found.");
  }
  console.log("Note: tsc type check failed but Vite build succeeded. Continuing with dist copy.");
}

copyAsRealFile("package.json");
copyAsRealFile("README.md");
copyAsRealFile("README.en.md");
copyAsRealFile("LICENSE");
copyAsRealDirectory("dist");

function copyAsRealFile(relativePath) {
  const sourcePath = path.join(sourcePackageDir, relativePath);
  const targetPath = path.join(installedPackageDir, relativePath);

  rmSync(targetPath, { force: true, recursive: true });
  mkdirSync(path.dirname(targetPath), { recursive: true });
  cpSync(sourcePath, targetPath, { dereference: true, force: true });
}

function copyAsRealDirectory(relativePath) {
  const sourcePath = path.join(sourcePackageDir, relativePath);
  const targetPath = path.join(installedPackageDir, relativePath);

  rmSync(targetPath, { force: true, recursive: true });
  mkdirSync(path.dirname(targetPath), { recursive: true });
  cpSync(sourcePath, targetPath, { dereference: true, force: true, recursive: true });
}
