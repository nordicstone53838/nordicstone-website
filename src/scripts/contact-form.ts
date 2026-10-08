import { LEAD_EMAIL, LEAD_PHONE_DISPLAY, WEB3FORMS_ACCESS_KEY } from '../config';

type ContactFormOptions = {
  // Emnelinje i mailen, fx "Tilbudsforespørgsel fra Jens (privat)"
  subject: (data: FormData) => string;
  // Feltnavn -> label i mailen, i den rækkefølge felterne skal vises
  labels: Record<string, string>;
  successMessage: string;
};

const ENDPOINT = 'https://api.web3forms.com/submit';

function hasAccessKey() {
  return /^[0-9a-f-]{20,}$/i.test(WEB3FORMS_ACCESS_KEY);
}

function fieldValue(data: FormData, name: string) {
  return String(data.get(name) ?? '').trim();
}

export function setupContactForm(formId: string, options: ContactFormOptions) {
  const form = document.getElementById(formId) as HTMLFormElement | null;
  if (!form) return;

  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const status = form.querySelector<HTMLElement>('.form-status');
  const buttonText = button?.textContent ?? '';

  const showStatus = (kind: 'ok' | 'error', message: string) => {
    if (!status) return;
    status.textContent = message;
    status.className = `form-status ${kind}`;
    status.hidden = false;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const subject = options.subject(data);

    const fields: Record<string, string> = {};
    for (const [name, label] of Object.entries(options.labels)) {
      fields[label] = fieldValue(data, name);
    }

    // Reserveløsning indtil Web3Forms-nøglen er sat ind i src/config.ts
    if (!hasAccessKey()) {
      const body = Object.entries(fields)
        .map(([label, value]) => `${label}: ${value}`)
        .join('\n');
      window.location.href = `mailto:${LEAD_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = 'Sender...';
    }
    if (status) status.hidden = true;

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject,
          from_name: 'nordicstone.dk',
          // Web3Forms bruger "email" som svar-adresse, så Heine kan trykke Besvar
          email: fieldValue(data, 'email'),
          botcheck: data.get('botcheck') ? true : '',
          ...fields,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || `HTTP ${res.status}`);

      form.reset();
      showStatus('ok', options.successMessage);
    } catch (err) {
      console.error('Formular kunne ikke sendes:', err);
      showStatus(
        'error',
        `Beskeden kunne desværre ikke sendes. Ring på ${LEAD_PHONE_DISPLAY} eller skriv til ${LEAD_EMAIL}.`
      );
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = buttonText;
      }
    }
  });
}
