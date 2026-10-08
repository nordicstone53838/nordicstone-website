/**
 * Nordic Stone - mail-notifikation ved nye Facebook-leads.
 *
 * Bruges i det Google Sheet, som Metas lead ads-integration skriver i.
 * Scriptet holder øje med nye rækker, sender en mail pr. lead til
 * modtageren nedenfor og stempler rækken i kolonnen "Mail sendt",
 * så samme lead aldrig sendes to gange.
 *
 * Opsætning (én gang):
 *  1. Åbn arket -> Udvidelser -> Apps Script, og indsæt hele denne fil.
 *  2. Kør funktionen testEmail én gang og godkend tilladelserne.
 *  3. Kør funktionen installTriggers én gang.
 * Herefter kører det selv: både straks når Meta skriver i arket (onChange)
 * og som fallback hvert 5. minut.
 */

const CONFIG = {
  recipient: 'hje@nordicstone.dk',
  subjectPrefix: 'Nyt lead fra Facebook',
  statusColumnName: 'Mail sendt',
  // null = første faneblad. Sæt til fx 'Leads', hvis Meta skriver i et bestemt ark.
  sheetName: null,
};

// Kolonner fra Meta der ikke er interessante i mailen
const HIDDEN_COLUMNS = /^(id|form_id|ad_id|adset_id|campaign_id|is_organic|platform)$/i;

function processNewLeads() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30 * 1000)) return; // en anden kørsel er i gang

  try {
    const sheet = getLeadSheet_();
    if (!sheet || sheet.getLastRow() < 2) return;

    const statusCol = ensureStatusColumn_(sheet);
    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
    const rows = sheet
      .getRange(2, 1, sheet.getLastRow() - 1, lastCol)
      .getValues();

    rows.forEach((row, i) => {
      const rowNumber = i + 2;
      const alreadySent = row[statusCol - 1];
      const hasContent = row.some(
        (cell, c) => c !== statusCol - 1 && String(cell).trim() !== ''
      );
      if (alreadySent || !hasContent) return;

      sendLeadEmail_(headers, row, statusCol);
      sheet
        .getRange(rowNumber, statusCol)
        .setValue(Utilities.formatDate(new Date(), 'Europe/Copenhagen', 'dd-MM-yyyy HH:mm'));
    });
  } finally {
    lock.releaseLock();
  }
}

function sendLeadEmail_(headers, row, statusCol) {
  const fields = [];
  let leadName = '';

  headers.forEach((header, c) => {
    if (c === statusCol - 1) return;
    const value = String(row[c]).trim();
    if (!header || !value || HIDDEN_COLUMNS.test(header.trim())) return;

    const label = prettifyHeader_(header);
    fields.push(label + ': ' + value);
    if (!leadName && /full.?name|^navn$|^name$/i.test(header.trim())) {
      leadName = value;
    }
  });

  const subject = leadName
    ? CONFIG.subjectPrefix + ': ' + leadName
    : CONFIG.subjectPrefix;

  const body =
    'Der er kommet et nyt lead via Facebook-annoncerne:\n\n' +
    fields.join('\n') +
    '\n\nHusk: Ring hurtigst muligt - leads bliver kolde på få timer.\n\n' +
    'Alle leads ligger samlet i Google Sheet-arket:\n' +
    SpreadsheetApp.getActiveSpreadsheet().getUrl();

  MailApp.sendEmail({
    to: CONFIG.recipient,
    subject: subject,
    body: body,
  });
}

/** Oversæt Metas standard-kolonnenavne til pæne danske labels */
function prettifyHeader_(header) {
  const map = {
    created_time: 'Modtaget',
    full_name: 'Navn',
    first_name: 'Fornavn',
    last_name: 'Efternavn',
    phone_number: 'Telefon',
    email: 'Email',
    city: 'By',
    post_code: 'Postnummer',
    zip_code: 'Postnummer',
    street_address: 'Adresse',
    company_name: 'Firma',
    job_title: 'Titel',
  };
  const key = header.trim().toLowerCase();
  if (map[key]) return map[key];
  // Egne spørgsmål fra formularen vises som de er, blot uden underscores
  return header.replace(/_/g, ' ').trim();
}

function getLeadSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return CONFIG.sheetName ? ss.getSheetByName(CONFIG.sheetName) : ss.getSheets()[0];
}

/** Find "Mail sendt"-kolonnen, eller opret den yderst til højre. Returnerer 1-baseret kolonnenummer. */
function ensureStatusColumn_(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  const existing = headers.findIndex(
    (h) => h.trim().toLowerCase() === CONFIG.statusColumnName.toLowerCase()
  );
  if (existing !== -1) return existing + 1;

  const newCol = lastCol + 1;
  sheet.getRange(1, newCol).setValue(CONFIG.statusColumnName).setFontWeight('bold');
  return newCol;
}

/** Kør denne ÉN gang for at aktivere automatikken. */
function installTriggers() {
  // Ryd gamle triggers for dette script, så der aldrig ligger dubletter
  ScriptApp.getProjectTriggers().forEach((t) => {
    if (t.getHandlerFunction() === 'processNewLeads') ScriptApp.deleteTrigger(t);
  });

  // 1) Straks når Meta skriver en ny række i arket
  ScriptApp.newTrigger('processNewLeads')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onChange()
    .create();

  // 2) Fallback hvert 5. minut, hvis onChange skulle glippe
  ScriptApp.newTrigger('processNewLeads').timeBased().everyMinutes(5).create();

  const count = ScriptApp.getProjectTriggers().length;
  Logger.log('Færdig: ' + count + ' triggers er nu aktive (forventet: 2).');
}

/** Tjek hvilke triggers der er aktive - resultatet står i udførelsesloggen. */
function visTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  Logger.log('Antal aktive triggers: ' + triggers.length);
  triggers.forEach((t) => {
    Logger.log('- ' + t.getHandlerFunction() + ' (' + t.getEventType() + ')');
  });
  if (triggers.length === 0) {
    Logger.log('Ingen triggers fundet - kør installTriggers.');
  }
}

/** Kør denne først - godkender tilladelser og sender en testmail. */
function testEmail() {
  MailApp.sendEmail({
    to: CONFIG.recipient,
    subject: CONFIG.subjectPrefix + ' - test af opsætning',
    body:
      'Dette er en testmail fra lead-scriptet i Google Sheets.\n' +
      'Når du modtager denne, er scriptet klar - kør derefter installTriggers.',
  });
}
