// 自動整列アルゴリズム（Sugiyama スタイルの階層レイアウト + メディアン法 x 座標最適化）
import type { CreatedSpriteCard, DiagramRelation } from "./types"

/** ノード間のスペース */
const NODE_GAP_X = 140
const NODE_GAP_Y = 120

type NodePosition = { x: number; y: number }

/**
 * 依存関係を考慮した2次元レイアウトを計算。
 * Sugiyama スタイル:
 *   1. DFS でサイクルを断つ（DAG 化）
 *   2. BFS で最長パスレイヤリング
 *   3. バリセンタ法でレイヤー内の順序を最適化
 *   4. メディアン法で x 座標を接続先に寄せる
 */
export function computeAutoLayout(
  cards: CreatedSpriteCard[],
  relations: DiagramRelation[]
): Map<string, NodePosition> {
  if (cards.length === 0) return new Map()
  if (relations.length === 0) return computeGridLayout(cards)

  const cardMap = new Map(cards.map((c) => [c.node.spriteId, c]))
  const ids = new Set(cards.map((c) => c.node.spriteId))

  // 隣接リストを構築
  const forward = new Map<string, Set<string>>()
  const backward = new Map<string, Set<string>>()
  for (const id of ids) {
    forward.set(id, new Set())
    backward.set(id, new Set())
  }
  for (const rel of relations) {
    const f = rel.fromSpriteId
    const t = rel.toSpriteId
    if (!ids.has(f) || !ids.has(t) || f === t) continue
    forward.get(f)!.add(t)
    backward.get(t)!.add(f)
  }

  // 1. DFS でバックエッジを除去 → DAG 化
  const dagForward = breakCycles(ids, forward)

  // 2. DAG 上の入次数を計算
  const inDeg = new Map<string, number>()
  for (const id of ids) inDeg.set(id, 0)
  for (const [, targets] of dagForward) {
    for (const t of targets) {
      inDeg.set(t, (inDeg.get(t) ?? 0) + 1)
    }
  }

  // 3. BFS で最長パスレイヤリング（DAG なので終了が保証される）
  const layerOf = new Map<string, number>()
  const roots = [...ids].filter((id) => (inDeg.get(id) ?? 0) === 0)
  if (roots.length === 0) roots.push([...ids][0])

  const queue = [...roots]
  for (const r of roots) layerOf.set(r, 0)

  while (queue.length > 0) {
    const cur = queue.shift()!
    const curLayer = layerOf.get(cur)!
    for (const next of dagForward.get(cur) ?? []) {
      const existing = layerOf.get(next)
      if (existing === undefined || existing < curLayer + 1) {
        layerOf.set(next, curLayer + 1)
        queue.push(next)
      }
    }
  }

  // 未割り当てノード（孤立ノード）はレイヤー 0
  for (const id of ids) {
    if (!layerOf.has(id)) layerOf.set(id, 0)
  }

  // 4. レイヤーごとにグループ化
  const maxLayer = Math.max(...layerOf.values(), 0)
  const layers: CreatedSpriteCard[][] = Array.from(
    { length: maxLayer + 1 },
    () => []
  )
  for (const card of cards) {
    layers[layerOf.get(card.node.spriteId)!].push(card)
  }

  // 5. バリセンタ法でレイヤー内の順序を最適化（エッジ交差を軽減）
  orderLayersByBarycenter(layers, forward, backward)

  // 6. メディアン法で x 座標を最適化
  return assignPositionsWithMedian(layers, forward, backward)
}

/** DFS でバックエッジを除去し DAG を返す */
function breakCycles(
  ids: Set<string>,
  forward: Map<string, Set<string>>
): Map<string, Set<string>> {
  const dag = new Map<string, Set<string>>()
  for (const id of ids) dag.set(id, new Set())

  const WHITE = 0
  const GRAY = 1
  const BLACK = 2
  const color = new Map<string, number>()
  for (const id of ids) color.set(id, WHITE)

  function dfs(u: string) {
    color.set(u, GRAY)
    for (const v of forward.get(u) ?? []) {
      if (!ids.has(v)) continue
      if (color.get(v) === GRAY) continue // バックエッジ → スキップ
      dag.get(u)!.add(v)
      if (color.get(v) === WHITE) dfs(v)
    }
    color.set(u, BLACK)
  }

  // 出次数が多いノードから DFS 開始（ルートになりやすい）
  const sorted = [...ids].sort(
    (a, b) => (forward.get(b)?.size ?? 0) - (forward.get(a)?.size ?? 0)
  )
  for (const id of sorted) {
    if (color.get(id) === WHITE) dfs(id)
  }

  return dag
}

/** バリセンタ法: 隣接レイヤーのノード位置の平均で並び替え */
function orderLayersByBarycenter(
  layers: CreatedSpriteCard[][],
  forward: Map<string, Set<string>>,
  backward: Map<string, Set<string>>
): void {
  // 下向きパス
  for (let i = 1; i < layers.length; i++) {
    const prevPositions = new Map<string, number>()
    layers[i - 1].forEach((c, idx) =>
      prevPositions.set(c.node.spriteId, idx)
    )
    layers[i].sort((a, b) => {
      const aCenter = barycenter(a.node.spriteId, backward, prevPositions)
      const bCenter = barycenter(b.node.spriteId, backward, prevPositions)
      return aCenter - bCenter
    })
  }

  // 上向きパス
  for (let i = layers.length - 2; i >= 0; i--) {
    const nextPositions = new Map<string, number>()
    layers[i + 1].forEach((c, idx) =>
      nextPositions.set(c.node.spriteId, idx)
    )
    layers[i].sort((a, b) => {
      const aCenter = barycenter(a.node.spriteId, forward, nextPositions)
      const bCenter = barycenter(b.node.spriteId, forward, nextPositions)
      return aCenter - bCenter
    })
  }
}

/** ノードの接続先の位置の平均値を返す（接続なしは Infinity） */
function barycenter(
  nodeId: string,
  adjacency: Map<string, Set<string>>,
  positionMap: Map<string, number>
): number {
  const neighbors = [...(adjacency.get(nodeId) ?? [])].filter((n) =>
    positionMap.has(n)
  )
  if (neighbors.length === 0) return Infinity
  return (
    neighbors.reduce((sum, n) => sum + positionMap.get(n)!, 0) /
    neighbors.length
  )
}

/** 値のメディアン（中央値）を返す */
function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) return sorted[mid]
  return (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * メディアン法による x 座標最適化。
 *
 * Phase 1: 初期配置（レイヤー内で左→右に等間隔）
 * Phase 2-4 を反復:
 *   Phase 2: 下向きパス — 親のメディアン x に子を寄せる
 *   Phase 3: 上向きパス — 子のメディアン x に親を寄せる
 *   Phase 4: 重なり解消 — ノード間の最小間隔を確保
 * Phase 5: 全体の中央揃え
 */
function assignPositionsWithMedian(
  layers: CreatedSpriteCard[][],
  forward: Map<string, Set<string>>,
  backward: Map<string, Set<string>>
): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>()
  const nonEmpty = layers.filter((l) => l.length > 0)
  if (nonEmpty.length === 0) return positions

  // x 座標を管理する Map（spriteId → x）
  const xOf = new Map<string, number>()

  // Phase 1: 初期配置
  for (const layer of nonEmpty) {
    let currentX = 0
    for (const card of layer) {
      xOf.set(card.node.spriteId, currentX)
      currentX += card.container.width + NODE_GAP_X
    }
  }

  // spriteId → card のルックアップ
  const cardById = new Map(nonEmpty.flat().map((c) => [c.node.spriteId, c]))

  // 下向きメディアン → 重なり解消
  for (let i = 1; i < nonEmpty.length; i++) {
    for (const card of nonEmpty[i]) {
      const id = card.node.spriteId
      const parents = [...(backward.get(id) ?? [])].filter((p) => xOf.has(p))
      if (parents.length === 0) continue
      const parentCenters = parents.map((p) => {
        const pw = cardById.get(p)?.container.width ?? 240
        return xOf.get(p)! + pw / 2
      })
      xOf.set(id, median(parentCenters) - card.container.width / 2)
    }
    resolveOverlaps(nonEmpty[i], xOf)
  }

  // 上向きメディアン → 重なり解消
  for (let i = nonEmpty.length - 2; i >= 0; i--) {
    for (const card of nonEmpty[i]) {
      const id = card.node.spriteId
      const children = [...(forward.get(id) ?? [])].filter((c) => xOf.has(c))
      if (children.length === 0) continue
      const childCenters = children.map((c) => {
        const cw = cardById.get(c)?.container.width ?? 240
        return xOf.get(c)! + cw / 2
      })
      xOf.set(id, median(childCenters) - card.container.width / 2)
    }
    resolveOverlaps(nonEmpty[i], xOf)
  }

  // もう1回下向き（微調整）
  for (let i = 1; i < nonEmpty.length; i++) {
    for (const card of nonEmpty[i]) {
      const id = card.node.spriteId
      const parents = [...(backward.get(id) ?? [])].filter((p) => xOf.has(p))
      if (parents.length === 0) continue
      const parentCenters = parents.map((p) => {
        const pw = cardById.get(p)?.container.width ?? 240
        return xOf.get(p)! + pw / 2
      })
      const ideal = median(parentCenters) - card.container.width / 2
      xOf.set(id, xOf.get(id)! * 0.3 + ideal * 0.7)
    }
    resolveOverlaps(nonEmpty[i], xOf)
  }

  // Phase 5: 単一親子チェーンのオフセット
  // レイヤーに1ノードで、親も1つだけの場合、少し右にずらして階段状にする
  const CHAIN_OFFSET = 60
  for (let i = 1; i < nonEmpty.length; i++) {
    if (nonEmpty[i].length !== 1) continue
    const card = nonEmpty[i][0]
    const id = card.node.spriteId
    const parents = [...(backward.get(id) ?? [])].filter((p) => xOf.has(p))
    if (parents.length !== 1) continue

    // 親もレイヤーに1ノードのみの場合 → チェーン
    const parentId = parents[0]
    const parentLayer = nonEmpty[i - 1]
    if (parentLayer.length !== 1) continue
    if (parentLayer[0].node.spriteId !== parentId) continue

    // 親が複数の子を持つ場合はオフセットしない
    const siblings = [...(forward.get(parentId) ?? [])].filter((c) => xOf.has(c))
    if (siblings.length !== 1) continue

    // 階段オフセット
    xOf.set(id, xOf.get(parentId)! + CHAIN_OFFSET)
  }

  // Phase 6: 全体の中央揃え + Y 座標割り当て
  const allX = [...xOf.values()]
  const globalMinX = Math.min(...allX)

  // 全ノードを原点基準にシフト
  for (const [id, x] of xOf) {
    xOf.set(id, x - globalMinX)
  }

  let currentY = 0
  for (const layer of nonEmpty) {
    const maxH = Math.max(...layer.map((c) => c.container.height))
    for (const card of layer) {
      const offsetY = (maxH - card.container.height) / 2
      positions.set(card.node.spriteId, {
        x: xOf.get(card.node.spriteId)!,
        y: currentY + offsetY,
      })
    }
    currentY += maxH + NODE_GAP_Y
  }

  return positions
}

/** レイヤー内のノードが重ならないよう最小間隔を確保（双方向） */
function resolveOverlaps(
  layer: CreatedSpriteCard[],
  xOf: Map<string, number>
): void {
  if (layer.length <= 1) return

  const sorted = [...layer].sort(
    (a, b) => xOf.get(a.node.spriteId)! - xOf.get(b.node.spriteId)!
  )

  // 左→右: 重なりを右に押し出す
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    const minX = xOf.get(prev.node.spriteId)! + prev.container.width + NODE_GAP_X
    if (xOf.get(curr.node.spriteId)! < minX) {
      xOf.set(curr.node.spriteId, minX)
    }
  }

  // 右→左: 重なりを左に押し出す
  for (let i = sorted.length - 2; i >= 0; i--) {
    const next = sorted[i + 1]
    const curr = sorted[i]
    const maxX = xOf.get(next.node.spriteId)! - curr.container.width - NODE_GAP_X
    if (xOf.get(curr.node.spriteId)! > maxX) {
      xOf.set(curr.node.spriteId, maxX)
    }
  }
}

/** グリッド配置（関係がない場合のフォールバック） */
export function computeGridLayout(
  cards: CreatedSpriteCard[]
): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>()
  const cols = Math.ceil(Math.sqrt(cards.length))

  for (let i = 0; i < cards.length; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const card = cards[i]
    positions.set(card.node.spriteId, {
      x: col * (card.container.width + NODE_GAP_X),
      y: row * (card.container.height + NODE_GAP_Y),
    })
  }

  return positions
}
