import enUi from '../../locales/en/ui.json';
import ruUi from '../../locales/ru/ui.json';
import ukUi from '../../locales/uk/ui.json';
import deUi from '../../locales/de/ui.json';
import esUi from '../../locales/es/ui.json';
import frUi from '../../locales/fr/ui.json';
import zhUi from '../../locales/zh/ui.json';
import jaUi from '../../locales/ja/ui.json';
import ptUi from '../../locales/pt/ui.json';
import plUi from '../../locales/pl/ui.json';

import enDiagrams from '../../locales/en/diagrams.json';
import ruDiagrams from '../../locales/ru/diagrams.json';
import ukDiagrams from '../../locales/uk/diagrams.json';
import deDiagrams from '../../locales/de/diagrams.json';
import esDiagrams from '../../locales/es/diagrams.json';
import frDiagrams from '../../locales/fr/diagrams.json';
import zhDiagrams from '../../locales/zh/diagrams.json';
import jaDiagrams from '../../locales/ja/diagrams.json';
import ptDiagrams from '../../locales/pt/diagrams.json';
import plDiagrams from '../../locales/pl/diagrams.json';

import enSyscalls from '../../locales/en/syscalls.json';
import ruSyscalls from '../../locales/ru/syscalls.json';
import ukSyscalls from '../../locales/uk/syscalls.json';
import deSyscalls from '../../locales/de/syscalls.json';
import esSyscalls from '../../locales/es/syscalls.json';
import frSyscalls from '../../locales/fr/syscalls.json';
import zhSyscalls from '../../locales/zh/syscalls.json';
import jaSyscalls from '../../locales/ja/syscalls.json';
import ptSyscalls from '../../locales/pt/syscalls.json';
import plSyscalls from '../../locales/pl/syscalls.json';

import enStructs from '../../locales/en/structs.json';
import ruStructs from '../../locales/ru/structs.json';
import ukStructs from '../../locales/uk/structs.json';
import deStructs from '../../locales/de/structs.json';
import esStructs from '../../locales/es/structs.json';
import frStructs from '../../locales/fr/structs.json';
import zhStructs from '../../locales/zh/structs.json';
import jaStructs from '../../locales/ja/structs.json';
import ptStructs from '../../locales/pt/structs.json';
import plStructs from '../../locales/pl/structs.json';

import { siteConfig } from '../../site.config';

const uiDictionaries: Record<string, any> = {
  en: enUi,
  ru: ruUi,
  uk: ukUi,
  de: deUi,
  es: esUi,
  fr: frUi,
  zh: zhUi,
  ja: jaUi,
  pt: ptUi,
  pl: plUi
};

const diagramDictionaries: Record<string, any> = {
  en: enDiagrams,
  ru: ruDiagrams,
  uk: ukDiagrams,
  de: deDiagrams,
  es: esDiagrams,
  fr: frDiagrams,
  zh: zhDiagrams,
  ja: jaDiagrams,
  pt: ptDiagrams,
  pl: plDiagrams
};

const syscallDictionaries: Record<string, any> = {
  en: enSyscalls,
  ru: ruSyscalls,
  uk: ukSyscalls,
  de: deSyscalls,
  es: esSyscalls,
  fr: frSyscalls,
  zh: zhSyscalls,
  ja: jaSyscalls,
  pt: ptSyscalls,
  pl: plSyscalls
};

const structDictionaries: Record<string, any> = {
  en: enStructs,
  ru: ruStructs,
  uk: ukStructs,
  de: deStructs,
  es: esStructs,
  fr: frStructs,
  zh: zhStructs,
  ja: jaStructs,
  pt: ptStructs,
  pl: plStructs
};

const diagramAliases: Record<string, string> = {
  vertical_platform_stack: 'global_stack',
  platform_stack: 'global_stack',
  scheduler_fsm: 'process_scheduler',
  spi_flashing: 'spi_flashing_pinout',
  wm_pipeline: 'window_manager'
};

export function getTranslation(lang: string, key: string): string {
  const dict = uiDictionaries[lang] || uiDictionaries[siteConfig.defaultLang] || uiDictionaries.en;
  const enDict = uiDictionaries.en;

  const parts = key.split('.');
  let val: any = dict;
  for (const p of parts) {
    if (val && typeof val === 'object') {
      val = val[p];
    } else {
      val = undefined;
      break;
    }
  }

  if (val !== undefined && typeof val === 'string') {
    return val;
  }

  // Fallback to EN
  let fallbackVal: any = enDict;
  for (const p of parts) {
    if (fallbackVal && typeof fallbackVal === 'object') {
      fallbackVal = fallbackVal[p];
    } else {
      fallbackVal = undefined;
      break;
    }
  }

  return (typeof fallbackVal === 'string') ? fallbackVal : key;
}

export function getDiagramData(lang: string, id: string) {
  const dict = diagramDictionaries[lang] || diagramDictionaries[siteConfig.defaultLang] || diagramDictionaries.en;
  const enDict = diagramDictionaries.en;

  const resolvedId = diagramAliases[id] || id;

  return dict[resolvedId] || dict[id] || enDict[resolvedId] || enDict[id] || {
    title: id,
    caption: '',
    labels: {}
  };
}

function resolveLang(lang: string): string {
  return (lang in syscallDictionaries) ? lang : siteConfig.defaultLang;
}

export function getSyscallLocale(lang: string, syscallName: string): { description: string; return: string; args: string[] } {
  const resolvedLang = resolveLang(lang);
  const dict = syscallDictionaries[resolvedLang] || syscallDictionaries.en;
  const enDict = syscallDictionaries.en;
  const entry = dict[syscallName] || enDict[syscallName] || {};
  const enEntry = enDict[syscallName] || {};
  return {
    description: entry.description ?? enEntry.description ?? '',
    return: entry.return ?? enEntry.return ?? '',
    args: Array.isArray(entry.args) ? entry.args : (Array.isArray(enEntry.args) ? enEntry.args : [])
  };
}

export function getStructLocale(lang: string, structId: string): { title: string; fields: Record<string, string> } {
  const resolvedLang = resolveLang(lang);
  const dict = structDictionaries[resolvedLang] || structDictionaries.en;
  const enDict = structDictionaries.en;
  const entry = dict[structId] || enDict[structId] || {};
  const enEntry = enDict[structId] || {};
  return {
    title: entry.title ?? enEntry.title ?? structId,
    fields: entry.fields ?? enEntry.fields ?? {}
  };
}
