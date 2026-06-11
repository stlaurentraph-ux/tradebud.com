/**
 * Detect Norwegian / Indonesian leaks in farmer English copy.
 * Used by rebuild-en-locale.mjs and verify-en-locale.mjs.
 */
export const NORWEGIAN_LEAK =
  /[æøåÆØÅ]|Legg til|gjennomsnitt|toppunkt|Dokumenter|dokumenter|Advarsel|Innstillinger|Tilbake|Kunne ikke|høst|kjøper|bonde|Bonde|Logg på|Logg av|valgfritt|Fullfør|Kansellere|Erklæring|Skriv inn|Godta |Øyeblikks|produsent|Nytt bilde|Fotobibliotek|Hopp over|Velg |Deklarasjon|høst|kjøper|samsvar|nettbrett|kommune|bygd|køelement|serverplott|gjenforsøk|verneområde|forvaltning|pålogget|plottene|innhøsting|Vekt \(kg\)|Lagre |Slett /i;

export const INDONESIAN_LEAK =
  /\b(dan|untuk|dengan|anda|tidak|pada|lahan|panen|Masukkan|Apakah|Selesaikan|Beranda|Catat|Pilih|Bagikan|Masuk|Lahan|petani|Akun|Profil)\b/i;

export function findLocaleLeaks(entries) {
  const leaks = [];
  for (const [key, value] of Object.entries(entries)) {
    if (typeof value !== 'string' || !value.trim()) continue;
    if (NORWEGIAN_LEAK.test(value)) {
      leaks.push({ key, value, reason: 'norwegian' });
    } else if (INDONESIAN_LEAK.test(value)) {
      leaks.push({ key, value, reason: 'indonesian' });
    }
  }
  return leaks;
}

export function isEnglishFarmerString(value) {
  if (!value || NORWEGIAN_LEAK.test(value) || INDONESIAN_LEAK.test(value)) return false;
  const letters = (value.match(/[a-zA-Z]/g) || []).length;
  const total = (value.match(/\S/g) || []).length;
  return total > 0 && letters / total > 0.5;
}
