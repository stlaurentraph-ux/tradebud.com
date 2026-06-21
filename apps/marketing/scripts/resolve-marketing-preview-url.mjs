#!/usr/bin/env node
/**
 * Resolve marketing Vercel preview base URL for slice 4.6 Playwright runs.
 *
 * Priority:
 * 1. MARKETING_PREVIEW_BASE_URL
 * 2. PLAYWRIGHT_BASE_URL (when PLAYWRIGHT_SKIP_WEBSERVER=1)
 * 3. Vercel preview URL parsed from PR issue comments (GITHUB_TOKEN + GITHUB_PR_NUMBER)
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PREVIEW_URL_PATTERN =
  /https:\/\/[a-z0-9][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*)*\.vercel\.app/gi;

function normalizeBaseUrl(raw) {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function scorePreviewUrl(url, hints = []) {
  const lower = url.toLowerCase();
  let score = 0;
  for (const hint of hints) {
    if (lower.includes(hint.toLowerCase())) {
      score += 10;
    }
  }
  if (lower.includes('tradebud')) {
    score += 5;
  }
  return score;
}

function pickBestPreviewUrl(candidates, hints) {
  const unique = [...new Set(candidates.map((url) => normalizeBaseUrl(url)).filter(Boolean))];
  if (unique.length === 0) {
    return null;
  }
  unique.sort((left, right) => scorePreviewUrl(right, hints) - scorePreviewUrl(left, hints));
  return unique[0] ?? null;
}

function extractPreviewUrls(text) {
  if (!text) return [];
  return [...text.matchAll(PREVIEW_URL_PATTERN)].map((match) => match[0]);
}

async function fetchPreviewFromPullRequestComments() {
  const token = process.env.GITHUB_TOKEN?.trim();
  const prNumber = process.env.GITHUB_PR_NUMBER?.trim();
  const repository = process.env.GITHUB_REPOSITORY?.trim();

  if (!token || !prNumber || !repository) {
    return { url: null, source: null };
  }

  const response = await fetch(
    `https://api.github.com/repos/${repository}/issues/${prNumber}/comments`,
    {
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${token}`,
        'x-github-api-version': '2022-11-28',
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub comments lookup failed (${response.status})`);
  }

  const comments = await response.json();
  const hints = (process.env.MARKETING_PREVIEW_PROJECT_HINTS ?? 'tradebud-com,tracebud-marketing')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const candidates = [];
  for (const comment of comments) {
    if (typeof comment.body !== 'string') continue;
    candidates.push(...extractPreviewUrls(comment.body));
  }

  return {
    url: pickBestPreviewUrl(candidates, hints),
    source: 'github_pr_comment',
  };
}

export async function resolveMarketingPreviewUrl() {
  const explicit = normalizeBaseUrl(process.env.MARKETING_PREVIEW_BASE_URL);
  if (explicit) {
    return { url: explicit, source: 'MARKETING_PREVIEW_BASE_URL', explicit: true };
  }

  if (process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1') {
    const playwrightBase = normalizeBaseUrl(process.env.PLAYWRIGHT_BASE_URL);
    if (playwrightBase) {
      return { url: playwrightBase, source: 'PLAYWRIGHT_BASE_URL', explicit: true };
    }
  }

  const fromComments = await fetchPreviewFromPullRequestComments();
  if (fromComments.url) {
    return { ...fromComments, explicit: false };
  }

  return { url: null, source: null, explicit: false };
}

function main() {
  resolveMarketingPreviewUrl()
    .then((result) => {
      if (result.url) {
        console.log(result.url);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
const modulePath = fileURLToPath(import.meta.url);
if (invokedPath === modulePath) {
  main();
}
