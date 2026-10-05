# Contributing to IPO Systems Platform Documentation

Thank you for helping improve the documentation for IPO_OS, IPO_Boot_ROM, and IPO_Firmware!

---

## 🌍 Adding a New Language Translation

The documentation site is architected to make adding new languages seamless without altering page templates or build code.

### Step 1: Create Language Dictionaries
1. Create a new directory in `locales/`:
   ```bash
   mkdir -p locales/<lang_code>
   ```
   *(e.g., `locales/uk/` for Ukrainian, `locales/de/` for German).*
2. Copy the English base dictionaries:
   ```bash
   cp locales/en/ui.json locales/<lang_code>/ui.json
   cp locales/en/diagrams.json locales/<lang_code>/diagrams.json
   ```
3. Translate the values (do **not** modify keys, hex numbers, or technical identifiers).

### Step 2: Register Language in Configuration
In `site.config.ts`, add or update your language entry under `languages`:
```typescript
languages: {
  // ...
  uk: { name: 'Українська', dir: 'ltr', flag: '🇺🇦' },
  // ...
}
```

### Step 3: Translate Prose Pages
To translate a page, duplicate the English version:
```bash
cp src/content/docs/ipo-os/overview.en.mdx src/content/docs/ipo-os/overview.<lang_code>.mdx
```
Translate the explanatory text. Keep all `<SharedCode>`, `<SharedStruct>`, and `<LocalizedDiagram>` component tags intact.

> [!NOTE]
> You do not need to translate all pages at once! Any untranslated page will automatically display the English version with a translation notice banner.

### Step 4: Validate Localization Completeness
Run the automated check script:
```bash
npm run check-i18n
```
The script will report your language's translation coverage percentage and point out any missing keys.

### Step 5: Test Build Locally
```bash
npm run build
npm run preview
```

### Step 6: Submit a Pull Request
Commit your changes and open a Pull Request to `main`. CI will automatically run verification tests.
