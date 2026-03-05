export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
      GEMINI_API_KEY: string;
      [key: string]: string | undefined;
    }
  }
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
