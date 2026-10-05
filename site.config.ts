export interface ProjectMeta {
  id: string;
  name: string;
  taglineKey: string;
  descriptionKey: string;
  repoUrl: string;
  badge: string;
  icon: string;
  accentColor: string;
}

export interface SiteConfig {
  siteTitle: string;
  siteDescriptionKey: string;
  defaultLang: 'en';
  languages: Record<string, { name: string; dir: 'ltr' | 'rtl'; flag: string }>;
  base: string;
  author: {
    name: string;
    github: string;
    profileUrl: string;
  };
  projects: Record<string, ProjectMeta>;
}

export const siteConfig: SiteConfig = {
  siteTitle: 'IPO Systems Platform',
  siteDescriptionKey: 'site.description',
  defaultLang: 'en',
  languages: {
    en: { name: 'English', dir: 'ltr', flag: '🇬🇧' },
    ru: { name: 'Русский', dir: 'ltr', flag: '🇷🇺' },
    uk: { name: 'Українська', dir: 'ltr', flag: '🇺🇦' },
    de: { name: 'Deutsch', dir: 'ltr', flag: '🇩🇪' },
    es: { name: 'Español', dir: 'ltr', flag: '🇪🇸' },
    fr: { name: 'Français', dir: 'ltr', flag: '🇫🇷' },
    zh: { name: '简体中文', dir: 'ltr', flag: '🇨🇳' },
    ja: { name: '日本語', dir: 'ltr', flag: '🇯🇵' },
    pt: { name: 'Português', dir: 'ltr', flag: '🇵🇹' },
    pl: { name: 'Polski', dir: 'ltr', flag: '🇵🇱' },
  },
  base: process.env.BASE_URL || '/',
  author: {
    name: 'IPOleksenko',
    github: 'IPOleksenko',
    profileUrl: 'https://github.com/IPOleksenko'
  },
  projects: {
    ipo_os: {
      id: 'ipo_os',
      name: 'IPO_OS',
      taglineKey: 'projects.ipo_os.tagline',
      descriptionKey: 'projects.ipo_os.description',
      repoUrl: 'https://github.com/IPOleksenko/IPO_OS',
      badge: 'Operating System',
      icon: 'cpu',
      accentColor: '#3b82f6'
    },
    ipo_boot_rom: {
      id: 'ipo_boot_rom',
      name: 'IPO_Boot_ROM',
      taglineKey: 'projects.ipo_boot_rom.tagline',
      descriptionKey: 'projects.ipo_boot_rom.description',
      repoUrl: 'https://github.com/IPOleksenko/IPO_Boot_ROM',
      badge: 'Hardware Reset ROM',
      icon: 'zap',
      accentColor: '#10b981'
    },
    ipo_firmware: {
      id: 'ipo_firmware',
      name: 'IPO_Firmware',
      taglineKey: 'projects.ipo_firmware.tagline',
      descriptionKey: 'projects.ipo_firmware.description',
      repoUrl: 'https://github.com/IPOleksenko/IPO_Firmware',
      badge: 'BIOS Service Layer',
      icon: 'hard-drive',
      accentColor: '#8b5cf6'
    }
  }
};
