"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Mosaic,
  MosaicWindow,
  type MosaicNode,
  type MosaicPath,
} from "react-mosaic-component"
import { EditorHeader } from "@/features/editor/components/editor-header"
import { BlockPalette } from "@/features/editor/components/block-palette"
import { BlockWorkspace } from "@/features/editor/components/block-workspace"
import { StagePanel } from "@/features/editor/components/stage-panel"
import { SpriteList } from "@/features/editor/components/sprite-list"
import { useEditorState } from "@/features/editor/hooks/use-editor-state"
import { useProjectSave } from "@/features/editor/hooks/use-project-save"

type EditorTileId = "palette" | "workspace" | "stage" | "sprites"

const TILE_TITLES: Record<EditorTileId, string> = {
  palette: "ブロックパレット",
  workspace: "ワークスペース",
  stage: "ステージ",
  sprites: "スプライト",
}

const DEFAULT_LAYOUT: MosaicNode<EditorTileId> = {
  type: "split",
  direction: "row",
  children: [
    "palette",
    "workspace",
    {
      type: "split",
      direction: "column",
      children: ["stage", "sprites"],
      splitPercentages: [55, 45],
    },
  ],
  splitPercentages: [15, 55, 30],
}

export function EditorContent() {
  const editor = useEditorState()
  const searchParams = useSearchParams()
  const projectIdParam = searchParams.get("id")
  const [mosaicLayout, setMosaicLayout] = useState<MosaicNode<EditorTileId> | null>(DEFAULT_LAYOUT)

  const project = useProjectSave({
    projectName: editor.projectName,
    setProjectName: editor.setProjectName,
    sprites: editor.sprites,
    setSprites: editor.setSprites,
  })

  // URL の ?id= からプロジェクトを読み込み
  useEffect(() => {
    if (projectIdParam && !project.projectId && !project.isLoading) {
      project.loadProject(projectIdParam)
    }
  }, [projectIdParam, project.projectId, project.isLoading, project.loadProject])

  const renderTile = useCallback(
    (id: EditorTileId, path: MosaicPath) => {
      const content: Record<EditorTileId, React.ReactNode> = {
        palette: (
          <BlockPalette
            selectedCategory={editor.selectedCategory}
            onSelectCategory={editor.setSelectedCategory}
          />
        ),
        workspace: <BlockWorkspace />,
        stage: (
          <StagePanel
            sprites={editor.sprites}
            isRunning={editor.isRunning}
            onSaveThumbnail={project.projectId ? project.saveThumbnail : undefined}
          />
        ),
        sprites: (
          <SpriteList
            sprites={editor.sprites}
            selectedSpriteId={editor.selectedSpriteId}
            onSelectSprite={editor.setSelectedSpriteId}
            onAddSprite={editor.addSprite}
            onDeleteSprite={editor.deleteSprite}
          />
        ),
      }

      return (
        <MosaicWindow<EditorTileId>
          path={path}
          title={TILE_TITLES[id]}
          toolbarControls={<></>}
        >
          {content[id]}
        </MosaicWindow>
      )
    },
    [editor, project],
  )

  if (project.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  return (
    <>
      <EditorHeader
        projectName={editor.projectName}
        onProjectNameChange={editor.setProjectName}
        isRunning={editor.isRunning}
        onRun={editor.handleRun}
        onStop={editor.handleStop}
        isSaving={project.isSaving}
        onSave={project.saveProject}
        onShare={project.shareProject}
      />

      <div className="flex-1 min-h-0">
        <Mosaic<EditorTileId>
          renderTile={renderTile}
          value={mosaicLayout}
          onChange={setMosaicLayout}
        />
      </div>
    </>
  )
}
