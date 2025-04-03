// Augment Next.js types to address the params issue in dynamic routes
import { NextPage } from 'next';

declare module 'next' {
  export type PageParams<T extends Record<string, string> = {}> = { params: T };
  
  export type NextPageWithParams<T extends Record<string, string> = {}> = 
    NextPage<PageParams<T>>;
}

// Patch for Next.js build type checking
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly NODE_ENV: 'development' | 'production' | 'test';
    }
  }
} 