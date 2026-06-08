import type { SupportedLanguage } from '../config';

import am from './am.json';
import de from './de.json';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import id from './id.json';
import it from './it.json';
import nl from './nl.json';
import no from './no.json';
import pt from './pt.json';
import vi from './vi.json';

export const messages: Record<SupportedLanguage, Record<string, string>> = {
  en,
  fr,
  es,
  pt,
  id,
  vi,
  de,
  nl,
  it,
  am,
  no,
};
