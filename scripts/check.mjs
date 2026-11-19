import fs from "node:fs"
import path from "node:path"
import { site } from "../content/site.js"
import { isCalLinkReady, normalizeCalLink } from "../src/booking.js"
import { escapeHtml } from "../src/text.js"

const root = path.resolve(import.meta.dirname, "..")
const bannedName = ["mi", "ndly"].join("")
const bannedPattern = new RegExp(bannedName, "i")
const html = fs.readFileSync(path.join(root, "dist/index.html"), "utf8")
const failures = []

function assert(condition, message) {
  if (!condition) failures.push(message)
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.(html|css|js|mjs|svg|txt|md|yml|yaml)$/.test(entry.name)) files.push(full)
  }
  return files
}

assert(html.includes('lang="uk"'), "html lang is uk")
assert(html.includes("<h1"), "page has an h1")
assert(html.includes("Записатися на сесію"), "primary CTA is present")
assert(html.includes(escapeHtml(site.meta.description)), "meta description comes from content")
assert(html.includes('id="about"'), "about section")
assert(html.includes('id="help"'), "help section")
assert(html.includes('id="process"'), "process section")
assert(html.includes('id="pricing"'), "pricing section")
assert(html.includes('id="booking"'), "booking section")
assert(html.includes('id="faq"'), "faq section")
assert(html.includes('id="contacts"'), "contacts section")
assert(html.includes("darcya.jpg"), "portrait is referenced")
assert(html.includes(escapeHtml(site.photo.alt)), "portrait alt text")
assert(html.includes(escapeHtml(site.footer.confidentiality)), "confidentiality note")
assert(!html.includes(site.person.surname) || site.person.surname === "", "empty surname is not printed as a token")
assert(!/\bTODO\b/.test(html), "no TODO in the built page")
assert(!html.includes("PLACEHOLDER"), "cal placeholder is not shown")
assert(!/\bTBD\b/.test(html), "no TBD in the built page")
assert(!bannedPattern.test(html), "built page does not mention the source platform")

for (const group of site.help.groups) {
  assert(html.includes(escapeHtml(group.title)), `focus group ${group.title}`)
  for (const item of group.items) assert(html.includes(escapeHtml(item)), `focus item ${item}`)
}

for (const item of site.faq.items) {
  assert(html.includes(escapeHtml(item.question)), `faq ${item.question}`)
  assert(html.includes(escapeHtml(item.answer)), "faq answer is in the HTML")
}

for (const paragraph of site.about.paragraphs) {
  assert(html.includes(escapeHtml(paragraph)), "about paragraph is in the HTML")
}

assert(/2[\s\u00a0\u202f]?300/.test(html), "individual price")
assert(/2[\s\u00a0\u202f]?200/.test(html), "first couples price")
assert(/2[\s\u00a0\u202f]?600/.test(html), "couples price")
assert(html.includes("тривалість уточнюється"), "couples follow-up duration stays unconfirmed")

if (isCalLinkReady(site.booking.calLink)) {
  assert(html.includes("https://app.cal.com/embed/embed.js"), "official Cal embed script")
  assert(html.includes('Cal("inline"'), "Cal inline instruction")
  assert(html.includes(JSON.stringify(normalizeCalLink(site.booking.calLink))), "calLink from content")
  assert(html.includes('data-booking="cal"'), "booking mode is cal")
  assert(!html.includes('data-booking="fallback"'), "fallback is hidden when cal is ready")
} else {
  assert(!html.includes("app.cal.com/embed/embed.js"), "embed script stays out while calLink is a placeholder")
  assert(html.includes('data-booking="fallback"'), "booking fallback is shown")
  assert(html.includes(escapeHtml(site.booking.fallbackNotice)), "coming-soon notice")
  assert(html.includes("<form"), "request form")
}

assert(isCalLinkReady("PLACEHOLDER") === false, "PLACEHOLDER is not a live cal link")
assert(isCalLinkReady("https://cal.com/darcya/individual") === true, "full cal URL is accepted")
assert(normalizeCalLink("https://app.cal.com/darcya/individual/") === "darcya/individual", "cal URL is normalized")
assert(isCalLinkReady("rick/get-rick-rolled") === true, "public demo link shape is valid")

for (const file of walk(root)) {
  if (file.includes(`${path.sep}dist${path.sep}`)) continue
  const source = fs.readFileSync(file, "utf8")
  assert(!bannedPattern.test(source), `unexpected name in ${path.relative(root, file)}`)
}

const assets = walk(path.join(root, "dist"))
for (const file of assets) {
  if (!/\.(html|css|js|svg|txt)$/.test(file)) continue
  const source = fs.readFileSync(file, "utf8")
  assert(!bannedPattern.test(source), `unexpected name in ${path.relative(root, file)}`)
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed:\n- ${failures.join("\n- ")}\n`)
  process.exit(1)
}

console.log("Site checks passed.")
