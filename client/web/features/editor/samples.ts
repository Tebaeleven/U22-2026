// 旧 import パス互換用のブリッジ
// 実体は ./samples/index に一本化し、strict v2 のサンプル定義を使う。

export type { SampleProject, SampleCategory } from "./samples/index"
export { SAMPLE_CATEGORIES, SAMPLE_PROJECTS, resolveSample } from "./samples/index"
