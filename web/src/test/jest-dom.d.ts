// vitest 5 で Assertion の型引数が <R, T> に変わり、@testing-library/jest-dom 7 同梱の
// vitest 向け型拡張（Assertion<T>）が効かなくなったため、vitest 5 推奨の Matchers を拡張する。
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  interface Matchers<R extends void | Promise<void> = void | Promise<void>, T = unknown>
    extends TestingLibraryMatchers<T, R> {}
}
