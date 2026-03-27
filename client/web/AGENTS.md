<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Hydration エラー防止ルール

Server Component 内で以下の Radix UI / shadcn コンポーネントを**直接使用してはいけない**:
- DropdownMenu, Dialog, Sheet, Tooltip, Accordion, Tabs, Select, Popover, AlertDialog

これらは内部で `useId()` や `useState` を使うため、サーバーとクライアントで生成されるIDが不一致になり Hydration mismatch を引き起こす。

**対処法**: インタラクティブな UI 部分を `"use client"` の別コンポーネントに切り出し、Server Component からは props でデータを渡す。
