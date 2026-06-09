#!/usr/bin/env node
/**
 * Merges en.json marketing keys into each locale file while preserving
 * existing translations (locale values win on conflict).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, "../messages");

const locales = ["en", "fr", "es", "pt", "id", "vi", "de", "nl", "it", "am", "no"];

function deepMergeFill(base, overlay) {
  if (base === null || typeof base !== "object" || Array.isArray(base)) {
    return overlay !== undefined ? overlay : base;
  }
  const result = { ...base };
  for (const key of Object.keys(base)) {
    if (overlay && Object.prototype.hasOwnProperty.call(overlay, key)) {
      result[key] = deepMergeFill(base[key], overlay[key]);
    }
  }
  if (overlay && typeof overlay === "object" && !Array.isArray(overlay)) {
    for (const key of Object.keys(overlay)) {
      if (!Object.prototype.hasOwnProperty.call(result, key)) {
        result[key] = overlay[key];
      }
    }
  }
  return result;
}

const enMessages = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"));
const enMarketing = enMessages.marketing;
const enHeader = enMessages.header;

for (const locale of locales) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  const messages = JSON.parse(fs.readFileSync(filePath, "utf8"));
  messages.marketing = deepMergeFill(enMarketing, messages.marketing ?? {});
  if (enHeader) {
    messages.header = deepMergeFill(enHeader, messages.header ?? {});
  }
  fs.writeFileSync(filePath, `${JSON.stringify(messages, null, 2)}\n`);
  console.log(`Updated ${locale}.json`);
}
