#!/usr/bin/env node
/**
 * Build canonical en.json (464 keys) for farmer UI.
 * Sources: no.json English fallbacks + explicit overrides (never id/no-Norwegian).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findLocaleLeaks, isEnglishFarmerString } from './i18n-en-guard.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const messagesDir = resolve(root, 'features/i18n/messages');
const keys = Object.keys(JSON.parse(readFileSync(resolve(messagesDir, 'hi.json'), 'utf8')));
const no = JSON.parse(readFileSync(resolve(messagesDir, 'no.json'), 'utf8'));

/** Authoritative farmer English — wins over locale fallbacks */
const OVERRIDES = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'canonical-en-overrides.json'), 'utf8'),
);

const overrideLeaks = findLocaleLeaks(OVERRIDES);
if (overrideLeaks.length > 0) {
  console.error('canonical-en-overrides.json contains non-English strings:');
  for (const { key, value, reason } of overrideLeaks) {
    console.error(`  [${reason}] ${key}: ${value}`);
  }
  process.exit(1);
}

const en = {};
for (const key of keys) {
  en[key] = OVERRIDES[key] ?? (isEnglishFarmerString(no[key]) ? no[key] : OVERRIDES[key]);
  if (!en[key]) {
    console.warn(`missing English for ${key}`);
    en[key] = key;
  }
}

// App-only keys not in hi.json
en.signed_out_device = 'Signed out on this device';
en.sign_in_sync_plots = 'Sign in';
en.sign_in_invalid_credentials =
  OVERRIDES.sign_in_invalid_credentials ??
  'Could not sign in. Check your email and password — you need an existing Tracebud account (ask your cooperative or contact support@tracebud.com).';
en.declaration_geo_saved = OVERRIDES.declaration_geo_saved ?? 'GPS location saved';
en.declaration_geo_saved_body =
  OVERRIDES.declaration_geo_saved_body ?? 'Your declaration location is stored on this device.';
en.declaration_geo_saved_hint =
  OVERRIDES.declaration_geo_saved_hint ?? 'Stored on this device for your simplified declaration.';
en.declaration_geo_status_saved = OVERRIDES.declaration_geo_status_saved ?? 'Saved';
en.declaration_geo_not_set = OVERRIDES.declaration_geo_not_set ?? 'No GPS location saved yet.';
en.simplified_declaration_update_gps =
  OVERRIDES.simplified_declaration_update_gps ?? 'Update GPS location';
en.my_plots_empty =
  OVERRIDES.my_plots_empty ?? 'No plots on this device yet. Register a plot to map your field with GPS.';
en.plot_saved_continue = OVERRIDES.plot_saved_continue ?? 'OK';
en.plot_saved_view_my_plots = OVERRIDES.plot_saved_view_my_plots ?? 'View My Plots';
en.plot_still_on_device =
  OVERRIDES.plot_still_on_device ?? 'Your plot is still saved on this device. Open My Plots to see it.';
en.sign_in_backup_done = OVERRIDES.sign_in_backup_done ?? '{n} plot(s) backed up to Tracebud.';
en.sign_in_backup_partial =
  OVERRIDES.sign_in_backup_partial ??
  '{uploaded} backed up, {failed} could not upload. Try Back up in Settings when you are online.';
en.create_account = OVERRIDES.create_account ?? 'Create account';
en.welcome_account_title = OVERRIDES.welcome_account_title ?? 'Welcome to Tracebud';
en.welcome_account_body =
  OVERRIDES.welcome_account_body ??
  'Create a free account to back up your plots and share them with your cooperative. You can skip and map your field offline first — sign in anytime from Settings.';
en.welcome_account_skip = OVERRIDES.welcome_account_skip ?? 'Skip for now';
en.sign_in_with_google = OVERRIDES.sign_in_with_google ?? 'Continue with Google';
en.sign_in_with_apple = OVERRIDES.sign_in_with_apple ?? 'Continue with Apple';
en.sign_in_or_email = OVERRIDES.sign_in_or_email ?? 'or sign in with email';
en.sign_in_oauth_busy = OVERRIDES.sign_in_oauth_busy ?? 'Signing in…';
en.sign_in_oauth_cancelled = OVERRIDES.sign_in_oauth_cancelled ?? 'Sign-in was cancelled.';
en.sign_in_oauth_failed =
  OVERRIDES.sign_in_oauth_failed ??
  'Could not sign in with Google or Apple. Try email and password, or ask your cooperative for help.';
en.sign_in_oauth_needs_signup =
  OVERRIDES.sign_in_oauth_needs_signup ??
  'No Tracebud account is linked to this Apple or Google sign-in yet. Create an account first — it only takes a moment.';
en.sign_in_apple_not_completed =
  OVERRIDES.sign_in_apple_not_completed ??
  'Apple sign-in did not finish. On iPhone, update the Tracebud app to the latest preview build, then try again. If it persists, check Sign in with Apple is enabled for com.tracebud.app in Apple Developer.';
en.farmer_signup_step_you = OVERRIDES.farmer_signup_step_you ?? 'Step 2 · Your name';
en.farmer_signup_step_account = OVERRIDES.farmer_signup_step_account ?? 'Step 1 · Sign up';
en.farmer_signup_step_email = OVERRIDES.farmer_signup_step_email ?? 'Step 2 · Email';
en.farmer_signup_intro_title = OVERRIDES.farmer_signup_intro_title ?? 'Create your farmer account';
en.farmer_signup_intro_body =
  OVERRIDES.farmer_signup_intro_body ??
  'Back up your plots and share them with your cooperative. No company setup.';
en.farmer_signup_name_label = OVERRIDES.farmer_signup_name_label ?? 'Your name';
en.farmer_signup_name_placeholder = OVERRIDES.farmer_signup_name_placeholder ?? 'Maria Santos';
en.farmer_signup_name_hint = OVERRIDES.farmer_signup_name_hint ?? 'Shown on your plot records.';
en.farmer_signup_name_optional_hint =
  OVERRIDES.farmer_signup_name_optional_hint ??
  "Optional — we'll use your email address if you leave this blank.";
en.farmer_signup_name_required = OVERRIDES.farmer_signup_name_required ?? 'Please enter your name.';
en.farmer_signup_method_title = OVERRIDES.farmer_signup_method_title ?? 'Choose how to sign up';
en.farmer_signup_method_body =
  OVERRIDES.farmer_signup_method_body ??
  'Continue with Google, Apple, or email. Your name is filled in automatically when possible.';
en.farmer_signup_use_email = OVERRIDES.farmer_signup_use_email ?? 'Sign up with email';
en.farmer_signup_email_title = OVERRIDES.farmer_signup_email_title ?? 'Sign up with email';
en.farmer_signup_email_body =
  OVERRIDES.farmer_signup_email_body ?? 'Enter your name, email, and a password.';
en.farmer_signup_email_section = OVERRIDES.farmer_signup_email_section ?? 'Email and password';
en.farmer_signup_name_after_oauth_title =
  OVERRIDES.farmer_signup_name_after_oauth_title ?? "What's your name?";
en.farmer_signup_name_after_oauth_body =
  OVERRIDES.farmer_signup_name_after_oauth_body ??
  "We didn't get your name from Apple or Google. Add it for your plot records.";
en.farmer_signup_back = OVERRIDES.farmer_signup_back ?? 'Back';
en.farmer_signup_already_have = OVERRIDES.farmer_signup_already_have ?? 'Already have an account? Sign in';
en.farmer_signup_confirm_email =
  OVERRIDES.farmer_signup_confirm_email ??
  'Check your email to confirm your address, then sign in from Settings.';
en.farmer_signup_success_title = OVERRIDES.farmer_signup_success_title ?? 'Account created';
en.farmer_signup_success_body =
  OVERRIDES.farmer_signup_success_body ??
  'You are signed in. Your plots will back up when you are online.';
en.plot_register_producer_later_title =
  OVERRIDES.plot_register_producer_later_title ?? 'Producer details';
en.plot_register_producer_later_body =
  OVERRIDES.plot_register_producer_later_body ??
  'Required for compliance before declarations. You can also finish this in Settings.';
en.plot_register_producer_incomplete =
  OVERRIDES.plot_register_producer_incomplete ??
  'Choose your crop and add a postal address or GPS point.';
en.plot_register_recording_as =
  OVERRIDES.plot_register_recording_as ?? 'Recording as {name}';
en.storage_footprint_measuring = OVERRIDES.storage_footprint_measuring ?? 'Calculating storage…';
en.storage_footprint_breakdown =
  OVERRIDES.storage_footprint_breakdown ??
  '{photos} MB photos · {maps} MB offline maps · {data} MB data';

// walk_*, backup_up_to_date, and other keys present only in canonical-en-overrides.json
for (const [key, value] of Object.entries(OVERRIDES)) {
  en[key] = value;
}

const sorted = Object.fromEntries(Object.keys(en).sort().map((k) => [k, en[k]]));
writeFileSync(resolve(messagesDir, 'en.json'), `${JSON.stringify(sorted, null, 2)}\n`);

const bad = findLocaleLeaks(sorted);
if (bad.length > 0) {
  console.error(`en.json — ${bad.length} locale leak(s) after build:`);
  for (const { key, value, reason } of bad) {
    console.error(`  [${reason}] ${key}: ${value}`);
  }
  process.exit(1);
}
console.log(`en.json — ${Object.keys(sorted).length} keys, 0 locale leaks`);
