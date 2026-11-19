export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

const UNSET = /todo|tbd|placeholder|плейсхолдер|example\.com|change[-_ ]?me|your[-_ ]?(email|phone|name|user)|xxx+/i

export function isPublic(value) {
  if (value == null) return false
  const text = String(value).trim()
  if (!text) return false
  return !UNSET.test(text)
}

export function displayName(person) {
  const given = String(person?.givenName || "").trim()
  const surname = isPublic(person?.surname) ? String(person.surname).trim() : ""
  return [given, surname].filter(Boolean).join(" ")
}

export function formatUah(amount) {
  const number = Number(amount)
  if (!Number.isFinite(number)) return ""
  return `${new Intl.NumberFormat("uk-UA").format(number)}\u00a0грн`
}

export function joinBase(base, assetPath) {
  const prefix = base.endsWith("/") ? base : `${base}/`
  return `${prefix}${String(assetPath || "").replace(/^\/+/, "")}`
}

export function publicSiteUrl(url) {
  if (!isPublic(url)) return ""
  return String(url).trim().replace(/\/+$/, "")
}
