#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const port = Number(process.env.EMAIL_PREVIEW_PORT || 8765);

const mock = {
  firstName: 'Amara',
  organizationName: 'Côte Cacao Cooperative',
  country: "Côte d'Ivoire",
  roleLabel: 'Exporter',
  loginUrl: 'https://dashboard.tracebud.com/login',
  resumeUrl: 'https://dashboard.tracebud.com/create-account?resume=workspace',
  year: '2026',
};

const templates = [
  {
    id: 'welcome',
    label: 'Email A — Welcome',
    subject: 'Welcome to Tracebud — your workspace is ready',
    file: 'html/welcome.html',
  },
  {
    id: 'resume-first',
    label: 'Email B — Resume nudge (24h)',
    subject: 'Finish setting up your Tracebud workspace',
    file: 'html/resume-nudge-first.html',
  },
  {
    id: 'resume-final',
    label: 'Email C — Final reminder',
    subject: 'Reminder: your Tracebud workspace is almost ready',
    file: 'html/resume-nudge-final.html',
  },
  {
    id: 'supabase-confirm',
    label: 'Supabase — Confirm email (design ref)',
    subject: 'Confirm your Tracebud account',
    file: 'html/supabase-confirm-email.html',
    supabase: true,
  },
];

function substitute(html, supabase = false) {
  if (supabase) {
    const url = 'https://dashboard.tracebud.com/auth/confirm?token=preview-mock';
    return html.replace(/\{\{\s*\.ConfirmationURL\s*\}\}/g, url);
  }
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => mock[key] ?? `{{${key}}}`);
}

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.txt')) return 'text/plain; charset=utf-8';
  if (filePath.endsWith('.md')) return 'text/plain; charset=utf-8';
  return 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);

  if (url.pathname === '/api/templates') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ mock, templates }));
    return;
  }

  const renderMatch = url.pathname.match(/^\/render\/([^/]+)$/);
  if (renderMatch) {
    const entry = templates.find((t) => t.id === renderMatch[1]);
    if (!entry) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Unknown template');
      return;
    }
    const filePath = path.join(root, entry.file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const html = substitute(raw, entry.supabase);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  let relative = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.join(__dirname, decodeURIComponent(relative));
  if (!filePath.startsWith(__dirname) && !filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const candidates = [filePath];
  if (!fs.existsSync(filePath) && relative.startsWith('/html/')) {
    candidates.push(path.join(root, relative.slice(1)));
  }

  const resolved = candidates.find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
  if (!resolved) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  res.writeHead(200, { 'Content-Type': contentType(resolved) });
  res.end(fs.readFileSync(resolved));
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Tracebud email preview → http://127.0.0.1:${port}`);
});
