document.body.classList.remove("no-js")

const header = document.querySelector(".site-header")
const toggle = document.querySelector(".nav-toggle")
const nav = document.querySelector("[data-nav]")

function setMenu(open) {
  if (!toggle || !nav) return
  nav.classList.toggle("is-open", open)
  toggle.setAttribute("aria-expanded", String(open))
  const label = toggle.querySelector(".nav-toggle-label")
  if (label) label.textContent = open ? toggle.dataset.closeLabel : toggle.dataset.openLabel
}

toggle?.addEventListener("click", () => {
  setMenu(toggle.getAttribute("aria-expanded") !== "true")
})

nav?.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false)
})

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false)
})

document.addEventListener("click", (event) => {
  if (!nav || !toggle || toggle.getAttribute("aria-expanded") !== "true") return
  if (nav.contains(event.target) || toggle.contains(event.target)) return
  setMenu(false)
})

function onScroll() {
  header?.classList.toggle("is-stuck", window.scrollY > 4)
}

onScroll()
window.addEventListener("scroll", onScroll, { passive: true })

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]')
  if (!link) return
  const id = link.getAttribute("href").slice(1)
  const target = document.getElementById(id)
  if (!target) return
  target.setAttribute("tabindex", "-1")
  target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true })
  window.setTimeout(() => target.focus({ preventScroll: true }), 0)
})

const form = document.querySelector("[data-request-form]")

function fieldLines(currentForm) {
  const lines = []
  for (const field of currentForm.querySelectorAll("input, textarea, select")) {
    if (field.name === "company" || field.type === "hidden") continue
    if (field.type === "checkbox") {
      lines.push(`${field.closest("label")?.innerText.trim() || field.name}: ${field.checked ? "так" : "ні"}`)
      continue
    }
    const label = currentForm.querySelector(`label[for="${field.id}"]`)
    lines.push(`${label ? label.textContent.trim() : field.name}: ${field.value.trim()}`)
  }
  return lines.join("\n\n")
}

function setStatus(node, state, message) {
  if (!node) return
  node.dataset.state = state
  node.textContent = message
}

async function sendForm(currentForm) {
  if (!currentForm.reportValidity()) return
  const status = currentForm.querySelector("[data-form-status]")
  const button = currentForm.querySelector("[data-form-button]")
  const honeypot = currentForm.querySelector('[name="company"]')
  if (honeypot?.value) {
    setStatus(status, "ok", currentForm.dataset.successEndpoint || currentForm.dataset.successMailto || "")
    currentForm.reset()
    return
  }

  const mode = currentForm.dataset.mode
  if (mode === "unconfigured") {
    setStatus(status, "error", currentForm.dataset.unconfigured || "")
    return
  }

  button?.setAttribute("disabled", "disabled")
  setStatus(status, "pending", currentForm.dataset.sending || "")

  try {
    if (mode === "mailto") {
      const href = `mailto:${currentForm.dataset.email}?subject=${encodeURIComponent(currentForm.dataset.subject || "")}&body=${encodeURIComponent(fieldLines(currentForm))}`
      window.location.href = href
      setStatus(status, "ok", currentForm.dataset.successMailto || "")
      return
    }

    const response = await fetch(currentForm.dataset.endpoint, {
      method: "POST",
      body: new FormData(currentForm),
      headers: { Accept: "application/json" },
    })
    if (!response.ok) throw new Error(String(response.status))
    currentForm.reset()
    setStatus(status, "ok", currentForm.dataset.successEndpoint || "")
  } catch {
    setStatus(status, "error", currentForm.dataset.error || "")
  } finally {
    button?.removeAttribute("disabled")
  }
}

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault()
    sendForm(form)
  })
  form.querySelector("[data-form-button]")?.addEventListener("click", () => {
    if (form.dataset.mode === "unconfigured") sendForm(form)
  })
}
