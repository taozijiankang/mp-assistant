/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_BASE_API_URL: string;
}

declare const __COMMIT_INFO__: {
  hash: string;
  author: string;
  date: string;
  title: string;
  message: string;
  messageFull: string;
};
