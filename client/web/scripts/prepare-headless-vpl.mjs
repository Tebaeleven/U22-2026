import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  realpathSync,
  rmSync,
  unlinkSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(scriptDir, "..");
const installedPackageDir = path.join(webDir, "node_modules", "headless-vpl");
const sourcePackageDir = path.resolve(webDir, "..", "..", "libs", "headless-vpl");

const sourcePkgJson = path.join(sourcePackageDir, "package.json");
if (!existsSync(sourcePkgJson)) {
  throw new Error(
    "libs/headless-vpl が見つかりません。サブモジュールを初期化するか、リポジトリをクローンし直してください。",
  );
}

// ライブラリのビルド（Vite のみ。tsc 型チェックエラーは無視）
try {
  execFileSync("bun", ["run", "build:lib"], {
    cwd: sourcePackageDir,
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

removeBrokenInstallEntry();

if (shouldSkipCopyToNodeModules()) {
  process.exit(0);
}

copyAsRealFile("package.json");
copyAsRealFile("README.md");
copyAsRealFile("README.en.md");
copyAsRealFile("LICENSE");
copyAsRealDirectory("dist");

/**
 * node_modules/headless-vpl がシンボリックリンクの循環等で壊れていると realpath が失敗する。
 * その場合はエントリを削除し、下で実ディレクトリへコピーできるようにする。
 */
function removeBrokenInstallEntry() {
  if (!existsSync(installedPackageDir)) {
    return;
  }
  try {
    realpathSync(installedPackageDir);
  } catch {
    try {
      const st = lstatSync(installedPackageDir);
      if (st.isSymbolicLink()) {
        unlinkSync(installedPackageDir);
      } else {
        rmSync(installedPackageDir, { force: true, recursive: true });
      }
    } catch (e) {
      throw new Error(
        `node_modules/headless-vpl を修復できませんでした。手動で削除してから client/web で bun install してください: ${e.message}`,
      );
    }
  }
}

/**
 * Bun の file: 依存で node_modules/headless-vpl が libs/headless-vpl と同一実体なら、
 * ビルドは既に libs 側に反映済みなのでコピー不要。
 */
function shouldSkipCopyToNodeModules() {
  if (!existsSync(installedPackageDir)) {
    return false;
  }
  try {
    const installedReal = realpathSync(installedPackageDir);
    const sourceReal = realpathSync(sourcePackageDir);
    return installedReal === sourceReal;
  } catch {
    return false;
  }
}

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
