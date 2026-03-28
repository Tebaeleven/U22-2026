// 変数管理マネージャー

/** VariableManager がコントローラーに要求する操作のインターフェース */
export type VariableManagerHost = {
  getCustomVariables(): string[]
  setCustomVariables(variables: string[]): void
}

/** カスタム変数の追加・削除を管理する */
export class VariableManager {
  constructor(private readonly host: VariableManagerHost) {}

  /** カスタム変数を追加する（重複は無視） */
  add(name: string): void {
    const current = this.host.getCustomVariables()
    if (current.includes(name)) return
    this.host.setCustomVariables([...current, name])
  }

  /** カスタム変数を削除する */
  remove(name: string): void {
    const current = this.host.getCustomVariables()
    this.host.setCustomVariables(current.filter((v) => v !== name))
  }
}
