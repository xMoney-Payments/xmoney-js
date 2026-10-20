/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_KEY: string;
  readonly VITE_API_KEY: string;
  readonly VITE_API_BASE: string;
  readonly VITE_CURRENCY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
