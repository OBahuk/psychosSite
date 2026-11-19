const CAL_PLACEHOLDER =
  /placeholder|todo|tbd|your[-_\s]?name|your[-_\s]?user|example|xxx+|change[-_]?me|плейсхолдер|вставте/i

export function normalizeCalLink(value) {
  if (typeof value !== "string") return ""
  return value
    .trim()
    .replace(/^https?:\/\/(www\.|app\.)?cal\.com\//i, "")
    .replace(/[?#].*$/, "")
    .replace(/^\/+|\/+$/g, "")
}

export function isCalLinkReady(value) {
  const link = normalizeCalLink(value)
  if (!link || CAL_PLACEHOLDER.test(link)) return false
  return /^[A-Za-z0-9][A-Za-z0-9_-]*(?:\/[A-Za-z0-9][A-Za-z0-9_-]*)*$/.test(link)
}

const BRAND_COLOR = "#2A3B32"

export function calEmbedMarkup(calLink) {
  const link = normalizeCalLink(calLink)
  const color = BRAND_COLOR
  return `<!-- Cal inline embed code begins -->
<div class="cal-frame" style="width:100%;height:100%;overflow:scroll" id="my-cal-inline"></div>
<script type="text/javascript">
  (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
  Cal("init", {origin:"https://cal.com"});
  Cal("inline", {
    elementOrSelector:"#my-cal-inline",
    calLink: ${JSON.stringify(link)},
    layout: "month_view"
  });
  Cal("ui", {"styles":{"branding":{"brandColor":${JSON.stringify(color)}}},"hideEventTypeDetails":false,"layout":"month_view"});
</script>
<!-- Cal inline embed code ends -->`
}
