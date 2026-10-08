import { META_PIXEL_ID } from '../config';

// Cookie-samtykke + Meta Pixel. Pixel-scriptet hentes først, når den besøgende har
// sagt ja. Uden samtykke sendes intet til Meta, og track() gør ingenting.

type Consent = { marketing: 'granted' | 'denied'; ts: string };
type Params = Record<string, string | number>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    nsTrack?: (event: string, params?: Params) => void;
  }
}

const CONSENT_KEY = 'ns_cookie_consent';
const STANDARD_EVENTS = new Set(['PageView', 'ViewContent', 'Lead', 'Contact', 'Search']);

function getConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    return null;
  }
}

function saveConsent(marketing: Consent['marketing']) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ marketing, ts: new Date().toISOString() }));
  } catch {
    /* privat browsing - samtykket gælder så kun denne sidevisning */
  }
}

const hasConsent = () => getConsent()?.marketing === 'granted';

let pixelLoaded = false;

function loadPixel() {
  if (pixelLoaded || !META_PIXEL_ID) return;
  pixelLoaded = true;
  // Metas officielle loader-snippet
  const n: any = (window.fbq = function (...args: unknown[]) {
    n.callMethod ? n.callMethod(...args) : n.queue.push(args);
  });
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.queue = [];
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);

  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');
  trackPageContent();
}

export function track(event: string, params: Params = {}) {
  if (!pixelLoaded || !window.fbq) return;
  const data = { ...params, side: location.pathname };
  window.fbq(STANDARD_EVENTS.has(event) ? 'track' : 'trackCustom', event, data);
}
window.nsTrack = track;

/** ViewContent på produkt- og målgruppesider (markeret med data-track-view) */
function trackPageContent() {
  const el = document.querySelector<HTMLElement>('[data-track-view]');
  if (!el) return;
  track('ViewContent', {
    content_name: el.dataset.trackView ?? '',
    content_category: el.dataset.trackCategory ?? 'Side',
  });
}

/** Hvor på siden et klik skete - gør det muligt at se hvilke knapper der virker */
function placement(el: Element) {
  if (el.closest('.topbar')) return 'topbar';
  if (el.closest('header, .site-nav')) return 'menu';
  if (el.closest('footer')) return 'footer';
  if (el.closest('.hero')) return 'hero';
  if (el.closest('.cta-band')) return 'cta-band';
  return 'indhold';
}

function setupClickTracking() {
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest?.('a, button');
    if (!a || a.closest('#cookie-banner')) return;
    const href = a.getAttribute('href') ?? '';
    const label = (a.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
    const where = placement(a);

    if (href.startsWith('tel:')) {
      track('Contact', { metode: 'telefon', placering: where });
    } else if (href.startsWith('mailto:')) {
      track('Contact', { metode: 'email', placering: where });
    } else if (/^\/sortiment\/[^/]+\/?$/.test(href) && !a.matches('.btn, .cta')) {
      track('ProduktKlik', { produkt: href.split('/')[2], placering: where });
    } else if (a.matches('.btn, .cta')) {
      track('CTAKlik', { knap: label, destination: href || 'knap', placering: where });
    }
  });

  // Første gang nogen begynder at udfylde en formular (tragt: start -> Lead)
  const started = new Set<string>();
  document.addEventListener('focusin', (e) => {
    const form = (e.target as Element).closest?.('form.contact-form');
    if (!form || started.has(form.id)) return;
    started.add(form.id);
    track('FormularStartet', { formular: form.id });
  });
}

function setupBanner() {
  const banner = document.getElementById('cookie-banner');
  if (!banner || !META_PIXEL_ID) return;

  const show = () => (banner.hidden = false);
  const hide = () => (banner.hidden = true);

  banner.querySelector('[data-consent="accept"]')?.addEventListener('click', () => {
    saveConsent('granted');
    hide();
    loadPixel();
  });
  banner.querySelector('[data-consent="reject"]')?.addEventListener('click', () => {
    const wasGranted = hasConsent();
    saveConsent('denied');
    hide();
    if (wasGranted) {
      // Træk samtykke tilbage: slet Metas cookies og genindlæs uden pixel
      for (const c of ['_fbp', '_fbc']) {
        document.cookie = `${c}=; Max-Age=0; path=/; domain=.${location.hostname.replace(/^www\./, '')}`;
        document.cookie = `${c}=; Max-Age=0; path=/`;
      }
      location.reload();
    }
  });
  document.querySelectorAll('[data-cookie-settings]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.preventDefault();
      show();
    })
  );

  if (!getConsent()) setTimeout(show, 600);
}

setupBanner();
setupClickTracking();
if (hasConsent()) loadPixel();
