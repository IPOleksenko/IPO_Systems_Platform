import { siteConfig } from '../../site.config';

/**
 * All translation dictionaries live in `locales/<lang>/<namespace>.json`.
 * They are discovered automatically, so adding a language only requires
 * creating its folder and registering it in `site.config.ts`.
 */
type Namespace = 'ui' | 'diagrams' | 'syscalls' | 'structs';
type Dictionary = Record<string, any>;

const localeModules = import.meta.glob<Dictionary>('../../locales/*/*.json', {
  eager: true,
  import: 'default'
});

const dictionaries: Record<string, Partial<Record<Namespace, Dictionary>>> = {};
for (const [path, data] of Object.entries(localeModules)) {
  const match = path.match(/locales\/([^/]+)\/([^/]+)\.json$/);
  if (!match) continue;
  const [, lang, ns] = match;
  (dictionaries[lang] ??= {})[ns as Namespace] = data;
}

const FALLBACK_LANG = 'en';

/** Returns a supported language code, falling back to the site default. */
export function resolveLang(lang: string | undefined): string {
  if (lang && lang in siteConfig.languages && lang in dictionaries) return lang;
  return siteConfig.defaultLang;
}

function getDict(lang: string, ns: Namespace): Dictionary {
  return dictionaries[resolveLang(lang)]?.[ns] ?? dictionaries[FALLBACK_LANG]?.[ns] ?? {};
}

function getFallbackDict(ns: Namespace): Dictionary {
  return dictionaries[FALLBACK_LANG]?.[ns] ?? {};
}

function lookup(dict: Dictionary, key: string): unknown {
  let val: any = dict;
  for (const p of key.split('.')) {
    if (val && typeof val === 'object') {
      val = val[p];
    } else {
      return undefined;
    }
  }
  return val;
}

const diagramAliases: Record<string, string> = {
  vertical_platform_stack: 'global_stack',
  platform_stack: 'global_stack',
  scheduler_fsm: 'process_scheduler',
  spi_flashing: 'spi_flashing_pinout',
  wm_pipeline: 'window_manager'
};

export function getTranslation(lang: string, key: string): string {
  const val = lookup(getDict(lang, 'ui'), key);
  if (typeof val === 'string') return val;

  const fallbackVal = lookup(getFallbackDict('ui'), key);
  return typeof fallbackVal === 'string' ? fallbackVal : key;
}

/** Like getTranslation, but returns `undefined` instead of the key when missing. */
export function getOptionalTranslation(lang: string, key: string): string | undefined {
  const val = lookup(getDict(lang, 'ui'), key);
  if (typeof val === 'string') return val;
  const fallbackVal = lookup(getFallbackDict('ui'), key);
  return typeof fallbackVal === 'string' ? fallbackVal : undefined;
}

export function getDiagramData(lang: string, id: string) {
  const dict = getDict(lang, 'diagrams');
  const enDict = getFallbackDict('diagrams');
  const resolvedId = diagramAliases[id] || id;

  return dict[resolvedId] || dict[id] || enDict[resolvedId] || enDict[id] || {
    title: id,
    caption: '',
    labels: {}
  };
}

export interface SyscallLocale {
  description: string;
  return: string;
  /** Optional localized argument descriptions; empty means "derive from signature". */
  args: string[];
}

export function getSyscallLocale(lang: string, syscallName: string): SyscallLocale {
  const entry = getDict(lang, 'syscalls')[syscallName] ?? {};
  const enEntry = getFallbackDict('syscalls')[syscallName] ?? {};
  return {
    description: entry.description ?? enEntry.description ?? '',
    return: entry.return ?? enEntry.return ?? '',
    args: Array.isArray(entry.args) ? entry.args : (Array.isArray(enEntry.args) ? enEntry.args : [])
  };
}

export interface StructLocale {
  title: string;
  totalSize?: string;
  fields: Record<string, string>;
}

export function getStructLocale(lang: string, structId: string): StructLocale {
  const entry = getDict(lang, 'structs')[structId] ?? {};
  const enEntry = getFallbackDict('structs')[structId] ?? {};
  return {
    title: entry.title ?? enEntry.title ?? structId,
    totalSize: entry.totalSize,
    // Merge per field so a partially translated struct still shows EN text for missing fields.
    fields: { ...(enEntry.fields ?? {}), ...(entry.fields ?? {}) }
  };
}

/**
 * Localizes a struct field size such as `4 bytes`, `1 byte`, `16 B / char*`
 * or `N × 48 B`, using plural rules of the target language.
 */
export function formatByteSize(lang: string, size: string): string {
  const resolved = resolveLang(lang);
  const plural = new Intl.PluralRules(resolved);
  const short = getTranslation(resolved, 'units.byte_short');
  return size
    .replace(/(\d+)\s*bytes?\b/g, (_m, n: string) => {
      const form = plural.select(Number(n));
      const word =
        getOptionalTranslation(resolved, `units.byte.${form}`) ??
        getTranslation(resolved, 'units.byte.other');
      return `${n} ${word}`;
    })
    .replace(/(\d+)\s*B\b/g, (_m, n: string) => `${n} ${short}`);
}

/**
 * Determines the page language for components rendered inside MDX content:
 * explicit prop → `[lang]` route param → first matching URL segment → default.
 */
export function detectLang(explicit: string | undefined, url: URL, params?: Record<string, string | undefined>): string {
  if (explicit && explicit in siteConfig.languages) return explicit;
  const fromParams = params?.lang;
  if (fromParams && fromParams in siteConfig.languages) return fromParams;
  const fromUrl = url.pathname.split('/').filter(Boolean).find((s) => s in siteConfig.languages);
  return fromUrl || siteConfig.defaultLang;
}
