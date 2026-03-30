// モデル関係図のコントローラー（useSyncExternalStore パターン）
import type { Workspace } from "headless-vpl"
import type { BlockProjectData } from "../block-editor/types"
import type {
  CreatedSpriteCard,
  CreatedEdge,
  CreatedNote,
  DiagramRelation,
  DiagramNote,
  DiagramSnapshot,
  DiagramPersistenceData,
  SpriteNode,
} from "./types"
import { analyzeRelations, extractSpriteNode, markWatchedVariables, extractClassComments } from "./analyzer"
import { createSpriteCard, createRelationEdge, createNoteContainer, clearDiagram } from "./factory"
import { computeAutoLayout } from "./layout"

export class ModelDiagramController {
  private workspace: Workspace | null = null
  private cards: CreatedSpriteCard[] = []
  private edges: CreatedEdge[] = []
  private notes: CreatedNote[] = []
  private manualRelations: DiagramRelation[] = []
  private selectedNodeId: string | null = null
  private selectedEdgeId: string | null = null
  private snapshot: DiagramSnapshot = EMPTY_SNAPSHOT
  private listeners = new Set<() => void>()
  private nodePositions: Record<string, { x: number; y: number }> = {}
  private noteData: DiagramNote[] = []

  // ─── React 購読 ───

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  readonly getSnapshot = (): DiagramSnapshot => this.snapshot

  private notify(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }

  private updateSnapshot(): void {
    const nodes = this.cards.map((c) => c.node)
    const autoRelations = this.edges
      .filter((e) => e.relation.source === "auto")
      .map((e) => e.relation)

    this.snapshot = {
      nodes,
      autoRelations,
      manualRelations: [...this.manualRelations],
      notes: this.notes.map((n) => n.note),
      selectedNodeId: this.selectedNodeId,
      selectedEdgeId: this.selectedEdgeId,
    }
    this.notify()
  }

  // ─── ライフサイクル ───

  mount(workspace: Workspace): void {
    this.workspace = workspace
  }

  unmount(): void {
    if (this.workspace) {
      clearDiagram(this.workspace, this.cards, this.edges)
      for (const n of this.notes) {
        this.workspace.removeContainer(n.container)
      }
    }
    this.workspace = null
    this.cards = []
    this.edges = []
    this.notes = []
    this.snapshot = EMPTY_SNAPSHOT
    this.notify()
  }

  // ─── データロード ───

  loadSprites(
    sprites: { id: string; name: string }[],
    blockDataMap: Record<string, BlockProjectData>,
    pseudocode?: string
  ): void {
    const ws = this.workspace
    if (!ws) return

    // 既存をクリア
    clearDiagram(ws, this.cards, this.edges)
    for (const n of this.notes) {
      ws.removeContainer(n.container)
    }
    this.cards = []
    this.edges = []
    this.notes = []

    // スプライトノードを生成
    const spriteNames = new Map(sprites.map((s) => [s.id, s.name]))
    const allSpriteData = new Map<string, BlockProjectData>()
    const nodes: SpriteNode[] = []

    for (const sprite of sprites) {
      const data = blockDataMap[sprite.id]
      if (!data) continue
      allSpriteData.set(sprite.id, data)
      nodes.push(extractSpriteNode(sprite.id, sprite.name, data))
    }

    // 自動解析
    const autoRelations = analyzeRelations(allSpriteData, spriteNames)
    const allRelations = [...autoRelations, ...this.manualRelations]
    const updatedNodes = markWatchedVariables(nodes, allRelations)

    // カードを生成
    for (const node of updatedNodes) {
      const card = createSpriteCard(ws, node, 0, 0)
      this.cards.push(card)
    }

    // 保存済み位置を適用、なければ自動レイアウト
    const savedPositions = this.nodePositions
    const needsAutoLayout = this.cards.some(
      (c) => !savedPositions[c.node.spriteId]
    )

    if (needsAutoLayout) {
      const positions = computeAutoLayout(this.cards, allRelations)
      for (const card of this.cards) {
        const pos = savedPositions[card.node.spriteId] ??
          positions.get(card.node.spriteId) ??
          { x: 0, y: 0 }
        card.container.move(pos.x, pos.y)
      }
    } else {
      for (const card of this.cards) {
        const pos = savedPositions[card.node.spriteId]
        if (pos) card.container.move(pos.x, pos.y)
      }
    }

    // エッジを生成
    const cardMap = new Map(this.cards.map((c) => [c.node.spriteId, c]))
    for (const relation of allRelations) {
      const fromCard = cardMap.get(relation.fromSpriteId)
      const toCard = cardMap.get(relation.toSpriteId)
      if (!fromCard || !toCard) continue

      const edge = createRelationEdge(
        ws,
        relation,
        fromCard.outputConnector,
        toCard.inputConnector
      )
      this.edges.push(edge)
    }

    // 手動ノートを再構築
    for (const noteInfo of this.noteData) {
      const created = createNoteContainer(ws, noteInfo)
      this.notes.push(created)
    }

    // コードコメントから自動ノートを生成
    if (pseudocode) {
      const classComments = extractClassComments(pseudocode)
      const nameToSpriteId = new Map(sprites.map((s) => [s.name, s.id]))

      for (const [className, comments] of classComments) {
        const spriteId = nameToSpriteId.get(className)
        if (!spriteId) continue

        const card = this.cards.find((c) => c.node.spriteId === spriteId)
        if (!card) continue

        const text = comments.join("\n")
        const noteId = `auto-comment:${spriteId}`
        const autoNote: DiagramNote = {
          id: noteId,
          text,
          attachedToSpriteId: spriteId,
          position: {
            x: card.container.position.x + card.container.width + 30,
            y: card.container.position.y,
          },
          source: "auto",
        }
        const created = createNoteContainer(ws, autoNote)
        this.notes.push(created)
      }
    }

    this.updateSnapshot()
  }

  // ─── 選択 ───

  selectNode(spriteId: string | null): void {
    this.selectedNodeId = spriteId
    this.selectedEdgeId = null
    this.updateSnapshot()
  }

  selectEdge(edgeId: string | null): void {
    this.selectedEdgeId = edgeId
    this.selectedNodeId = null
    this.updateSnapshot()
  }

  // ─── 手動エッジ ───

  addManualEdge(
    fromSpriteId: string,
    toSpriteId: string,
    label: string
  ): void {
    const id = `manual:${fromSpriteId}:${toSpriteId}:${Date.now()}`
    const relation: DiagramRelation = {
      id,
      fromSpriteId,
      toSpriteId,
      type: "custom",
      label,
      source: "manual",
    }
    this.manualRelations.push(relation)

    // ワークスペースにエッジを追加
    const ws = this.workspace
    if (ws) {
      const cardMap = new Map(this.cards.map((c) => [c.node.spriteId, c]))
      const fromCard = cardMap.get(fromSpriteId)
      const toCard = cardMap.get(toSpriteId)
      if (fromCard && toCard) {
        const edge = createRelationEdge(ws, relation, fromCard.outputConnector, toCard.inputConnector)
        this.edges.push(edge)
      }
    }

    this.updateSnapshot()
  }

  removeManualEdge(edgeId: string): void {
    const ws = this.workspace
    const edgeIndex = this.edges.findIndex(
      (e) => e.relation.id === edgeId && e.relation.source === "manual"
    )
    if (edgeIndex !== -1 && ws) {
      ws.removeEdge(this.edges[edgeIndex].edge)
      this.edges.splice(edgeIndex, 1)
    }
    this.manualRelations = this.manualRelations.filter((r) => r.id !== edgeId)
    if (this.selectedEdgeId === edgeId) this.selectedEdgeId = null
    this.updateSnapshot()
  }

  // ─── ノート管理 ───

  addNote(text: string, attachedToSpriteId: string | null = null): void {
    const ws = this.workspace
    if (!ws) return

    const id = `note:${Date.now()}`
    // 接続先カードの右側にオフセット配置、なければ原点付近
    let x = 50
    let y = 50
    if (attachedToSpriteId) {
      const card = this.cards.find((c) => c.node.spriteId === attachedToSpriteId)
      if (card) {
        x = card.container.position.x + card.container.width + 30
        y = card.container.position.y
      }
    }

    const note: DiagramNote = { id, text, attachedToSpriteId, position: { x, y }, source: "manual" }
    this.noteData.push(note)

    const created = createNoteContainer(ws, note)
    this.notes.push(created)

    this.updateSnapshot()
  }

  removeNote(noteId: string): void {
    const ws = this.workspace
    const idx = this.notes.findIndex((n) => n.note.id === noteId)
    if (idx !== -1 && ws) {
      ws.removeContainer(this.notes[idx].container)
      this.notes.splice(idx, 1)
    }
    this.noteData = this.noteData.filter((n) => n.id !== noteId)
    this.updateSnapshot()
  }

  updateNoteText(noteId: string, text: string): void {
    const created = this.notes.find((n) => n.note.id === noteId)
    if (created) {
      created.note.text = text
    }
    const data = this.noteData.find((n) => n.id === noteId)
    if (data) {
      data.text = text
    }
    this.updateSnapshot()
  }

  saveNotePosition(noteId: string, x: number, y: number): void {
    const created = this.notes.find((n) => n.note.id === noteId)
    if (created) {
      created.note.position = { x, y }
    }
    const data = this.noteData.find((n) => n.id === noteId)
    if (data) {
      data.position = { x, y }
    }
  }

  // ─── 自動整列 ───

  autoArrange(): void {
    const allRelations = [
      ...this.edges.filter((e) => e.relation.source === "auto").map((e) => e.relation),
      ...this.manualRelations,
    ]
    const positions = computeAutoLayout(this.cards, allRelations)
    for (const card of this.cards) {
      const pos = positions.get(card.node.spriteId)
      if (pos) {
        card.container.move(pos.x, pos.y)
      }
    }
    // 位置保存をクリア（自動整列後の位置を基準にする）
    this.nodePositions = {}
    this.updateSnapshot()
  }

  // ─── ノード位置の記録 ───

  saveNodePosition(spriteId: string, x: number, y: number): void {
    this.nodePositions[spriteId] = { x, y }
  }

  // ─── 永続化 ───

  exportPersistenceData(): DiagramPersistenceData {
    // 現在のカード位置を記録
    const positions: Record<string, { x: number; y: number }> = {}
    for (const card of this.cards) {
      positions[card.node.spriteId] = {
        x: card.container.position.x,
        y: card.container.position.y,
      }
    }

    // 手動ノートのみ永続化（自動ノートはコードから再生成される）
    const notes = this.notes
      .filter((n) => n.note.source === "manual")
      .map((n) => ({
        id: n.note.id,
        text: n.note.text,
        attachedToSpriteId: n.note.attachedToSpriteId,
        position: {
          x: n.container.position.x,
          y: n.container.position.y,
        },
      }))

    return {
      manualEdges: this.manualRelations.map((r) => ({
        id: r.id,
        fromSpriteId: r.fromSpriteId,
        toSpriteId: r.toSpriteId,
        type: r.type,
        label: r.label,
      })),
      nodePositions: positions,
      notes,
    }
  }

  loadPersistenceData(data: DiagramPersistenceData): void {
    this.manualRelations = data.manualEdges.map((e) => ({
      ...e,
      source: "manual" as const,
    }))
    this.nodePositions = { ...data.nodePositions }
    this.noteData = (data.notes ?? []).map((n) => ({ ...n, source: "manual" as const }))
  }

  // ─── アクセサ ───

  getCards(): CreatedSpriteCard[] {
    return this.cards
  }

  getEdges(): CreatedEdge[] {
    return this.edges
  }

  getWorkspace(): Workspace | null {
    return this.workspace
  }

  getNotes(): CreatedNote[] {
    return this.notes
  }
}

const EMPTY_SNAPSHOT: DiagramSnapshot = {
  nodes: [],
  autoRelations: [],
  manualRelations: [],
  notes: [],
  selectedNodeId: null,
  selectedEdgeId: null,
}
