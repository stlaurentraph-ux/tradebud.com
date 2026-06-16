#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const en = JSON.parse(fs.readFileSync(path.join(root, 'locales/en.json'), 'utf8'));
const dePath = path.join(root, 'locales/overlays/de.json');
const swPath = path.join(root, 'locales/overlays/sw.json');
const de = JSON.parse(fs.readFileSync(dePath, 'utf8'));
const sw = JSON.parse(fs.readFileSync(swPath, 'utf8'));

const PREFIXES = [
  'workflow.issues.',
  'workflow.inbox.',
  'workflow.outreach.',
  'workflow.field_ops.',
  'workflow.sla.',
  'workflow.integrations.',
  'workflow.role_decisions.',
  'workflow.help.',
  'workflow.compliance_health.',
  'workflow.admin.',
  'workflow.producers.',
  'workflow.organisations.',
  'workflow.reports.',
  'workflow.contacts.',
  'workflow.role_decisions.role_description.',
  'workflow.async.issues.',
];

const DE_PHRASES = [
  ['Compliance Issues', 'Compliance-Vorgänge'],
  ['Workflow Exception', 'Workflow-Ausnahme'],
  ['Cooperative Issue', 'Genossenschafts-Vorgang'],
  ['Compliance Issue', 'Compliance-Vorgang'],
  ['New Exception', 'Neue Ausnahme'],
  ['New Cooperative Issue', 'Neuer Genossenschafts-Vorgang'],
  ['New Issue', 'Neuer Vorgang'],
  ['Create Workflow Exception', 'Workflow-Ausnahme erstellen'],
  ['Create Cooperative Issue', 'Genossenschafts-Vorgang erstellen'],
  ['Create Compliance Issue', 'Compliance-Vorgang erstellen'],
  ['Inbound Requests', 'Eingehende Anfragen'],
  ['Incoming Requests', 'Eingehende Anfragen'],
  ['Outbound Campaigns', 'Ausgehende Kampagnen'],
  ['Outgoing Requests', 'Ausgehende Anfragen'],
  ['New Campaign', 'Neue Kampagne'],
  ['New Request', 'Neue Anfrage'],
  ['View timeline', 'Zeitachse anzeigen'],
  ['Request Extension', 'Verlängerung anfordern'],
  ['Manual Escalate', 'Manuell eskalieren'],
  ['Submit Request', 'Anfrage senden'],
  ['All Severities', 'Alle Schweregrade'],
  ['All Statuses', 'Alle Status'],
  ['All ownership', 'Alle Zuständigkeiten'],
  ['Owned by your org', 'Im eigenen Workspace'],
  ['Upstream blockers', 'Upstream-Blocker'],
  ['Campaign follow-up', 'Kampagnen-Nachverfolgung'],
  ['Inbox actions', 'Posteingangs-Aktionen'],
  ['In Progress', 'In Bearbeitung'],
  ['Blocking', 'Blockierend'],
  ['Warning', 'Warnung'],
  ['Resolved', 'Gelöst'],
  ['Closed', 'Geschlossen'],
  ['Open remediation', 'Sanierung öffnen'],
  ['Request upstream remediation', 'Upstream-Sanierung anfordern'],
  ['Mark in progress', 'Als in Bearbeitung markieren'],
  ['Mark resolved', 'Als gelöst markieren'],
  ['Remediation owner:', 'Sanierungsverantwortlicher:'],
  ['Loading issues...', 'Vorgänge werden geladen…'],
  ['Search issues...', 'Vorgänge suchen…'],
  ['Filter by severity', 'Nach Schweregrad filtern'],
  ['Filter by status', 'Nach Status filtern'],
  ['Filter by ownership', 'Nach Zuständigkeit filtern'],
  ['No open issues', 'Keine offenen Vorgänge'],
  ['No in progress issues', 'Keine Vorgänge in Bearbeitung'],
  ['No resolved issues', 'Keine gelösten Vorgänge'],
  ['Back to issues', 'Zurück zu Vorgängen'],
  ['Loading issue...', 'Vorgang wird geladen…'],
  ['Failed to load issue', 'Vorgang konnte nicht geladen werden'],
  ['Issue not found', 'Vorgang nicht gefunden'],
  ['Run Queue', 'Ausführungs-Warteschlange'],
  ['Scheduler', 'Zeitplaner'],
  ['Completed', 'Abgeschlossen'],
  ['Pending', 'Ausstehend'],
  ['Fulfilled', 'Erfüllt'],
  ['Draft', 'Entwurf'],
  ['Sent', 'Gesendet'],
  ['Archived', 'Archiviert'],
  ['Counterpart Name', 'Gegenpart-Name'],
  ['Campaign ID', 'Kampagnen-ID'],
  ['Request ID', 'Anfrage-ID'],
  ['Inbound ID', 'Eingangs-ID'],
  ['Actions', 'Aktionen'],
  ['Responses', 'Antworten'],
  ['Commodity', 'Ware'],
  ['accepted', 'akzeptiert'],
  ['pending', 'ausstehend'],
  ['recipients', 'Empfänger'],
  ['recipient', 'Empfänger'],
  ['Issues', 'Vorgänge'],
  ['Issue', 'Vorgang'],
  ['Shipment', 'Sendung'],
  ['Package', 'Paket'],
  ['Plot', 'Parzelle'],
  ['Batch', 'Charge'],
  ['Member', 'Mitglied'],
  ['Farmer', 'Landwirt'],
  ['Description', 'Beschreibung'],
  ['Severity', 'Schweregrad'],
  ['Status', 'Status'],
  ['Title', 'Titel'],
  ['Cancel', 'Abbrechen'],
  ['Fulfill', 'Erfüllen'],
  ['From', 'Von'],
  ['Due', 'Fällig'],
  ['Type', 'Typ'],
  ['Date', 'Datum'],
  ['Kanban', 'Kanban'],
  ['List', 'Liste'],
  ['Info', 'Info'],
  ['Unassigned', 'Nicht zugewiesen'],
  ['Cooperative', 'Genossenschaft'],
  ['Exporter', 'Exporteur'],
  ['Importer', 'Importeur'],
  ['System', 'System'],
  ['Overdue', 'Überfällig'],
  ['Due today', 'Heute fällig'],
  ['Due ', 'Fällig '],
];

const SW_PHRASES = [
  ['Compliance Issues', 'Masuala ya utimilifu'],
  ['Compliance Issue', 'Suala la utimilifu'],
  ['New Issue', 'Suala jipya'],
  ['Inbound Requests', 'Maombi ya ndani'],
  ['Incoming Requests', 'Maombi yanayoingia'],
  ['Outbound Campaigns', 'Kampeni za nje'],
  ['Outgoing Requests', 'Maombi ya nje'],
  ['New Campaign', 'Kampeni mpya'],
  ['New Request', 'Ombi jipya'],
  ['View timeline', 'Angalia ratiba'],
  ['All Severities', 'Ukali wote'],
  ['All Statuses', 'Hali zote'],
  ['In Progress', 'Inaendelea'],
  ['Blocking', 'Inazuia'],
  ['Warning', 'Onyo'],
  ['Resolved', 'Imetatuliwa'],
  ['Closed', 'Imefungwa'],
  ['Open remediation', 'Fungua urekebishaji'],
  ['Search issues...', 'Tafuta masuala...'],
  ['Loading issues...', 'Inapakia masuala...'],
  ['Back to issues', 'Rudi kwenye masuala'],
  ['Loading issue...', 'Inapakia suala...'],
  ['Failed to load issue', 'Imeshindwa kupakia suala'],
  ['Issue not found', 'Suala halijapatikana'],
  ['Run Queue', 'Foleni ya utekelezaji'],
  ['Scheduler', 'Ratiba'],
  ['Completed', 'Imekamilika'],
  ['Pending', 'Inasubiri'],
  ['Fulfilled', 'Imetimizwa'],
  ['Draft', 'Rasimu'],
  ['Sent', 'Imetumwa'],
  ['Archived', 'Imehifadhiwa'],
  ['Issues', 'Masuala'],
  ['Issue', 'Suala'],
  ['Shipment', 'Usafirishaji'],
  ['Package', 'Kifurushi'],
  ['Plot', 'Kiwanja'],
  ['Member', 'Mwanachama'],
  ['Farmer', 'Mkulima'],
  ['Description', 'Maelezo'],
  ['Cancel', 'Ghairi'],
  ['Fulfill', 'Timiza'],
  ['From', 'Kutoka'],
  ['Due', 'Tarehe'],
  ['Kanban', 'Kanban'],
  ['List', 'Orodha'],
  ['Overdue', 'Imechelewa'],
];

function translate(text, phrases) {
  let out = text;
  for (const [from, to] of phrases) {
    out = out.split(from).join(to);
  }
  return out;
}

function mergeMissing(target, phrases) {
  let added = 0;
  for (const key of Object.keys(en).sort()) {
    if (!PREFIXES.some((prefix) => key.startsWith(prefix))) continue;
    if (target[key]) continue;
    target[key] = translate(en[key], phrases);
    added += 1;
  }
  return added;
}

const addedDe = mergeMissing(de, DE_PHRASES);
const addedSw = mergeMissing(sw, SW_PHRASES);

const sortKeys = (obj) =>
  Object.fromEntries(Object.keys(obj).sort((a, b) => a.localeCompare(b)).map((k) => [k, obj[k]]));

fs.writeFileSync(dePath, `${JSON.stringify(sortKeys(de), null, 2)}\n`);
fs.writeFileSync(swPath, `${JSON.stringify(sortKeys(sw), null, 2)}\n`);

console.log(`Added ${addedDe} de keys and ${addedSw} sw keys.`);
