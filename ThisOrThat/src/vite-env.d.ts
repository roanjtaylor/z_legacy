/// <reference types="vite/client" />

declare module '*.m4a' {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_CURATE_PASSWORD: string;
  readonly VITE_GOOGLE_API_KEY?: string;
  readonly VITE_GOOGLE_SEARCH_ENGINE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
