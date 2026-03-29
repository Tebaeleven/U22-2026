// 永続化された BlockProjectData 内のスプライト名参照を一括置換する
import type { BlockProjectData } from "./types"
import { getBlockDefById, SPRITE_DROPDOWN_OPCODES } from "./blocks/block-defs"
import { getInputSerializationKey } from "./blocks/input-helpers"

/** シリアライズ済みワークスペース内のスプライト系ドロップダウン値を oldName → newName に置換する */
export function applySpriteRenameToBlockProjectData(
  data: BlockProjectData,
  oldName: string,
  newName: string
): BlockProjectData {
  if (oldName === newName) return data
  const customProcedures = data.customProcedures
  const blocks = data.workspace.blocks
  let newBlocks: typeof blocks | null = null

  for (let i = 0; i < blocks.length; i++) {
    const node = blocks[i]
    const def = getBlockDefById(node.defId, customProcedures)
    if (!def?.opcode) continue
    const config = SPRITE_DROPDOWN_OPCODES[def.opcode]
    if (!config) continue
    const idx = config.inputIndex
    const inputDef = def.inputs[idx]
    if (!inputDef || inputDef.type !== "dropdown") continue
    const key = getInputSerializationKey(def, inputDef, idx)
    const defaultVal =
      "default" in inputDef ? String(inputDef.default) : ""
    const current = node.inputValues[key] ?? defaultVal
    if (current !== oldName) continue

    if (!newBlocks) {
      newBlocks = blocks.slice()
    }
    newBlocks[i] = {
      ...node,
      inputValues: { ...node.inputValues, [key]: newName },
    }
  }

  if (!newBlocks) return data
  return {
    ...data,
    workspace: {
      ...data.workspace,
      blocks: newBlocks,
    },
  }
}
