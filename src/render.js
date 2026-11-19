import { calEmbedMarkup, isCalLinkReady, normalizeCalLink } from "./booking.js"
import { displayName, escapeHtml, formatUah, isPublic, joinBase, publicSiteUrl } from "./text.js"

function pageTitle(site) {
  return `${displayName(site.person)} — ${site.meta.titleSuffix}`
}

function contactItems(site) {
  const { contacts } = site
  const items = []
  if (isPublic(contacts.email)) {
    const email = contacts.email.trim()
    items.push({
      kind: "email",
      label: contacts.labels.email,
      text: email,
      href: `mailto:${email}`,
    })
  }
  if (isPublic(contacts.phone)) {
    const phone = contacts.phone.trim()
    items.push({
      kind: "phone",
      label: contacts.labels.phone,
      text: phone,
      href: `tel:${phone.replace(/[^\d+]/g, "")}`,
    })
  }
  if (isPublic(contacts.telegram)) {
    const raw = contacts.telegram.trim()
    const handle = raw.replace(/^@/, "")
    items.push({
      kind: "telegram",
      label: contacts.labels.telegram,
      text: raw,
      href: /^https?:/i.test(handle) ? handle : `https://t.me/${handle}`,
      external: true,
    })
  }
  if (isPublic(contacts.instagram)) {
    const raw = contacts.instagram.trim()
    const handle = raw.replace(/^@/, "")
    items.push({
      kind: "instagram",
      label: contacts.labels.instagram,
      text: raw,
      href: /^https?:/i.test(handle) ? handle : `https://instagram.com/${handle}`,
      external: true,
    })
  }
  return items
}

function renderContacts(items) {
  if (!items.length) return ""
  return `<ul class="contact-list">
    ${items
      .map((item) => {
        const external = item.external ? ` target="_blank" rel="noopener noreferrer"` : ""
        return `<li><a class="contact-link" href="${escapeHtml(item.href)}"${external}><span class="contact-kind">${escapeHtml(item.label)}</span><span>${escapeHtml(item.text)}</span></a></li>`
      })
      .join("")}
  </ul>`
}

function renderPriceLines(lines, unconfirmedLabel) {
  return `<ul class="price-lines">
    ${lines
      .map((line) => {
        const amount = Number.isFinite(Number(line.price)) ? formatUah(line.price) : "уточнюється"
        const badge = line.confirmed ? "" : `<span class="badge">${escapeHtml(unconfirmedLabel)}</span>`
        return `<li>
          <span class="price-label">${escapeHtml(line.label)}</span>
          <span class="price-row"><strong>${escapeHtml(amount)}</strong>${badge}</span>
        </li>`
      })
      .join("")}
  </ul>`
}

function renderForm(site, mode) {
  const booking = site.booking
  const fields = booking.fields
  const email = isPublic(booking.email) ? booking.email.trim() : ""
  const endpoint = isPublic(booking.formEndpoint) ? booking.formEndpoint.trim() : ""
  const action = mode === "endpoint" ? ` action="${escapeHtml(endpoint)}" method="post"` : mode === "mailto" ? ` action="mailto:${escapeHtml(email)}" method="post" enctype="text/plain"` : ""
  const privacy =
    mode === "endpoint" ? booking.privacyEndpoint : mode === "mailto" ? booking.privacyMailto : booking.privacyUnconfigured
  const buttonType = mode === "unconfigured" ? "button" : "submit"
  const options = fields.format.options
    .map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
    .join("")

  return `<form class="request-form" data-request-form data-mode="${mode}" data-email="${escapeHtml(email)}" data-endpoint="${escapeHtml(endpoint)}" data-subject="${escapeHtml(booking.subject)}" data-success-mailto="${escapeHtml(booking.successMailto)}" data-success-endpoint="${escapeHtml(booking.successEndpoint)}" data-error="${escapeHtml(booking.error)}" data-unconfigured="${escapeHtml(booking.unconfigured)}" data-sending="${escapeHtml(booking.sending)}"${action}>
    <div class="field">
      <label for="request-name">${escapeHtml(fields.name.label)}</label>
      <input id="request-name" name="name" type="text" required maxlength="80" autocomplete="${escapeHtml(fields.name.autocomplete)}" placeholder="${escapeHtml(fields.name.placeholder)}" />
    </div>
    <div class="field">
      <label for="request-contact">${escapeHtml(fields.contact.label)}</label>
      <input id="request-contact" name="contact" type="text" required maxlength="120" autocomplete="${escapeHtml(fields.contact.autocomplete)}" placeholder="${escapeHtml(fields.contact.placeholder)}" />
    </div>
    <div class="field">
      <label for="request-format">${escapeHtml(fields.format.label)}</label>
      <select id="request-format" name="format" required>
        <option value="">${escapeHtml(fields.format.placeholder)}</option>
        ${options}
      </select>
    </div>
    <div class="field">
      <label for="request-message">${escapeHtml(fields.message.label)}</label>
      <textarea id="request-message" name="message" maxlength="1000" rows="5" placeholder="${escapeHtml(fields.message.placeholder)}"></textarea>
    </div>
    <label class="consent">
      <input name="consent" type="checkbox" required />
      <span>${escapeHtml(booking.consent)}</span>
    </label>
    <p class="hp">
      <label>${escapeHtml(booking.honeypot)} <input name="company" type="text" tabindex="-1" autocomplete="off" /></label>
    </p>
    <button class="button" type="${buttonType}" data-form-button>${escapeHtml(booking.submit)}</button>
    <p class="form-status" data-form-status role="status" aria-live="polite"></p>
    <p class="form-privacy">${escapeHtml(privacy)}</p>
  </form>`
}

function renderBooking(site, contacts) {
  const booking = site.booking
  if (isCalLinkReady(booking.calLink)) {
    return `<p class="lede">${escapeHtml(booking.calendarIntro)}</p>
      <div class="cal-shell" data-booking="cal" data-cal-link="${escapeHtml(normalizeCalLink(booking.calLink))}" aria-label="${escapeHtml(site.a11y.bookingFrame)}">
        ${calEmbedMarkup(booking.calLink)}
      </div>`
  }

  const email = isPublic(booking.email)
  const endpoint = isPublic(booking.formEndpoint)
  const mode = endpoint ? "endpoint" : email ? "mailto" : "unconfigured"
  const direct = contacts.length
    ? `<div class="booking-direct"><h3>${escapeHtml(booking.directHeading)}</h3>${renderContacts(contacts)}</div>`
    : ""

  return `<div class="booking-fallback" data-booking="fallback">
    <p class="notice">${escapeHtml(booking.fallbackNotice)}</p>
    ${renderForm(site, mode)}
    ${direct}
  </div>`
}

function jsonLd(site, photoUrl) {
  const name = displayName(site.person)
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    givenName: site.person.givenName,
    jobTitle: site.person.role,
    description: site.meta.description,
    knowsLanguage: ["uk", "ru"],
    memberOf: {
      "@type": "Organization",
      name: site.about.association,
    },
  }
  if (isPublic(site.person.surname)) data.familyName = site.person.surname.trim()
  const url = publicSiteUrl(site.meta.siteUrl)
  if (url) data.url = url
  if (photoUrl) data.image = photoUrl
  if (isPublic(site.contacts.email)) data.email = site.contacts.email.trim()
  if (isPublic(site.contacts.phone)) data.telephone = site.contacts.phone.trim()
  const sameAs = contactItems(site)
    .filter((item) => item.external)
    .map((item) => item.href)
  if (sameAs.length) data.sameAs = sameAs
  return JSON.stringify(data).replaceAll("<", "\\u003c")
}

function absoluteAsset(siteUrl, assetPath) {
  if (!siteUrl) return ""
  return `${siteUrl}${assetPath.startsWith("/") ? "" : "/"}${assetPath}`
}

export function renderPage(site, { base = "/" } = {}) {
  const title = escapeHtml(pageTitle(site))
  const name = displayName(site.person)
  const photoSrc = joinBase(base, site.photo.src)
  const favicon = joinBase(base, "favicon.svg")
  const url = publicSiteUrl(site.meta.siteUrl)
  const image = absoluteAsset(url, photoSrc)
  const contacts = contactItems(site)
  const location = isPublic(site.practice.location) ? site.practice.location.trim() : ""
  const facts = location
    ? [...site.about.facts, { label: site.practice.locationLabel, value: location }]
    : site.about.facts

  const head = [
    `<meta name="description" content="${escapeHtml(site.meta.description)}" />`,
    `<meta name="theme-color" content="${escapeHtml(site.meta.themeColor)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta name="format-detection" content="telephone=no" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:locale" content="uk_UA" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${escapeHtml(site.meta.description)}" />`,
    `<meta property="profile:first_name" content="${escapeHtml(site.person.givenName)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${escapeHtml(site.meta.description)}" />`,
    `<link rel="icon" href="${escapeHtml(favicon)}" type="image/svg+xml" />`,
    `<link rel="preload" as="image" href="${escapeHtml(photoSrc)}" />`,
    isPublic(site.person.surname)
      ? `<meta property="profile:last_name" content="${escapeHtml(site.person.surname.trim())}" />`
      : "",
    url ? `<link rel="canonical" href="${escapeHtml(url)}/" />` : "",
    url ? `<meta property="og:url" content="${escapeHtml(url)}/" />` : "",
    image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : "",
    image ? `<meta property="og:image:alt" content="${escapeHtml(site.photo.alt)}" />` : "",
    image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : "",
    `<script type="application/ld+json">${jsonLd(site, image)}</script>`,
  ]
    .filter(Boolean)
    .join("\n    ")

  const nav = site.nav
    .map((item) => `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`)
    .join("")

  const highlights = site.hero.highlights
    .map((item) => `<li><strong>${escapeHtml(item.value)}</strong><span>${escapeHtml(item.label)}</span></li>`)
    .join("")

  const paragraphs = site.about.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")

  const approaches = site.about.approaches
    .map((item) => `<li><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.text)}</span></li>`)
    .join("")

  const education = site.about.education
    .map(
      (item) => `<li>
        <p class="edu-years">${escapeHtml(item.years)}</p>
        <p class="edu-title">${escapeHtml(item.title)}</p>
        <p class="edu-detail">${escapeHtml(item.detail)}</p>
      </li>`,
    )
    .join("")

  const factList = facts
    .map((fact) => `<div><dt>${escapeHtml(fact.label)}</dt><dd>${escapeHtml(fact.value)}</dd></div>`)
    .join("")

  const groups = site.help.groups
    .map(
      (group) => `<article class="group-card">
        <h3>${escapeHtml(group.title)}</h3>
        <p>${escapeHtml(group.text)}</p>
        <ul class="chips">${group.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </article>`,
    )
    .join("")

  const steps = site.process.steps
    .map(
      (step, index) => `<li>
        <span class="step-index" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
        <div>
          <h3>${escapeHtml(step.title)}</h3>
          <p>${escapeHtml(step.text)}</p>
        </div>
      </li>`,
    )
    .join("")

  const quotes = site.process.quotes.map((quote) => `<p>${escapeHtml(quote)}</p>`).join("")

  const formats = site.pricing.formats
    .map(
      (format) => `<article class="price-card" id="${escapeHtml(format.id)}">
        <p class="eyebrow">${escapeHtml(format.approach)}</p>
        <h3>${escapeHtml(format.title)}</h3>
        <p>${escapeHtml(format.description)}</p>
        ${renderPriceLines(format.lines, site.pricing.unconfirmedLabel)}
      </article>`,
    )
    .join("")

  const faq = site.faq.items
    .map(
      (item) => `<details>
        <summary>${escapeHtml(item.question)}</summary>
        <p>${escapeHtml(item.answer)}</p>
      </details>`,
    )
    .join("")

  const contactBlock = contacts.length
    ? renderContacts(contacts)
    : `<p class="empty-note">${escapeHtml(site.contacts.emptyMessage)}</p>`

  const year = new Date().getFullYear()

  const body = `<a class="skip" href="#main">${escapeHtml(site.a11y.skip)}</a>
    <header class="site-header">
      <div class="header-bar container">
        <a class="brand" href="#top">
          <span class="brand-mark" aria-hidden="true">${escapeHtml(site.person.givenName.slice(0, 1))}</span>
          <span>${escapeHtml(site.person.givenName)}</span>
        </a>
        <nav id="site-nav" class="site-nav" aria-label="${escapeHtml(site.a11y.nav)}" data-nav>
          <ul>${nav}</ul>
        </nav>
        <a class="button button-small header-cta" href="${escapeHtml(site.cta.href)}">
          <span class="cta-full">${escapeHtml(site.cta.label)}</span>
          <span class="cta-short">${escapeHtml(site.cta.shortLabel)}</span>
        </a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" data-open-label="${escapeHtml(site.a11y.menuOpen)}" data-close-label="${escapeHtml(site.a11y.menuClose)}">
          <span class="nav-toggle-bars" aria-hidden="true"></span>
          <span class="nav-toggle-label">${escapeHtml(site.a11y.menuOpen)}</span>
        </button>
      </div>
    </header>
    <main id="main">
      <section class="hero" id="top" aria-labelledby="hero-title">
        <div class="container hero-grid">
          <div class="hero-copy">
            <h1 id="hero-title">
              <span class="role">${escapeHtml(site.person.role)}</span>
              <span class="name">${escapeHtml(name)}</span>
            </h1>
            <p class="tagline">${escapeHtml(site.hero.tagline)}</p>
            <p class="lede">${escapeHtml(site.hero.lede)}</p>
            <div class="hero-actions">
              <a class="button" href="${escapeHtml(site.cta.href)}">${escapeHtml(site.cta.label)}</a>
              <a class="button button-secondary" href="${escapeHtml(site.hero.secondary.href)}">${escapeHtml(site.hero.secondary.label)}</a>
            </div>
            <ul class="highlights">${highlights}</ul>
          </div>
          <figure class="portrait">
            <div class="portrait-frame" aria-hidden="true"></div>
            <img src="${escapeHtml(photoSrc)}" width="${site.photo.width}" height="${site.photo.height}" alt="${escapeHtml(site.photo.alt)}" fetchpriority="high" />
          </figure>
        </div>
      </section>

      <section class="section" id="about" aria-labelledby="about-title">
        <div class="container about-layout">
          <div class="about-main">
            <div class="about-heading">
              <img class="avatar" src="${escapeHtml(photoSrc)}" width="72" height="72" alt="" />
              <p class="eyebrow">${escapeHtml(site.about.eyebrow)}</p>
              <h2 id="about-title">${escapeHtml(site.about.title)}</h2>
            </div>
            <div class="prose">${paragraphs}</div>
            <ul class="approaches">${approaches}</ul>
          </div>
          <aside class="about-side" aria-labelledby="education-title">
            <h3 id="education-title">${escapeHtml(site.about.educationTitle)}</h3>
            <ul class="edu-list">${education}</ul>
            <p class="membership">${escapeHtml(site.about.membership)}</p>
            <dl class="facts">${factList}</dl>
          </aside>
        </div>
      </section>

      <section class="section section-alt" id="help" aria-labelledby="help-title">
        <div class="container">
          <header class="section-intro">
            <p class="eyebrow">${escapeHtml(site.help.eyebrow)}</p>
            <h2 id="help-title">${escapeHtml(site.help.title)}</h2>
            <p class="lede">${escapeHtml(site.help.lede)}</p>
          </header>
          <div class="group-grid">${groups}</div>
        </div>
      </section>

      <section class="section" id="process" aria-labelledby="process-title">
        <div class="container process-layout">
          <div>
            <header class="section-intro">
              <p class="eyebrow">${escapeHtml(site.process.eyebrow)}</p>
              <h2 id="process-title">${escapeHtml(site.process.title)}</h2>
              <p class="lede">${escapeHtml(site.process.lede)}</p>
            </header>
            <ol class="steps">${steps}</ol>
          </div>
          <blockquote>${quotes}</blockquote>
        </div>
      </section>

      <section class="section section-alt" id="pricing" aria-labelledby="pricing-title">
        <div class="container">
          <header class="section-intro">
            <p class="eyebrow">${escapeHtml(site.pricing.eyebrow)}</p>
            <h2 id="pricing-title">${escapeHtml(site.pricing.title)}</h2>
            <p class="lede">${escapeHtml(site.pricing.lede)}</p>
          </header>
          <div class="price-grid">${formats}</div>
          ${site.pricing.disclaimer ? `<p class="disclaimer">${escapeHtml(site.pricing.disclaimer)}</p>` : ""}
          <p class="section-cta"><a class="button" href="${escapeHtml(site.cta.href)}">${escapeHtml(site.pricing.cta)}</a></p>
        </div>
      </section>

      <section class="section" id="booking" aria-labelledby="booking-title">
        <div class="container">
          <header class="section-intro">
            <p class="eyebrow">${escapeHtml(site.booking.eyebrow)}</p>
            <h2 id="booking-title">${escapeHtml(site.booking.title)}</h2>
          </header>
          ${renderBooking(site, contacts)}
        </div>
      </section>

      <section class="section section-alt" id="faq" aria-labelledby="faq-title">
        <div class="container faq-layout">
          <header class="section-intro">
            <p class="eyebrow">${escapeHtml(site.faq.eyebrow)}</p>
            <h2 id="faq-title">${escapeHtml(site.faq.title)}</h2>
            <p class="lede">${escapeHtml(site.faq.lede)}</p>
          </header>
          <div class="faq-list">${faq}</div>
        </div>
      </section>

      <section class="section" id="contacts" aria-labelledby="contacts-title">
        <div class="container contacts-layout">
          <header class="section-intro">
            <p class="eyebrow">${escapeHtml(site.contacts.eyebrow)}</p>
            <h2 id="contacts-title">${escapeHtml(site.contacts.title)}</h2>
            <p class="lede">${escapeHtml(site.contacts.lede)}</p>
          </header>
          ${contactBlock}
        </div>
      </section>
    </main>
    <footer class="site-footer">
      <div class="container footer-grid">
        <div>
          <p class="footer-name">${escapeHtml(name)}</p>
          <p class="footer-role">${escapeHtml(site.person.role)}</p>
        </div>
        <div class="confidentiality">
          <p class="footer-kicker">${escapeHtml(site.footer.confidentialityTitle)}</p>
          <p>${escapeHtml(site.footer.confidentiality)}</p>
          <p class="emergency">${escapeHtml(site.footer.emergency)}</p>
        </div>
      </div>
      <div class="container footer-bottom">
        <p>© ${year} ${escapeHtml(name)}. ${escapeHtml(site.footer.rights)}</p>
      </div>
    </footer>`

  return { title, head, body }
}
