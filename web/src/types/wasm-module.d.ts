declare module '*.js' {
  // biome-ignore lint/suspicious/noExplicitAny: WASM module types require any
  const content: any;
  // biome-ignore lint/style/noDefaultExport: WASM module requires default export
  export default content;
}

declare module '@/assets/pkg/prisoners_dilemma_2d.js' {
  export * from '@/assets/pkg/prisoners_dilemma_2d';
  const init: () => Promise<void>;
  // biome-ignore lint/style/noDefaultExport: WASM module requires default export
  export default init;
}
