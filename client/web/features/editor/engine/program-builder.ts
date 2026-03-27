import { Workspace } from "headless-vpl"
import { BlockEditorController } from "../block-editor/controller"
import type { BlockProjectData } from "../block-editor/types"
import type { SpriteDef } from "../constants"
import { buildScripts } from "./script-builder"
import type { CompiledProgram } from "./types"

type BlockDataMap = Record<string, BlockProjectData>

function createEmptyProgram(): CompiledProgram {
  return {
    eventScripts: [],
    procedures: {},
  }
}

export function compileProgramFromProjectData(
  projectData: BlockProjectData
): CompiledProgram {
  const workspace = new Workspace()
  const controller = new BlockEditorController()
  controller.loadProjectData(projectData)
  const unmount = controller.mount(workspace, [])

  try {
    return buildScripts(controller)
  } finally {
    unmount()
  }
}

export function buildProgramsForSprites({
  sprites,
  selectedSpriteId,
  controller,
  blockDataMap,
}: {
  sprites: SpriteDef[]
  selectedSpriteId: string | null
  controller: BlockEditorController
  blockDataMap: BlockDataMap
}): Record<string, CompiledProgram> {
  const programs: Record<string, CompiledProgram> = {}
  const selectedId =
    selectedSpriteId && sprites.some((sprite) => sprite.id === selectedSpriteId)
      ? selectedSpriteId
      : (sprites[0]?.id ?? null)

  if (selectedId) {
    programs[selectedId] = buildScripts(controller)
  }

  for (const sprite of sprites) {
    if (sprite.id === selectedId) continue

    const data = blockDataMap[sprite.id]
    if (!data || data.workspace.blocks.length === 0) {
      programs[sprite.id] = createEmptyProgram()
      continue
    }

    programs[sprite.id] = compileProgramFromProjectData(data)
  }

  return programs
}
