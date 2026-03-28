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
  SerializedBlockNode,
} from "./types"
import {
  buildProcedureBlockDefs,
  createDefaultProcedure,
  createDefaultProcedureParam,
  getBlockDefById,
  getInputIndexBySerializationKey,
  getInputSerializationKey,
  normalizeProcedure,
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

function cloneProcedure<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

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

  readonly snapConnections: SnapConnection[] = []
  readonly nestingZones: NestingZone[] = []
  readonly cBlockRefs: CBlockRef[] = []

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

    // ネスト変更後にスナップ接続を再構築（body エントリコネクタとの関係を更新）
    rebuildStackSnapConnections(this.workspace!, this.snapConnections, this.createdMap)

    if (!this.syncRenderOrder()) {
      this.bumpRevision()
    }
  }

  readonly interactionOverrides: Partial<InteractionConfig> = {
    snapConnections: this.snapConnections,
    nestingZones: this.nestingZones,
    onNest: (container, zone) => this.handleNestChange(container, zone, true),
    onUnnest: (container, zone) => this.handleNestChange(container, zone, false),
    onContainerPointerDown: (container) => {
      this.bringChainToFront(container.id)
    },
  }

  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  readonly getSnapshot = () => this.snapshot

  getContainer(blockId: string): Container | undefined {
    return this.createdMap.get(blockId)?.container
  }

  getCreatedBlock(blockId: string): CreatedBlock | undefined {
    return this.createdMap.get(blockId)
  }

  getCBlockRef(blockId: string): CBlockRef | undefined {
    return this.cBlockRefMap.get(blockId)
  }

  getCustomProcedure(procedureId: string): CustomProcedure | undefined {
    return this.snapshot.customProcedures.find(
      (procedure) => procedure.id === procedureId
    )
  }

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

  addBlock(defId: string, x: number, y: number): string | null {
    if (defId === STARTER_DEFINE_BLOCK_ID) {
      return this.createProcedureBlock(x, y)
    }
    if (!this.workspace) return null
    const def = getBlockDefById(defId, this.snapshot.customProcedures)
    if (!def) return null
    return this.insertBlock(def, x, y)
  }

  deleteBlock(blockId: string): void {
    const created = this.createdMap.get(blockId)
    if (!created) return

    if (created.state.def.source.kind === "custom-define") {
      this.removeProcedure(created.state.def.source.procedureId)
      return
    }

    this.deleteBlockInstance(blockId)
  }

  duplicateBlock(blockId: string): string | null {
    const original = this.createdMap.get(blockId)
    if (!original) return null

    const OFFSET = 48
    if (original.state.def.source.kind === "custom-define") {
      const procedure = this.getCustomProcedure(
        original.state.def.source.procedureId
      )
      if (!procedure) return null
      const cloned = this.cloneProcedureDefinition(procedure)
      const nextProcedures = [...this.snapshot.customProcedures, cloned]
      this.setCustomProcedures(nextProcedures)
      return this.addBlock(
        `${buildProcedureBlockDefs(cloned)[0].id}`,
        original.container.position.x + OFFSET,
        original.container.position.y + OFFSET
      )
    }

    return this.addDuplicatedBlock(original, OFFSET)
  }

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

  reset(): void {
    if (!this.workspace) return
    const workspace = this.workspace
    const containers = this.containers
    this.unmount(workspace)
    this.workspace = workspace
    this.containers = containers
    this.rebuildScene(workspace, containers)
  }

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

  exportProjectData(): BlockProjectData {
    return {
      customProcedures: this.snapshot.customProcedures.map(cloneProcedure),
      customVariables: [...this.snapshot.customVariables],
      workspace: this.exportWorkspaceData(),
    }
  }

  updateProcedure(
    procedureId: string,
    updater: (procedure: CustomProcedure) => CustomProcedure
  ): void {
    const data = this.exportProjectData()
    const procedures = data.customProcedures.map((procedure) =>
      procedure.id === procedureId
        ? normalizeProcedure(updater(cloneProcedure(procedure)))
        : procedure
    )
    this.rebuildFromProjectData(
      {
        ...data,
        customProcedures: procedures,
      },
      false
    )
  }

  createProcedureLabel(procedureId: string): void {
    this.updateProcedure(procedureId, (procedure) => ({
      ...procedure,
      tokens: [
        ...procedure.tokens,
        { id: `token-${Date.now()}`, type: "label", text: "label" },
      ],
    }))
  }

  createProcedureParam(
    procedureId: string,
    valueType: "text" | "number"
  ): void {
    this.updateProcedure(procedureId, (procedure) => {
      const param = createDefaultProcedureParam(valueType)
      return {
        ...procedure,
        params: [...procedure.params, param],
        tokens: [
          ...procedure.tokens,
          { id: `token-${Date.now()}`, type: "param", paramId: param.id },
        ],
      }
    })
  }

  moveProcedureToken(procedureId: string, tokenId: string, direction: -1 | 1): void {
    this.updateProcedure(procedureId, (procedure) => {
      const index = procedure.tokens.findIndex((token) => token.id === tokenId)
      if (index === -1) return procedure
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= procedure.tokens.length) return procedure
      const tokens = procedure.tokens.slice()
      const [token] = tokens.splice(index, 1)
      tokens.splice(nextIndex, 0, token)
      return {
        ...procedure,
        tokens,
      }
    })
  }

  removeProcedureToken(procedureId: string, tokenId: string): void {
    this.updateProcedure(procedureId, (procedure) => {
      const token = procedure.tokens.find((item) => item.id === tokenId)
      if (!token) return procedure
      const tokens = procedure.tokens.filter((item) => item.id !== tokenId)
      if (token.type === "param") {
        return {
          ...procedure,
          tokens,
          params: procedure.params.filter((param) => param.id !== token.paramId),
        }
      }
      return {
        ...procedure,
        tokens,
      }
    })
  }

  setProcedureLabelText(
    procedureId: string,
    tokenId: string,
    text: string
  ): void {
    this.updateProcedure(procedureId, (procedure) => ({
      ...procedure,
      tokens: procedure.tokens.map((token) =>
        token.id === tokenId && token.type === "label"
          ? { ...token, text }
          : token
      ),
    }))
  }

  setProcedureParamName(
    procedureId: string,
    paramId: string,
    name: string
  ): void {
    this.updateProcedure(procedureId, (procedure) => ({
      ...procedure,
      params: procedure.params.map((param) =>
        param.id === paramId ? { ...param, name } : param
      ),
    }))
  }

  reorderProcedureToken(procedureId: string, fromIndex: number, toIndex: number): void {
    this.updateProcedure(procedureId, (procedure) => {
      if (fromIndex < 0 || fromIndex >= procedure.tokens.length) return procedure
      if (toIndex < 0 || toIndex >= procedure.tokens.length) return procedure
      const tokens = procedure.tokens.slice()
      const [token] = tokens.splice(fromIndex, 1)
      tokens.splice(toIndex, 0, token)
      return { ...procedure, tokens }
    })
  }

  changeProcedureTokenType(
    procedureId: string,
    tokenId: string,
    newType: "label" | "text" | "number"
  ): void {
    this.updateProcedure(procedureId, (procedure) => {
      const tokenIndex = procedure.tokens.findIndex((t) => t.id === tokenId)
      if (tokenIndex === -1) return procedure
      const token = procedure.tokens[tokenIndex]

      const currentType = token.type === "label"
        ? "label"
        : (procedure.params.find((p) => p.id === token.paramId)?.valueType ?? "text")
      if (currentType === newType) return procedure

      // 古い param があれば削除
      let params = [...procedure.params]
      if (token.type === "param") {
        params = params.filter((p) => p.id !== token.paramId)
      }

      let newToken: typeof token
      if (newType === "label") {
        const oldText = token.type === "label"
          ? token.text
          : (procedure.params.find((p) => p.id === token.paramId)?.name ?? "label")
        newToken = { id: token.id, type: "label", text: oldText }
      } else {
        const param = createDefaultProcedureParam(newType)
        const oldName = token.type === "label"
          ? token.text
          : (procedure.params.find((p) => p.id === token.paramId)?.name ?? param.name)
        param.name = oldName
        params = [...params, param]
        newToken = { id: token.id, type: "param", paramId: param.id }
      }

      const tokens = procedure.tokens.slice()
      tokens[tokenIndex] = newToken
      return { ...procedure, tokens, params }
    })
  }

  setProcedureReturnsValue(procedureId: string, returnsValue: boolean): void {
    this.updateProcedure(procedureId, (procedure) => ({
      ...procedure,
      returnsValue,
    }))
  }

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
    const normalized = normalizeProcedure(procedure)
    const nextProcedures = [...this.snapshot.customProcedures, normalized]
    this.setCustomProcedures(nextProcedures)
    const defId = buildProcedureBlockDefs(normalized)[0].id
    if (!this.workspace) return null
    const def = getBlockDefById(defId, nextProcedures)
    if (!def) return null
    return this.insertBlock(def, x, y)
  }

  private createProcedureBlock(x: number, y: number): string | null {
    const procedure = normalizeProcedure(createDefaultProcedure())
    const nextProcedures = [...this.snapshot.customProcedures, procedure]
    this.setCustomProcedures(nextProcedures)
    return this.addBlock(`${buildProcedureBlockDefs(procedure)[0].id}`, x, y)
  }

  private cloneProcedureDefinition(procedure: CustomProcedure): CustomProcedure {
    const paramIdMap = new Map<string, string>()
    const params = procedure.params.map((param) => {
      const nextId = createDefaultProcedureParam(param.valueType).id
      paramIdMap.set(param.id, nextId)
      return {
        ...param,
        id: nextId,
      }
    })
    const tokens = procedure.tokens.map((token) =>
      token.type === "label"
        ? { ...token, id: `token-${Date.now()}-${Math.random()}` }
        : {
            ...token,
            id: `token-${Date.now()}-${Math.random()}`,
            paramId: paramIdMap.get(token.paramId) ?? token.paramId,
          }
    )
    return normalizeProcedure({
      ...procedure,
      id: `procedure-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      params,
      tokens,
    })
  }

  private removeProcedure(procedureId: string): void {
    const data = this.exportProjectData()
    const procedure = data.customProcedures.find((item) => item.id === procedureId)
    if (!procedure) return
    const defIds = new Set(buildProcedureBlockDefs(procedure).map((def) => def.id))
    const removedIds = new Set(
      data.workspace.blocks
        .filter((block) => defIds.has(block.defId))
        .map((block) => block.instanceId)
    )
    const workspaceBlocks = data.workspace.blocks
      .filter((block) => !removedIds.has(block.instanceId))
      .map((block) => ({
        ...block,
        nextId: block.nextId && removedIds.has(block.nextId) ? null : block.nextId,
        bodyChildren: block.bodyChildren.map((body) =>
          body.filter((id) => !removedIds.has(id))
        ),
        slotChildren: Object.fromEntries(
          Object.entries(block.slotChildren).filter(
            ([, childId]) => !removedIds.has(childId)
          )
        ),
      }))

    this.rebuildFromProjectData(
      {
        customProcedures: data.customProcedures.filter(
          (item) => item.id !== procedureId
        ),
        workspace: { blocks: workspaceBlocks },
      },
      false
    )
  }

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

    const createdList: CreatedBlock[] = []
    const idMap = new Map<string, CreatedBlock>()
    const nodeMap = new Map(
      projectData.workspace.blocks.map((node) => [node.instanceId, node] as const)
    )

    for (const node of projectData.workspace.blocks) {
      const def = getBlockDefById(node.defId, projectData.customProcedures)
      if (!def) continue
      const created = createBlock(
        this.workspace,
        def,
        node.position.x,
        node.position.y
      )
      for (const [key, value] of Object.entries(node.inputValues)) {
        const inputIndex = getInputIndexBySerializationKey(def, key)
        if (inputIndex >= 0) {
          created.state.inputValues[inputIndex] = value
        }
      }
      createdList.push(created)
      this.containers.push(created.container)
      idMap.set(node.instanceId, created)
    }

    this.registerCreatedBlocks(createdList)

    const bodyMembers = new Set<string>()
    const slotMembers = new Set<string>()
    for (const node of projectData.workspace.blocks) {
      for (const body of node.bodyChildren) {
        for (const childId of body) {
          bodyMembers.add(childId)
        }
      }
      for (const childId of Object.values(node.slotChildren)) {
        slotMembers.add(childId)
      }
    }

    const topLevelPairs: Array<[CreatedBlock, CreatedBlock]> = []
    const detachedChainRoots = new Set<string>()
    for (const node of projectData.workspace.blocks) {
      if (!node.nextId) continue
      if (bodyMembers.has(node.nextId) || slotMembers.has(node.nextId)) continue
      const parent = idMap.get(node.instanceId)
      const child = idMap.get(node.nextId)
      if (parent && child) {
        if (!parent.bottomConn || !child.topConn) {
          detachedChainRoots.add(node.nextId)
          continue
        }
        topLevelPairs.push([child, parent])
      }
    }

    if (topLevelPairs.length > 0) {
      connectStackPairs({
        workspace: this.workspace,
        snapConnections: this.snapConnections,
        pairs: topLevelPairs,
      })
    }

    for (const rootId of detachedChainRoots) {
      this.offsetDetachedTopLevelChain(
        rootId,
        nodeMap,
        idMap,
        bodyMembers,
        slotMembers
      )
    }

    for (const node of projectData.workspace.blocks) {
      const owner = idMap.get(node.instanceId)
      if (!owner?.cBlockRef) continue
      node.bodyChildren.forEach((body, bodyIndex) => {
        const layout = owner.cBlockRef?.bodyLayouts[bodyIndex]
        if (!layout) return
        body.forEach((childId, index) => {
          const child = idMap.get(childId)
          if (!child) return
          layout.insertElement(child.container, index)
        })
        syncBodyLayoutChain(layout)
        layout.update()
      })
      alignCBlockBodyEntryConnectors(owner.cBlockRef)
    }

    for (const node of projectData.workspace.blocks) {
      const owner = idMap.get(node.instanceId)
      if (!owner) continue
      for (const [key, childId] of Object.entries(node.slotChildren)) {
        const child = idMap.get(childId)
        if (!child) continue
        const inputIndex = getInputIndexBySerializationKey(owner.state.def, key)
        if (inputIndex === -1) continue
        const slot = owner.slotLayouts.find(
          (item) => item.info.inputIndex === inputIndex
        )
        if (!slot) continue
        if (!slot.info.acceptedShapes.includes(child.state.def.shape as never)) {
          child.container.move(
            child.container.position.x + 24,
            child.container.position.y + 24
          )
          continue
        }
        slot.layout.insertElement(child.container, 0)
        this.setNestedSlot(owner.state.id, inputIndex, child.state.id)
      }
    }

    relayoutCreatedBlocks(createdList)
    this.finalizeWorkspaceRegistration()
  }

  private exportWorkspaceData() {
    const blocks: SerializedBlockNode[] = Array.from(this.createdMap.values()).map(
      (created) => {
        const inputValues = Object.fromEntries(
          Object.entries(created.state.inputValues).map(([index, value]) => {
            const inputIndex = Number(index)
            const input = created.state.def.inputs[inputIndex]
            return [
              getInputSerializationKey(created.state.def, input, inputIndex),
              value,
            ]
          })
        )

        const slotChildren = Object.fromEntries(
          Object.entries(this.snapshot.nestedSlots)
            .filter(([key]) => key.startsWith(`${created.state.id}-`))
            .map(([key, childId]) => {
              const inputIndex = Number(key.split("-").at(-1) ?? -1)
              const input = created.state.def.inputs[inputIndex]
              return [
                getInputSerializationKey(created.state.def, input, inputIndex),
                childId,
              ]
            })
        )

        const bodyChildren = created.cBlockRef
          ? created.cBlockRef.bodyLayouts.map((layout) =>
              layout.Children.map((child) => child.id)
            )
          : []

        const nextId =
          Array.from(created.container.Children).find(
            (child) => child.Parent === created.container
          )?.id ?? null

        return {
          instanceId: created.state.id,
          defId: created.state.def.id,
          inputValues,
          position: {
            x: created.container.position.x,
            y: created.container.position.y,
          },
          nextId,
          bodyChildren,
          slotChildren,
        }
      }
    )

    return { blocks }
  }

  private offsetDetachedTopLevelChain(
    rootId: string,
    nodeMap: ReadonlyMap<string, SerializedBlockNode>,
    idMap: ReadonlyMap<string, CreatedBlock>,
    bodyMembers: ReadonlySet<string>,
    slotMembers: ReadonlySet<string>
  ): void {
    let currentId: string | null = rootId
    while (currentId) {
      const created = idMap.get(currentId)
      if (created) {
        created.container.move(
          created.container.position.x + 32,
          created.container.position.y + 32
        )
      }
      const node = nodeMap.get(currentId)
      const nextId = node?.nextId ?? null
      if (!nextId || bodyMembers.has(nextId) || slotMembers.has(nextId)) {
        break
      }
      currentId = nextId
    }
  }

  private finalizeWorkspaceRegistration(): void {
    this.refreshObservers()
    this.syncRenderOrder()
    this.bumpRevision()
  }

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

  private registerCreatedBlocks(created: CreatedBlock[]): void {
    for (const block of created) {
      this.createdMap.set(block.container.id, block)
      this.containerMap.set(block.container.id, block.container)
    }

    rebuildStackSnapConnections(this.workspace!, this.snapConnections, this.createdMap)
    relayoutCreatedBlocks(created)
    registerCBlockBodyZones(
      this.workspace!,
      created,
      this.createdMap,
      this.cBlockRefs,
      this.nestingZones,
      this.bodyZoneMap
    )
    this.rebuildCBlockRefMap()
    registerSlotZones(
      this.workspace!,
      created,
      this.createdMap,
      this.nestingZones,
      this.slotZoneMap
    )
  }

  private resetWorkspaceState(workspace: Workspace, containers: Container[]): void {
    this.containers = containers
    this.stopProximityLoop?.()
    this.stopProximityLoop = null
    this.stopConnectionSync?.()
    this.stopConnectionSync = null
    this.stopSizeObservers?.()
    this.stopSizeObservers = null

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

  unmount(expectedWorkspace?: Workspace): void {
    if (expectedWorkspace && this.workspace !== expectedWorkspace) {
      return
    }

    const workspace = this.workspace
    this.stopProximityLoop?.()
    this.stopConnectionSync?.()
    this.stopSizeObservers?.()
    this.stopProximityLoop = null
    this.stopConnectionSync = null
    this.stopSizeObservers = null

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

  private refreshObservers(): void {
    this.stopProximityLoop?.()
    this.stopConnectionSync?.()
    this.stopSizeObservers?.()
    this.stopProximityLoop = null
    this.stopConnectionSync = null
    this.stopSizeObservers = null
    this.finalizeConnectionObservers()
  }

  private rebuildCBlockRefMap(): void {
    this.cBlockRefMap.clear()
    for (const ref of this.cBlockRefs) {
      this.cBlockRefMap.set(ref.container.id, ref)
    }
  }

  private resetCaches(): void {
    this.containerMap.clear()
    this.cBlockRefMap.clear()
    this.activeBodyProximityIds.clear()
  }

  addVariable(name: string): void {
    if (this.snapshot.customVariables.includes(name)) return
    this.snapshot = {
      ...this.snapshot,
      customVariables: [...this.snapshot.customVariables, name],
    }
    this.emit()
  }

  removeVariable(name: string): void {
    this.snapshot = {
      ...this.snapshot,
      customVariables: this.snapshot.customVariables.filter((v) => v !== name),
    }
    this.emit()
  }

  private setCustomProcedures(customProcedures: CustomProcedure[]): void {
    this.snapshot = {
      ...this.snapshot,
      customProcedures: customProcedures.map(normalizeProcedure),
    }
    this.emit()
  }

  private syncRenderOrder(): boolean {
    return this.applyRenderOrder(sortContainersForNestedRender(this.containers))
  }

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

  private setBlocks(blocks: BlockState[]): void {
    this.snapshot = {
      ...this.snapshot,
      blocks,
    }
    this.emit()
  }

  private setNestedSlots(nestedSlots: Record<string, string>): void {
    this.snapshot = {
      ...this.snapshot,
      nestedSlots,
    }
    this.emit()
  }

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

  private bumpRevision(): void {
    this.snapshot = {
      ...this.snapshot,
    }
    this.emit()
  }

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

  getChainIds(blockId: string): string[] {
    const root = this.containerMap.get(blockId)
    if (!root) return [blockId]
    const chain = collectConnectedChain(root)
    return chain.map((c: Container) => c.id)
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }
}
