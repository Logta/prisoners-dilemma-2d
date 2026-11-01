// Vitest 5 で Assertion の型引数が <R, T> に変わり、@testing-library/jest-dom 7 の
// `@testing-library/jest-dom/vitest` の型拡張（Assertion<T>）が効かなくなったため、
// Vitest 5 推奨の Matchers<R, T> への拡張で jest-dom のマッチャー型を登録する。
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import 'vitest';

declare module 'vitest' {
  interface Matchers<R extends void | Promise<void> = void | Promise<void>, T = unknown>
    extends TestingLibraryMatchers<unknown, R> {}
}
