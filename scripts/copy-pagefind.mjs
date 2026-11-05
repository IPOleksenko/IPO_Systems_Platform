import { cp, mkdir } from 'node:fs/promises';

await mkdir('public/pagefind', { recursive: true });
await cp('dist/pagefind', 'public/pagefind', { recursive: true, force: true });
