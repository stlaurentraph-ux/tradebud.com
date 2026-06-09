#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, "../messages");
const patches = JSON.parse(
  fs.readFileSync(path.join(messagesDir, "i18n-patches-extra.json"), "utf8")
);

function deepMerge(base, overlay) {
  if (overlay === null || typeof overlay !== "object" || Array.isArray(overlay)) {
    return overlay !== undefined ? overlay : base;
  }
  const result = { ...base };
  for (const key of Object.keys(overlay)) {
    if (
      overlay[key] &&
      typeof overlay[key] === "object" &&
      !Array.isArray(overlay[key]) &&
      base[key] &&
      typeof base[key] === "object" &&
      !Array.isArray(base[key])
    ) {
      result[key] = deepMerge(base[key], overlay[key]);
    } else {
      result[key] = overlay[key];
    }
  }
  return result;
}

for (const [locale, patch] of Object.entries(patches)) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  const messages = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (patch.marketing) {
    messages.marketing = deepMerge(messages.marketing ?? {}, patch.marketing);
  }
  if (patch.footer) {
    messages.footer = deepMerge(messages.footer ?? {}, patch.footer);
  }
  if (patch.faq) {
    messages.faq = deepMerge(messages.faq ?? {}, patch.faq);
  }
  fs.writeFileSync(filePath, `${JSON.stringify(messages, null, 2)}\n`);
  console.log(`Patched ${locale}.json`);
}
