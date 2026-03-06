/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  VITE_BASE_API_URL: string;
}

declare const __PACKAGE_INFO__: {
  version: string;
  name: string;
  description: string;
  author: string;
  license: string;
  homepage: string;
  repository: string;
};

declare const __COMMIT_INFO__: {
  hash: string;
  author: string;
  date: string;
  title: string;
  message: string;
  messageFull: string;
};
