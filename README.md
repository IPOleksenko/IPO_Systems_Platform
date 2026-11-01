<div align="center">

# IPO Systems Platform

**Own x86 stack from reset vector to userspace: Boot ROM, firmware and operating system.**

### 🌐 [Open the documentation site](https://ipoleksenko.github.io/IPO_Systems_Platform/)

</div>

---

## 📖 About

This repository contains the documentation site for **IPO Systems Platform**,
a from-scratch software stack for x86 PCs:

- **IPO_Boot_ROM**: chipset and memory initialization
- **IPO_Firmware**: firmware services
- **IPO_OS**: kernel, IPO_FS file system, system calls and a runtime for custom programs

---

## 🛠️ Build and Development Commands

```bash
# Install dependencies
npm install

# Start local development server with hot-reload
npm run dev

# Build static production bundle and generate Pagefind search index
npm run build

# Preview production build locally
npm run preview
```

## 📥 Download Formats

The downloads page offers ZIP, TAR.GZ, TAR.BZ2, and TAR.XZ archives from a format
picker. IPO_Boot_ROM archives are available for standard 64 KB, 128 KB, 256 KB,
512 KB, 1 MB, 2 MB, 4 MB, 8 MB, 16 MB, 32 MB, 64 MB, and 128 MB flash sizes;
choose the image size and archive format before downloading.

---

## 📦 Deployment

The documentation site is automatically built and deployed to GitHub Pages
via GitHub Actions upon any push to `main` (`.github/workflows/deploy.yml`).

---

## 🧑‍💻 Authors

- [IPOleksenko](https://github.com/IPOleksenko) (owner): Developer and creator of the idea.

---

## 📜 License

This project is licensed under the [MIT License](./LICENSE).