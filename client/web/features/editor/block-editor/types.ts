// ブロックエディタの型定義
import type { AutoLayout, Connector, Container, Position } from "headless-vpl"

export type BlockShape =
  | "hat"
  | "stack"
  | "c-block"
  | "c-block-else"
  | "cap-c"
  | "reporter"
  | "boolean"

export type ValueBlockShape = "reporter" | "boolean"

export type ProcedureParamType = "text" | "number"

export type CustomProcedureParam = {
  id: string
  name: string
  valueType: ProcedureParamType
}

export type CustomProcedureToken =
  | {
      id: string
      type: "label"
      text: string
    }
  | {
      id: string
      type: "param"
      paramId: string
    }

export type CustomProcedure = {
  id: string
  name: string
  tokens: CustomProcedureToken[]
  params: CustomProcedureParam[]
  returnsValue: boolean
}

export type BuiltinBlockSource = {
  kind: "builtin"
}

export type StarterDefineBlockSource = {
  kind: "starter-define"
}

export type CustomDefineBlockSource = {
  kind: "custom-define"
  procedureId: string
}

export type CustomCallBlockSource = {
  kind: "custom-call"
  procedureId: string
}

export type CustomArgumentBlockSource = {
  kind: "custom-argument"
  procedureId: string
  paramId: string
}

export type CustomReturnBlockSource = {
  kind: "custom-return"
}

export type BlockSource =
  | BuiltinBlockSource
  | StarterDefineBlockSource
  | CustomDefineBlockSource
  | CustomCallBlockSource
  | CustomArgumentBlockSource
  | CustomReturnBlockSource

export type HeaderReporterCopy = {
  label?: string
  labelInputIndex?: number
  blockName?: string
  targetOpcode?: string
  targetShape?: ValueBlockShape
  inputBindings?: Record<number, number>
}

export type InputDef =
  | {
      type: "number"
      default: number
      placeholder?: string
      paramId?: string
      minWidth?: number
      maxWidth?: number
    }
  | {
      type: "text"
      default: string
      placeholder?: string
      paramId?: string
      minWidth?: number
      maxWidth?: number
    }
  | {
      type: "variable-name"
      default: string
      placeholder?: string
      editable?: boolean
      appearance?: "inline-reporter"
      copySource?: HeaderReporterCopy
      minWidth?: number
      maxWidth?: number
    }
  | {
      type: "dropdown"
      default: string
      options: string[]
      minWidth?: number
      maxWidth?: number
    }
  | {
      type: "param-chip"
      paramId: string
      label: string
      valueType: ProcedureParamType
    }
  | {
      type: "boolean-slot"
      minWidth?: number
      maxWidth?: number
    }
  | { type: "label"; text: string }

export type BlockCategory =
  | "motion"
  | "looks"
  | "sound"
  | "events"
  | "control"
  | "sensing"
  | "operators"
  | "variables"
  | "lists"
  | "myblocks"
  | "physics"

export type BlockDef = {
  id: string
  name: string
  opcode?: string
  shape: BlockShape
  color: string
  inputs: InputDef[]
  category: BlockCategory
  source: BlockSource
  headerReporterCopies?: HeaderReporterCopy[]
  paletteHidden?: boolean
}

export type BlockState = {
  id: string
  def: BlockDef
  inputValues: Record<number, string>
}

export type CBlockRef = {
  container: Container
  bodyLayouts: AutoLayout[]
  bodyEntryConnectors: Connector[]
  bottomConnector: Connector | null
}

export type SlotInfo = {
  inputIndex: number
  x: number
  y: number
  w: number
  h: number
  acceptedShapes: ValueBlockShape[]
}

export type SlotLayoutRef = {
  info: SlotInfo
  layout: AutoLayout
  connector: Connector | null
}

export type CreatedBlock = {
  container: Container
  topConn: Connector | null
  bottomConn: Connector | null
  cBlockRef: CBlockRef | null
  slotLayouts: SlotLayoutRef[]
  valueConnector: Connector | null
  state: BlockState
}

export type BlockRegistry = {
  blockMap: Map<string, BlockState>
  createdMap: Map<string, CreatedBlock>
  containerMap: Map<string, Container>
}

export type SerializedBlockNode = {
  instanceId: string
  defId: string
  inputValues: Record<string, string>
  position: {
    x: number
    y: number
  }
  nextId: string | null
  bodyChildren: string[][]
  slotChildren: Record<string, string>
}

export type BlockWorkspaceData = {
  blocks: SerializedBlockNode[]
}

export type BlockProjectData = {
  customProcedures: CustomProcedure[]
  workspace: BlockWorkspaceData
}

export type SlotZoneMeta = {
  blockId: string
  inputIndex: number
}

export type BodyZoneMeta = {
  bodyEntryConnector: Connector | undefined
}

export type BodyLayoutHit = {
  insertIndex: number
  targetConnector: Connector
  draggedBlock: CreatedBlock
}

export type SampleScene = {
  created: CreatedBlock[]
  definitions: Record<string, CreatedBlock>
}

export type ShapeConfig = {
  size: { w: number; h: number }
  connectors: { top: boolean; bottom: boolean; value?: boolean }
  bodies?: { minHeight: number }[]
}

export type ProximityHit = {
  source: Container
  sourcePosition: Position
  targetPosition: Position
  snapDistance: number
}
