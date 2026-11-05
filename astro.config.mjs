import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { siteConfig } from './site.config.ts';

export default defineConfig({
  site: 'https://ipoleksenko.github.io',
  base: siteConfig.base,
  integrations: [mdx()],
  vite: {
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp'
      }
    },
    preview: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp'
      }
    }
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      langs: [
        'c',
        'cpp',
        'asm',
        'bash',
        'shell',
        'json',
        'yaml',
        'makefile',
        'diff',
        'python',
        'html',
        'css',
        'javascript',
        'typescript'
      ],
      wrap: true
    }
  }
});
