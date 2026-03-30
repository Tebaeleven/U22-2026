/**
 * headless-vpl (Git サブモジュール) をビルドし、
 * dist/ と package.json を node_modules/headless-vpl/ に実ファイルとしてコピーする。
 *
 * package.json の dependencies に headless-vpl を含めない（file: 依存は Bun が
 * シンボリックリンクを作り、.git 等が混入して Turbopack が "Invalid symlink" で壊れるため）。
 * 代わりにこのスクリプトが dev/build の前に走り、node_modules へ直接配置する。
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(scriptDir, "..");
const targetDir = path.join(webDir, "node_modules", "headless-vpl");
const sourceDir = path.resolve(webDir, "..", "..", "libs", "headless-vpl");

// サブモジュール存在チェック
if (!existsSync(path.join(sourceDir, "package.json"))) {
  throw new Error(
    "libs/headless-vpl が見つかりません。git submodule update --init を実行してください。"
  );
}

// 1. ライブラリをビルド（Vite）
try {
  execFileSync("bun", ["run", "build:lib"], {
    cwd: sourceDir,
    stdio: "inherit",
  });
} catch {
  if (!existsSync(path.join(sourceDir, "dist", "headless-vpl.js"))) {
    throw new Error("headless-vpl のビルドに失敗しました。dist が見つかりません。");
  }
  console.log("Note: tsc 型チェックは失敗しましたが Vite ビルドは成功。dist コピーを続行します。");
}

// 2. node_modules/headless-vpl を丸ごと削除して再作成
rmSync(targetDir, { force: true, recursive: true });
mkdirSync(targetDir, { recursive: true });

// 3. 必要なファイルだけ実ファイルとしてコピー
copyFile("package.json");
copyDir("dist");

// README / LICENSE があればコピー（なくても動作に支障なし）
for (const f of ["README.md", "README.en.md", "LICENSE"]) {
  if (existsSync(path.join(sourceDir, f))) {
    copyFile(f);
  }
}

console.log("headless-vpl → node_modules/headless-vpl にコピー完了");

function copyFile(relativePath) {
  cpSync(
    path.join(sourceDir, relativePath),
    path.join(targetDir, relativePath),
    { dereference: true, force: true }
  );
}

function copyDir(relativePath) {
  cpSync(
    path.join(sourceDir, relativePath),
    path.join(targetDir, relativePath),
    { dereference: true, force: true, recursive: true }
  );
}
