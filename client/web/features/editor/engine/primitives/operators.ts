import type { BlockArgs, BlockUtil } from "../types"

/** ◯ + ◯ */
export function operator_add(args: BlockArgs, _util: BlockUtil): number {
  return (Number(args.NUM1) || 0) + (Number(args.NUM2) || 0)
}

/** ◯ - ◯ */
export function operator_subtract(args: BlockArgs, _util: BlockUtil): number {
  return (Number(args.NUM1) || 0) - (Number(args.NUM2) || 0)
}

/** ◯ * ◯ */
export function operator_multiply(args: BlockArgs, _util: BlockUtil): number {
  return (Number(args.NUM1) || 0) * (Number(args.NUM2) || 0)
}

/** ◯ / ◯ */
export function operator_divide(args: BlockArgs, _util: BlockUtil): number {
  const num2 = Number(args.NUM2) || 0
  if (num2 === 0) return 0
  return (Number(args.NUM1) || 0) / num2
}

/** _から_までの乱数 */
export function operator_random(args: BlockArgs, _util: BlockUtil): number {
  const from = Number(args.FROM) || 1
  const to = Number(args.TO) || 10
  const low = Math.min(from, to)
  const high = Math.max(from, to)
  if (Number.isInteger(low) && Number.isInteger(high)) {
    return Math.floor(Math.random() * (high - low + 1)) + low
  }
  return Math.random() * (high - low) + low
}

/** ◯ > ◯ */
export function operator_gt(args: BlockArgs, _util: BlockUtil): boolean {
  return (Number(args.OPERAND1) || 0) > (Number(args.OPERAND2) || 0)
}

/** ◯ < ◯ */
export function operator_lt(args: BlockArgs, _util: BlockUtil): boolean {
  return (Number(args.OPERAND1) || 0) < (Number(args.OPERAND2) || 0)
}

/** ◯ = ◯ */
export function operator_equals(args: BlockArgs, _util: BlockUtil): boolean {
  return String(args.OPERAND1) === String(args.OPERAND2)
}

/** _ かつ _ */
export function operator_and(args: BlockArgs, _util: BlockUtil): boolean {
  return Boolean(args.OPERAND1) && Boolean(args.OPERAND2)
}

/** _ または _ */
export function operator_or(args: BlockArgs, _util: BlockUtil): boolean {
  return Boolean(args.OPERAND1) || Boolean(args.OPERAND2)
}

/** _ではない */
export function operator_not(args: BlockArgs, _util: BlockUtil): boolean {
  return !Boolean(args.OPERAND)
}

/** _と_を結合 */
export function operator_join(args: BlockArgs, _util: BlockUtil): string {
  return String(args.STRING1 ?? "") + String(args.STRING2 ?? "")
}

/** _の長さ */
export function operator_length(args: BlockArgs, _util: BlockUtil): number {
  return String(args.STRING ?? "").length
}

/** _ % _ (余り) */
export function operator_mod(args: BlockArgs, _util: BlockUtil): number {
  const num2 = Number(args.NUM2) || 0
  if (num2 === 0) return 0
  return (Number(args.NUM1) || 0) % num2
}

/** 四捨五入 */
export function operator_round(args: BlockArgs, _util: BlockUtil): number {
  return Math.round(Number(args.NUM) || 0)
}

/** ◯ ≥ ◯ */
export function operator_gte(args: BlockArgs, _util: BlockUtil): boolean {
  return (Number(args.OPERAND1) || 0) >= (Number(args.OPERAND2) || 0)
}

/** ◯ ≤ ◯ */
export function operator_lte(args: BlockArgs, _util: BlockUtil): boolean {
  return (Number(args.OPERAND1) || 0) <= (Number(args.OPERAND2) || 0)
}

/** ◯ ≠ ◯ */
export function operator_neq(args: BlockArgs, _util: BlockUtil): boolean {
  return String(args.OPERAND1) !== String(args.OPERAND2)
}

/** _の_番目の文字 */
export function operator_letter_of(args: BlockArgs, _util: BlockUtil): string {
  const str = String(args.STRING ?? "")
  const index = Number(args.INDEX ?? 1) - 1
  if (index < 0 || index >= str.length) return ""
  return str[index]
}

/** _に_が含まれる */
export function operator_contains(args: BlockArgs, _util: BlockUtil): boolean {
  return String(args.STRING1 ?? "").includes(String(args.STRING2 ?? ""))
}

/** 部分文字列 */
export function operator_substring(args: BlockArgs, _util: BlockUtil): string {
  const str = String(args.STRING ?? "")
  const from = Math.max(0, Number(args.FROM ?? 1) - 1)
  const len = Number(args.LEN ?? 1)
  return str.substring(from, from + len)
}

/** 文字列分割 → リスト */
export function operator_split(args: BlockArgs, _util: BlockUtil): string[] {
  const str = String(args.STRING ?? "")
  const sep = String(args.SEP ?? ",")
  return str.split(sep)
}

/** 文字列置換 */
export function operator_replace(args: BlockArgs, _util: BlockUtil): string {
  const str = String(args.STRING ?? "")
  const from = String(args.FROM ?? "")
  const to = String(args.TO ?? "")
  return str.replaceAll(from, to)
}

/** 数値に変換 */
export function operator_tonum(args: BlockArgs, _util: BlockUtil): number {
  const val = Number(args.VALUE)
  return Number.isNaN(val) ? 0 : val
}

/** 文字列に変換 */
export function operator_tostr(args: BlockArgs, _util: BlockUtil): string {
  return String(args.VALUE ?? "")
}
