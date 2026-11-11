import {defineConfig} from 'vitest/config';

// The geographic generation and replay tests take 2-4 s alone and pass the 5 s default under a full parallel run.
export default defineConfig({test:{testTimeout:30_000}});
