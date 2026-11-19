import { defineConfig } from "vite"
import fs from "node:fs"
import { renderPage } from "./src/render.js"

function normalizeBase(value) {
  let base = String(value || "/").trim()
  if (!base.startsWith("/")) base = `/${base}`
  if (!base.endsWith("/")) base = `${base}/`
  return base
}

async function loadFresh(relativePath) {
  const fileUrl = new URL(relativePath, import.meta.url)
  const mtime = fs.statSync(fileUrl).mtimeMs
  return import(`${fileUrl.href}?mtime=${mtime}`)
}

function contentPlugin(base) {
  return {
    name: "site-content",
    async transformIndexHtml(html) {
      const { site } = await loadFresh("./content/site.js")
      const page = renderPage(site, { base })
      return html
        .replace("<!--title-->", page.title)
        .replace("<!--head-->", page.head)
        .replace("<!--app-->", page.body)
    },
  }
}

const base = normalizeBase(process.env.BASE_PATH || "/")

export default defineConfig({
  base,
  plugins: [contentPlugin(base)],
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
})
