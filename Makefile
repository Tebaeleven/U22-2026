CLIENT_DIR := client/web
SERVER_DIR := server/websocket
SUPABASE_DIR := server
VPL_DIR := libs/headless-vpl
PID_DIR := .pid
LOG_DIR := .logs

.PHONY: install dev dev-client dev-server dev-supabase stop stop-client stop-server stop-supabase \
	status logs-client logs-server reset-supabase gen-types \
	build-vpl test-vpl lint-vpl watch-vpl

install:
	cd $(CLIENT_DIR) && bun install
	cd $(SERVER_DIR) && bun install

dev: dev-supabase dev-client dev-server

dev-client:
	@mkdir -p $(PID_DIR) $(LOG_DIR)
	@if [ -f $(PID_DIR)/client.pid ] && kill -0 $$(cat $(PID_DIR)/client.pid) 2>/dev/null; then \
		echo "Next.js は既に起動中です (PID: $$(cat $(PID_DIR)/client.pid))"; \
	else \
		cd $(CLIENT_DIR) && bun run dev > ../../$(LOG_DIR)/client.log 2>&1 & echo $$! > $(PID_DIR)/client.pid; \
		echo "Next.js を起動しました (PID: $$(cat $(PID_DIR)/client.pid)) - http://localhost:4100"; \
	fi

dev-server:
	@mkdir -p $(PID_DIR) $(LOG_DIR)
	@if [ -f $(PID_DIR)/server.pid ] && kill -0 $$(cat $(PID_DIR)/server.pid) 2>/dev/null; then \
		echo "WebSocket サーバーは既に起動中です (PID: $$(cat $(PID_DIR)/server.pid))"; \
	else \
		cd $(SERVER_DIR) && bun run dev > ../../$(LOG_DIR)/server.log 2>&1 & echo $$! > $(PID_DIR)/server.pid; \
		echo "WebSocket サーバーを起動しました (PID: $$(cat $(PID_DIR)/server.pid)) - ws://localhost:4200"; \
	fi

dev-supabase:
	@supabase status --workdir $(SUPABASE_DIR) 2>/dev/null | grep -q "API URL" && \
		echo "Supabase は既に起動中です" || \
		(supabase start --workdir $(SUPABASE_DIR) && echo "Supabase を起動しました")

stop: stop-client stop-server stop-supabase

stop-client:
	@if [ -f $(PID_DIR)/client.pid ]; then \
		PID=$$(cat $(PID_DIR)/client.pid); \
		if kill -0 $$PID 2>/dev/null; then \
			kill -- -$$PID 2>/dev/null || kill $$PID 2>/dev/null; \
			echo "Next.js を停止しました (PID: $$PID)"; \
		else \
			echo "Next.js は起動していません"; \
		fi; \
		rm -f $(PID_DIR)/client.pid; \
	else \
		echo "Next.js は起動していません"; \
	fi
	@lsof -ti:4100 2>/dev/null | xargs kill 2>/dev/null || true

stop-server:
	@if [ -f $(PID_DIR)/server.pid ]; then \
		PID=$$(cat $(PID_DIR)/server.pid); \
		if kill -0 $$PID 2>/dev/null; then \
			kill -- -$$PID 2>/dev/null || kill $$PID 2>/dev/null; \
			echo "WebSocket サーバーを停止しました (PID: $$PID)"; \
		else \
			echo "WebSocket サーバーは起動していません"; \
		fi; \
		rm -f $(PID_DIR)/server.pid; \
	else \
		echo "WebSocket サーバーは起動していません"; \
	fi
	@lsof -ti:4200 2>/dev/null | xargs kill 2>/dev/null || true

stop-supabase:
	@supabase stop --workdir $(SUPABASE_DIR)

status:
	@echo "=== サーバー状態 ==="
	@if [ -f $(PID_DIR)/client.pid ] && kill -0 $$(cat $(PID_DIR)/client.pid) 2>/dev/null; then \
		echo "Next.js:          起動中 (PID: $$(cat $(PID_DIR)/client.pid)) - http://localhost:4100"; \
	else \
		echo "Next.js:          停止中"; \
	fi
	@if [ -f $(PID_DIR)/server.pid ] && kill -0 $$(cat $(PID_DIR)/server.pid) 2>/dev/null; then \
		echo "WebSocket サーバー: 起動中 (PID: $$(cat $(PID_DIR)/server.pid)) - ws://localhost:4200"; \
	else \
		echo "WebSocket サーバー: 停止中"; \
	fi
	@echo ""
	@echo "=== Supabase ==="
	@supabase status --workdir $(SUPABASE_DIR) 2>/dev/null | head -20 || echo "Supabase:         停止中"

logs-client:
	@if [ -f $(LOG_DIR)/client.log ]; then \
		tail -f $(LOG_DIR)/client.log; \
	else \
		echo "ログファイルがありません"; \
	fi

logs-server:
	@if [ -f $(LOG_DIR)/server.log ]; then \
		tail -f $(LOG_DIR)/server.log; \
	else \
		echo "ログファイルがありません"; \
	fi

# === Supabase ユーティリティ ===

# 未適用のマイグレーションのみ適用（データ保持）
migrate:
	supabase migration up --workdir $(SUPABASE_DIR)

# DB を完全リセット（全データ削除 → マイグレーション再適用 → シード投入）
reset-supabase:
	supabase db reset --workdir $(SUPABASE_DIR)

gen-types:
	supabase gen types typescript --local --workdir $(SUPABASE_DIR) > $(CLIENT_DIR)/lib/supabase/database.types.ts

# === headless-vpl ===

# ビルドしてクライアントの node_modules にコピー
build-vpl:
	cd $(CLIENT_DIR) && bun run build:headless-vpl

# テスト実行
test-vpl:
	cd $(VPL_DIR) && bun run test

# Biome リンター実行
lint-vpl:
	cd $(VPL_DIR) && bun run lint

# ファイル監視 → 変更時に自動ビルド
watch-vpl:
	@command -v fswatch >/dev/null 2>&1 || { echo "fswatch が必要です: brew install fswatch"; exit 1; }
	@echo "$(VPL_DIR)/src/ を監視中... (Ctrl+C で停止)"
	@fswatch -o $(VPL_DIR)/src/ | while read; do \
		echo ""; \
		echo "変更を検知しました。ビルド中..."; \
		$(MAKE) build-vpl && echo "ビルド完了" || echo "ビルド失敗"; \
	done
