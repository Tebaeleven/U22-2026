# client/web

## Git LFS（初回 clone 時）

`public/images/` のサンプル PNG は Git LFS で管理しています。未インストールの場合は [Git LFS](https://git-lfs.com/) を入れてから:

```bash
git lfs install
git lfs pull
```

## Development

Run the app with Bun:

```bash
bun run dev
```

The `dev` script builds the local `headless-vpl` package first, then starts Next.js.

If you change files under `../../libs/headless-vpl`, rebuild the package before restarting or rebuilding the app:

```bash
bun run build:headless-vpl
```

## Production Build

```bash
bun run build
```

The `build` script also rebuilds the local `headless-vpl` package before running `next build`.
