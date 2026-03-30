"use client"

import CodeMirror from "@uiw/react-codemirror"
import { vscodeDark } from "@uiw/codemirror-theme-vscode"
import { customLanguage, customAutocompletion, customLinter } from "../codegen/codemirror-language"
import { useMemo } from "react"
import { indentOnInput, bracketMatching } from "@codemirror/language"
import { closeBrackets } from "@codemirror/autocomplete"

export default function TextEditorCodeMirror({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const extensions = useMemo(() => [
    customLanguage,
    customAutocompletion,
    customLinter,
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
  ], [])

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme={vscodeDark}
      height="100%"
      style={{ height: "100%" }}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        highlightSelectionMatches: true,
        foldGutter: true,
        indentOnInput: false, // 上の indentOnInput() で管理
        autocompletion: false, // customAutocompletion で管理
      }}
      placeholder={`// クラスベースの疑似コードを記述
class スプライト名 {
  var score = 0

  onCreate() {
    this.setPosition(0, 0)
  }

  onUpdate() {
    if (this.isKeyPressed("right arrow")) {
      this.x += 5
    }
  }
}`}
    />
  )
}
