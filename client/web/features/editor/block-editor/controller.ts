// ブロックエディタ コントローラー
import type {
  Container,
  InteractionConfig,
  NestingZone,
  SnapConnection,
  Workspace,
} from "headless-vpl"
import {
  collectConnectedChain,
  collectFrontGroup,
  observeContainerContentSizes,
  sortContainersForNestedRender,
  subscribeCBlockConnectionSync,
  startProximityLoop,
  syncProximityHighlights,
  findCBlockRefForBodyLayout,
  isCBlockBodyLayout,
  connectStackPairs,
} from "headless-vpl/blocks"
import type {
  BlockProjectData,
  BlockState,
  BodyZoneMeta,
  CBlockRef,
  CreatedBlock,
  CustomProcedure,
  SlotZoneMeta,
} from "./types"
import {
  buildProcedureBlockDefs,
  getBlockDefById,
  normalizeProcedure,
  SPRITE_DROPDOWN_OPCODES,
  STARTER_DEFINE_BLOCK_ID,
} from "./blocks"
import {
  collectBodyZoneProximityHits,
  rebuildStackSnapConnections,
  registerCBlockBodyZones,
  registerSlotZones,
} from "./connections"
import {
  alignCBlockBodyEntryConnectors,
  pullFollowerChainOutOfBodyLayout,
  relayoutBlockAndAncestors,
  relayoutCreatedBlocks,
  syncBodyLayoutChain,
} from "./layout"
import {
  buildSampleScene,
  resetEditorWorkspace,
  seedInitialCBlockNest,
} from "./sample-scene"
import { createBlock } from "./factory"
import { rebuildBlocks, exportWorkspaceBlocks } from "./persistence-manager"
import { ProcedureManager } from "./procedure-manager"
import { VariableManager } from "./variable-manager"

/** コントローラーの現在状態。React の useSyncExternalStore で購読する */
export type BlockEditorSnapshot = {
  blocks: BlockState[]
  nestedSlots: Record<string, string>
  customProcedures: CustomProcedure[]
  customVariables: string[]
}

const EMPTY_SNAPSHOT: BlockEditorSnapshot = {
  blocks: [],
  nestedSlots: {},
  customProcedures: [],
  customVariables: [],
}

/** ブロック複製時の位置オフセット（px） */
const DUPLICATE_OFFSET = 48

/** オブジェクトのディープコピーを作成する（JSON経由） */
function cloneProcedure<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/** ブロックエディタの中央コントローラー。ブロックの追加・削除・接続・レイアウトを一元管理する */
export class BlockEditorController {
  private readonly listeners = new Set<() => void>()
  private snapshot: BlockEditorSnapshot = EMPTY_SNAPSHOT

  private workspace: Workspace | null = null
  private containers: Container[] = []
  private stopProximityLoop: (() => void) | null = null
  private stopConnectionSync: (() => void) | null = null
  private stopSizeObservers: (() => void) | null = null
  private pendingProjectData: BlockProjectData | null = null

  private readonly createdMap = new Map<string, CreatedBlock>()
  private readonly containerMap = new Map<string, Container>()
  private readonly cBlockRefMap = new Map<string, CBlockRef>()
  private readonly slotZoneMap = new Map<NestingZone, SlotZoneMeta>()
  private readonly bodyZoneMap = new Map<NestingZone, BodyZoneMeta>()
  private readonly activeBodyProximityIds = new Set<string>()

  private readonly procedureManager = new ProcedureManager({
    getSnapshot: () => this.snapshot,
    applyProcedureChange: (updater) => {
      const data = this.exportProjectData()
      this.rebuildFromProjectData(updater(data), false)
    },
    setCustomProcedures: (procedures) => this.setCustomProcedures(procedures),
    addBlock: (defId, x, y) => this.addBlock(defId, x, y),
    insertBlockByDef: (defId, procedures, x, y) => {
      if (!this.workspace) return null
      const def = getBlockDefById(defId, procedures)
      if (!def) return null
      return this.insertBlock(def, x, y)
    },
  })

  private readonly variableManager = new VariableManager({
    getCustomVariables: () => this.snapshot.customVariables,
    setCustomVariables: (variables) => {
      this.snapshot = { ...this.snapshot, customVariables: variables }
      this.emit()
    },
  })

  readonly snapConnections: SnapConnection[] = []
  readonly nestingZones: NestingZone[] = []
  readonly cBlockRefs: CBlockRef[] = []

  /** ネスト変更（ブロックのはめ込み・取り出し）時のハンドラ */
  private handleNestChange(
    container: Container,
    zone: NestingZone,
    isNest: boolean
  ): void {
    if (isCBlockBodyLayout(zone.layout, this.cBlockRefs)) {
      if (!isNest) pullFollowerChainOutOfBodyLayout(container, zone.layout)
      syncBodyLayoutChain(zone.layout)
      const owner = findCBlockRefForBodyLayout(zone.layout, this.cBlockRefs)
      if (owner) {
        alignCBlockBodyEntryConnectors(owner)
        relayoutBlockAndAncestors(owner.container.id, this.createdMap)
      } else {
        this.bumpRevision()
      }
    }

    const slotInfo = this.slotZoneMap.get(zone)
    if (slotInfo) {
      relayoutBlockAndAncestors(slotInfo.blockId, this.createdMap)
      this.setNestedSlot(
        slotInfo.blockId,
        slotInfo.inputIndex,
        isNest ? container.id : null
      )
    }

    if (!this.syncRenderOrder()) {
      this.bumpRevision()
    }
  }

  /** headless-vpl のインタラクション設定オーバーライド */
  readonly interactionOverrides: Partial<InteractionConfig> = {
    snapConnections: this.snapConnections,
    nestingZones: this.nestingZones,
    onNest: (container, zone) => this.handleNestChange(container, zone, true),
    onUnnest: (container, zone) => this.handleNestChange(container, zone, false),
    onContainerPointerDown: (container) => {
      this.bringChainToFront(container.id)
    },
  }

  /** 状態変更リスナーを登録する。useSyncExternalStore の第1引数 */
  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** 現在のスナップショットを返す。useSyncExternalStore の第2引数 */
  readonly getSnapshot = () => this.snapshot

  /** ブロックIDからコンテナを取得する */
  getContainer(blockId: string): Container | undefined {
    return this.createdMap.get(blockId)?.container
  }

  /** ブロックIDから生成済みブロック情報を取得する */
  getCreatedBlock(blockId: string): CreatedBlock | undefined {
    return this.createdMap.get(blockId)
  }

  /** ブロックIDからCブロック参照を取得する */
  getCBlockRef(blockId: string): CBlockRef | undefined {
    return this.cBlockRefMap.get(blockId)
  }

  /** 手続きIDからカスタム手続き定義を取得する */
  getCustomProcedure(procedureId: string): CustomProcedure | undefined {
    return this.snapshot.customProcedures.find(
      (procedure) => procedure.id === procedureId
    )
  }

  /** ブロックの入力値を更新し、レイアウトを再計算する */
  updateInputValue(
    blockId: string,
    inputIndex: number,
    value: string
  ): void {
    const block = this.createdMap.get(blockId)
    if (!block) return
    if (block.state.inputValues[inputIndex] === value) return
    block.state.inputValues[inputIndex] = value
    relayoutBlockAndAncestors(blockId, this.createdMap)
    this.bumpRevision()
  }

  /** スプライト名変更時に、全ブロックの該当ドロップダウン値を旧名→新名に置換する */
  renameSpriteInBlocks(oldName: string, newName: string): void {
    console.log("[renameSpriteInBlocks]", { oldName, newName, mapSize: this.createdMap.size })
    for (const [blockId, created] of this.createdMap.entries()) {
      const opcode = created.state.def.opcode
      if (!opcode) continue
      const config = SPRITE_DROPDOWN_OPCODES[opcode]
      if (!config) {
        continue
      }
      const idx = config.inputIndex
      const inputDef = created.state.def.inputs[idx]
      const defaultVal = inputDef && "default" in inputDef ? inputDef.default : undefined
      const current = created.state.inputValues[idx] ?? defaultVal
      console.log("[renameSpriteInBlocks] block:", { blockId, opcode, idx, current, oldName, match: current === oldName })
      if (current === oldName) {
        this.updateInputValue(blockId, idx, newName)
      }
    }
  }

  /** 定義IDからブロックを生成してワークスペースに追加する */
  addBlock(defId: string, x: number, y: number): string | null {
    if (defId === STARTER_DEFINE_BLOCK_ID) {
      return this.createProcedureBlock(x, y)
    }
    if (!this.workspace) return null
    const def = getBlockDefById(defId, this.snapshot.customProcedures)
    if (!def) return null
    return this.insertBlock(def, x, y)
  }

  /** ブロックを削除する。ディファインブロックの場合は手続き全体を削除 */
  deleteBlock(blockId: string): void {
    const created = this.createdMap.get(blockId)
    if (!created) return

    if (created.state.def.source.kind === "custom-define") {
      this.removeProcedure(created.state.def.source.procedureId)
      return
    }

    this.deleteBlockInstance(blockId)
  }

  /** ブロックを複製する。ディファインブロックの場合は手続きごと複製 */
  duplicateBlock(blockId: string): string | null {
    const original = this.createdMap.get(blockId)
    if (!original) return null

    if (original.state.def.source.kind === "custom-define") {
      const procedure = this.getCustomProcedure(
        original.state.def.source.procedureId
      )
      if (!procedure) return null
      const cloned = this.procedureManager.cloneDefinition(procedure)
      const nextProcedures = [...this.snapshot.customProcedures, cloned]
      this.setCustomProcedures(nextProcedures)
      return this.addBlock(
        `${buildProcedureBlockDefs(cloned)[0].id}`,
        original.container.position.x + DUPLICATE_OFFSET,
        original.container.position.y + DUPLICATE_OFFSET
      )
    }

    return this.addDuplicatedBlock(original, DUPLICATE_OFFSET)
  }

  /** ワークスペースにマウントしてシーンを構築する。アンマウント関数を返す */
  mount(workspace: Workspace, containers: Container[]): () => void {
    if (this.workspace === workspace) {
      return () => this.unmount(workspace)
    }

    this.unmount()
    this.workspace = workspace
    this.containers = containers
    this.rebuildScene(workspace, containers)

    return () => this.unmount(workspace)
  }

  /** ワークスペースをリセットしてシーンを再構築する */
  reset(): void {
    if (!this.workspace) return
    const workspace = this.workspace
    const containers = this.containers
    this.unmount(workspace)
    this.workspace = workspace
    this.containers = containers
    this.rebuildScene(workspace, containers)
  }

  /** プロジェクトデータを読み込む。未マウント時は保留して後でリストアする */
  loadProjectData(projectData: BlockProjectData): void {
    const normalized: BlockProjectData = {
      customProcedures: (projectData.customProcedures ?? []).map(normalizeProcedure),
      customVariables: projectData.customVariables ?? [],
      workspace: {
        blocks: projectData.workspace?.blocks ?? [],
      },
    }

    if (!this.workspace) {
      this.pendingProjectData = normalized
      this.snapshot = {
        ...this.snapshot,
        customProcedures: normalized.customProcedures,
        customVariables: normalized.customVariables ?? [],
      }
      this.emit()
      return
    }

    this.rebuildFromProjectData(normalized, false)
  }

  /** 現在のワークスペース状態をプロジェクトデータとしてエクスポートする */
  exportProjectData(): BlockProjectData {
    return {
      customProcedures: this.snapshot.customProcedures.map(cloneProcedure),
      customVariables: [...this.snapshot.customVariables],
      workspace: this.exportWorkspaceData(),
    }
  }

  /** 手続き定義を更新する（export→rebuild の重いパスを通る） */
  updateProcedure(
    procedureId: string,
    updater: (procedure: CustomProcedure) => CustomProcedure
  ): void { this.procedureManager.update(procedureId, updater) }

  /** 手続きにラベルトークンを追加する */
  createProcedureLabel(procedureId: string): void { this.procedureManager.createLabel(procedureId) }

  /** 手続きにパラメータトークンを追加する */
  createProcedureParam(procedureId: string, valueType: "text" | "number"): void {
    this.procedureManager.createParam(procedureId, valueType)
  }

  /** 手続きトークンを前後に移動する */
  moveProcedureToken(procedureId: string, tokenId: string, direction: -1 | 1): void {
    this.procedureManager.moveToken(procedureId, tokenId, direction)
  }

  /** 手続きからトークンを削除する。パラメータトークンの場合はパラメータも削除 */
  removeProcedureToken(procedureId: string, tokenId: string): void {
    this.procedureManager.removeToken(procedureId, tokenId)
  }

  /** 手続きのラベルトークンのテキストを設定する */
  setProcedureLabelText(procedureId: string, tokenId: string, text: string): void {
    this.procedureManager.setLabelText(procedureId, tokenId, text)
  }

  /** 手続きパラメータの名前を設定する */
  setProcedureParamName(procedureId: string, paramId: string, name: string): void {
    this.procedureManager.setParamName(procedureId, paramId, name)
  }

  /** 手続きトークンの順序を変更する */
  reorderProcedureToken(procedureId: string, fromIndex: number, toIndex: number): void {
    this.procedureManager.reorderToken(procedureId, fromIndex, toIndex)
  }

  /** 手続きトークンの型を変更する（ラベル↔パラメータ） */
  changeProcedureTokenType(procedureId: string, tokenId: string, newType: "label" | "text" | "number"): void {
    this.procedureManager.changeTokenType(procedureId, tokenId, newType)
  }

  /** 手続きの戻り値有無を設定する */
  setProcedureReturnsValue(procedureId: string, returnsValue: boolean): void {
    this.procedureManager.setReturnsValue(procedureId, returnsValue)
  }

  /** ブロックを複製して入力値をコピーする */
  private addDuplicatedBlock(original: CreatedBlock, offset: number): string | null {
    const newId = this.addBlock(
      original.state.def.id,
      original.container.position.x + offset,
      original.container.position.y + offset
    )
    if (!newId) return null

    const nextBlock = this.createdMap.get(newId)
    if (!nextBlock) return newId
    for (const [key, value] of Object.entries(original.state.inputValues)) {
      nextBlock.state.inputValues[Number(key)] = value
    }
    relayoutBlockAndAncestors(newId, this.createdMap)
    this.bumpRevision()
    return newId
  }

  /** 指定した procedure 定義からブロックを作成してワークスペースに追加 */
  createProcedureFromSpec(procedure: CustomProcedure, x: number, y: number): string | null {
    return this.procedureManager.createFromSpec(procedure, x, y)
  }

  /** 新規カスタム手続きを作成してディファインブロックを配置する */
  private createProcedureBlock(x: number, y: number): string | null {
    return this.procedureManager.createBlock(x, y)
  }

  /** 手続きと関連ブロック（ディファイン・コール・引数）を全て削除する */
  private removeProcedure(procedureId: string): void {
    this.procedureManager.remove(procedureId)
  }

  /** 単一ブロックインスタンスを削除する（コネクタ・ゾーン・スロットのクリーンアップ含む） */
  private deleteBlockInstance(blockId: string): void {
    if (!this.workspace) return
    const created = this.createdMap.get(blockId)
    if (!created) return
    const container = created.container

    const connectorIds = new Set<string>()
    if (created.topConn) connectorIds.add(created.topConn.id)
    if (created.bottomConn) connectorIds.add(created.bottomConn.id)
    if (created.valueConnector) connectorIds.add(created.valueConnector.id)
    for (const slot of created.slotLayouts) {
      if (slot.connector) connectorIds.add(slot.connector.id)
    }
    if (created.cBlockRef) {
      for (const conn of created.cBlockRef.bodyEntryConnectors) {
        if (conn) connectorIds.add(conn.id)
      }
      if (created.cBlockRef.bottomConnector) {
        connectorIds.add(created.cBlockRef.bottomConnector.id)
      }
    }

    for (let index = this.snapConnections.length - 1; index >= 0; index -= 1) {
      const snap = this.snapConnections[index]
      if (connectorIds.has(snap.source.id) || connectorIds.has(snap.target.id)) {
        snap.destroy()
        this.snapConnections.splice(index, 1)
      }
    }

    for (let index = this.nestingZones.length - 1; index >= 0; index -= 1) {
      const zone = this.nestingZones[index]
      if (zone.target === container) {
        this.slotZoneMap.delete(zone)
        this.bodyZoneMap.delete(zone)
        this.nestingZones.splice(index, 1)
      }
    }

    if (created.cBlockRef) {
      const refIndex = this.cBlockRefs.indexOf(created.cBlockRef)
      if (refIndex !== -1) this.cBlockRefs.splice(refIndex, 1)
      this.cBlockRefMap.delete(blockId)
    }

    const nextSlots = { ...this.snapshot.nestedSlots }
    let slotsChanged = false
    for (const [key, value] of Object.entries(nextSlots)) {
      if (value === blockId || key.startsWith(`${blockId}-`)) {
        delete nextSlots[key]
        slotsChanged = true
      }
    }
    if (slotsChanged) this.setNestedSlots(nextSlots)

    this.workspace.removeContainer(container)
    this.createdMap.delete(blockId)
    this.containerMap.delete(blockId)
    const containerIndex = this.containers.indexOf(container)
    if (containerIndex !== -1) this.containers.splice(containerIndex, 1)

    this.refreshObservers()
    this.syncRenderOrder()
    this.bumpRevision()
  }

  /** シーンを構築する。保留データがあればリストア、なければサンプルシーン */
  private rebuildScene(workspace: Workspace, containers: Container[]): void {
    const pending = this.pendingProjectData
    this.pendingProjectData = null

    if (pending) {
      this.rebuildFromProjectData(pending, false)
      return
    }

    this.resetWorkspaceState(workspace, containers)

    const scene = buildSampleScene(workspace, this.containers)
    this.registerCreatedBlocks(scene.created)

    connectStackPairs({
      workspace,
      snapConnections: this.snapConnections,
      pairs: [
        [scene.definitions.move1, scene.definitions.flag],
        [scene.definitions.turn1, scene.definitions.move1],
        [scene.definitions.say1, scene.definitions.turn1],
        [scene.definitions.repeat1, scene.definitions.say1],
        [scene.definitions.if1, scene.definitions.keyPress],
      ],
    })
    seedInitialCBlockNest(scene.definitions.repeat1, [
      scene.definitions.moveInRepeat,
      scene.definitions.turnInRepeat,
    ])

    this.finalizeWorkspaceRegistration()
    this.setCustomProcedures([])
  }

  /** プロジェクトデータからワークスペース全体を再構築する */
  private rebuildFromProjectData(
    projectData: BlockProjectData,
    useSampleIfEmpty: boolean
  ): void {
    if (!this.workspace) return
    this.resetWorkspaceState(this.workspace, this.containers)
    this.setCustomProcedures(projectData.customProcedures)
    this.snapshot = {
      ...this.snapshot,
      customVariables: projectData.customVariables ?? [],
    }

    if (projectData.workspace.blocks.length === 0) {
      if (useSampleIfEmpty) {
        this.rebuildScene(this.workspace, this.containers)
      } else {
        this.applyRenderOrder([])
        this.bumpRevision()
      }
      return
    }

    rebuildBlocks(
      this.workspace,
      projectData,
      this.snapConnections,
      (created) => this.registerCreatedBlocks(created),
      (containers) => this.containers.push(...containers),
      (blockId, inputIndex, containerId) =>
        this.setNestedSlot(blockId, inputIndex, containerId),
    )

    this.finalizeWorkspaceRegistration()
  }

  /** 現在のワークスペース状態をシリアライズする */
  private exportWorkspaceData() {
    return exportWorkspaceBlocks(this.createdMap, this.snapshot.nestedSlots)
  }

  /** オブザーバー登録・描画順序同期・リビジョン更新をまとめて実行する */
  private finalizeWorkspaceRegistration(): void {
    this.refreshObservers()
    this.syncRenderOrder()
    this.bumpRevision()
  }

  /** 接続同期・サイズ監視・近接判定ループを開始する */
  private finalizeConnectionObservers(): void {
    if (!this.workspace) return
    this.stopConnectionSync = subscribeCBlockConnectionSync({
      workspace: this.workspace,
      containerMap: this.containerMap,
      cBlockRefs: this.cBlockRefs,
      onBodyLayoutChange: () => {
        relayoutCreatedBlocks(Array.from(this.createdMap.values()))
        this.syncRenderOrder()
        this.bumpRevision()
      },
    })
    this.stopSizeObservers = observeContainerContentSizes({
      items: Array.from(this.createdMap.values()),
      getContainer: (block) => block.container,
      resolveElement: (block) =>
        document.getElementById(`node-${block.state.id}`) as HTMLElement | null,
    })
    this.stopProximityLoop = startProximityLoop(
      this.workspace,
      this.activeBodyProximityIds,
      () => collectBodyZoneProximityHits(this.bodyZoneMap, this.createdMap)
    )
  }

  /** 生成済みブロックをマップに登録し、スナップ接続・ゾーンを構築する */
  private registerCreatedBlocks(created: CreatedBlock[]): void {
    for (const block of created) {
      this.createdMap.set(block.container.id, block)
      this.containerMap.set(block.container.id, block.container)
    }

    rebuildStackSnapConnections(this.workspace!, this.snapConnections, this.createdMap)
    relayoutCreatedBlocks(created)

    const registry = this.buildRegistry()
    registerCBlockBodyZones(
      this.workspace!,
      created,
      registry,
      this.cBlockRefs,
      this.nestingZones,
      this.bodyZoneMap
    )
    this.rebuildCBlockRefMap()
    registerSlotZones(
      this.workspace!,
      created,
      registry,
      this.nestingZones,
      this.slotZoneMap
    )
  }

  /** ゾーン登録用のブロックレジストリを構築する */
  private buildRegistry(): { blockMap: Map<string, BlockState>; createdMap: Map<string, CreatedBlock> } {
    const blockMap = new Map<string, BlockState>()
    for (const [id, block] of this.createdMap) {
      blockMap.set(id, block.state)
    }
    return { blockMap, createdMap: this.createdMap }
  }

  /** ワークスペースの状態をリセットする（オブザーバー停止・データクリア） */
  private resetWorkspaceState(workspace: Workspace, containers: Container[]): void {
    this.containers = containers
    this.cleanupObservers()

    resetEditorWorkspace(
      workspace,
      this.containers,
      this.snapConnections,
      this.nestingZones,
      this.cBlockRefs,
      this.createdMap,
      this.slotZoneMap,
      this.bodyZoneMap,
      () => this.setNestedSlots({})
    )
    this.resetCaches()
  }

  /** ワークスペースからアンマウントして全リソースを解放する */
  unmount(expectedWorkspace?: Workspace): void {
    if (expectedWorkspace && this.workspace !== expectedWorkspace) {
      return
    }

    const workspace = this.workspace
    this.cleanupObservers()

    if (workspace) {
      syncProximityHighlights(workspace, this.activeBodyProximityIds, new Map())
      resetEditorWorkspace(
        workspace,
        this.containers,
        this.snapConnections,
        this.nestingZones,
        this.cBlockRefs,
        this.createdMap,
        this.slotZoneMap,
        this.bodyZoneMap,
        () => this.setNestedSlots({})
      )
    } else {
      this.snapConnections.length = 0
      this.nestingZones.length = 0
      this.cBlockRefs.length = 0
      this.createdMap.clear()
      this.slotZoneMap.clear()
      this.bodyZoneMap.clear()
    }

    this.resetCaches()
    this.workspace = null
    this.containers = []
    this.setBlocks([])
  }

  /** ブロック定義からブロックを生成・登録・オブザーバー更新する */
  private insertBlock(def: BlockState["def"], x: number, y: number): string | null {
    if (!this.workspace) return null
    const created = createBlock(this.workspace, def, x, y)
    this.containers.push(created.container)
    this.registerCreatedBlocks([created])
    this.refreshObservers()
    this.syncRenderOrder()
    this.bumpRevision()
    return created.container.id
  }

  /** オブザーバーを停止して再開する。エラー時もリークしないよう try-finally で保護 */
  private refreshObservers(): void {
    this.cleanupObservers()
    try {
      this.finalizeConnectionObservers()
    } catch (e) {
      this.cleanupObservers()
      throw e
    }
  }

  /** 全オブザーバーを停止する */
  private cleanupObservers(): void {
    this.stopProximityLoop?.()
    this.stopConnectionSync?.()
    this.stopSizeObservers?.()
    this.stopProximityLoop = null
    this.stopConnectionSync = null
    this.stopSizeObservers = null
  }

  /** CブロックIDとCBlockRefの逆引きマップを再構築する */
  private rebuildCBlockRefMap(): void {
    this.cBlockRefMap.clear()
    for (const ref of this.cBlockRefs) {
      this.cBlockRefMap.set(ref.container.id, ref)
    }
  }

  /** 内部キャッシュ（containerMap・cBlockRefMap・proximityIds）をクリアする */
  private resetCaches(): void {
    this.containerMap.clear()
    this.cBlockRefMap.clear()
    this.activeBodyProximityIds.clear()
  }

  /** カスタム変数を追加する（重複は無視） */
  addVariable(name: string): void {
    this.variableManager.add(name)
  }

  /** カスタム変数を削除する */
  removeVariable(name: string): void {
    this.variableManager.remove(name)
  }

  /** カスタム手続き一覧を設定して購読者に通知する */
  private setCustomProcedures(customProcedures: CustomProcedure[]): void {
    this.snapshot = {
      ...this.snapshot,
      customProcedures: customProcedures.map(normalizeProcedure),
    }
    this.emit()
  }

  /** ネスト構造に基づいてコンテナの描画順序を同期する */
  private syncRenderOrder(): boolean {
    return this.applyRenderOrder(sortContainersForNestedRender(this.containers))
  }

  /** 新しい描画順序を適用し、変更があればスナップショットを更新する */
  private applyRenderOrder(nextContainers: Container[]): boolean {
    const nextBlocks = nextContainers.flatMap((container) => {
      const state = this.createdMap.get(container.id)?.state
      return state ? [state] : []
    })

    const containersChanged =
      nextContainers.length !== this.containers.length ||
      nextContainers.some(
        (container, index) => container !== this.containers[index]
      )
    const blocksChanged =
      nextBlocks.length !== this.snapshot.blocks.length ||
      nextBlocks.some((block, index) => block !== this.snapshot.blocks[index])

    if (!containersChanged && !blocksChanged) {
      return false
    }

    this.containers.splice(0, this.containers.length, ...nextContainers)
    this.setBlocks(nextBlocks)
    return true
  }

  /** ブロック一覧を設定して購読者に通知する */
  private setBlocks(blocks: BlockState[]): void {
    this.snapshot = {
      ...this.snapshot,
      blocks,
    }
    this.emit()
  }

  /** ネストスロット全体を設定する */
  private setNestedSlots(nestedSlots: Record<string, string>): void {
    this.snapshot = {
      ...this.snapshot,
      nestedSlots,
    }
    this.emit()
  }

  /** 個別のネストスロットを設定・解除する */
  private setNestedSlot(
    blockId: string,
    inputIndex: number,
    containerId: string | null
  ): void {
    const key = `${blockId}-${inputIndex}`
    const current = this.snapshot.nestedSlots[key]

    if (containerId === null) {
      if (!current) return
      const next = { ...this.snapshot.nestedSlots }
      delete next[key]
      this.setNestedSlots(next)
      return
    }

    if (current === containerId) return
    this.setNestedSlots({
      ...this.snapshot.nestedSlots,
      [key]: containerId,
    })
  }

  /** スナップショットの参照を更新して購読者に変更を通知する */
  private bumpRevision(): void {
    this.snapshot = {
      ...this.snapshot,
    }
    this.emit()
  }

  /** ブロックチェーンを描画順序の最前面に移動する */
  private bringChainToFront(blockId: string): void {
    const root = this.containerMap.get(blockId)
    if (!root || this.containers.length === 0 || this.snapshot.blocks.length === 0) {
      return
    }

    const chain = collectConnectedChain(root)
    const group = collectFrontGroup(this.containers, chain)
    const groupIds = new Set(group.map((container: Container) => container.id))
    if (groupIds.size === 0) {
      return
    }

    const nextContainers = this.containers.filter(
      (container) => !groupIds.has(container.id)
    )
    nextContainers.push(...group)
    this.applyRenderOrder(nextContainers)
  }

  /** ブロックIDからスタック接続で繋がったチェーン全体のIDリストを返す */
  getChainIds(blockId: string): string[] {
    const root = this.containerMap.get(blockId)
    if (!root) return [blockId]
    const chain = collectConnectedChain(root)
    return chain.map((c: Container) => c.id)
  }

  /** 全購読者に変更を通知する */
  private emit(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }
}
