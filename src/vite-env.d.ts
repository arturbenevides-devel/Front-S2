/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_AUDIT_LOGS_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
