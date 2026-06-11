import type { SupportedLanguage } from '../config';

import am from './am.json';
import ar from './ar.json';
import de from './de.json';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import hi from './hi.json';
import id from './id.json';
import it from './it.json';
import lg from './lg.json';
import nl from './nl.json';
import pt from './pt.json';
import rw from './rw.json';
import sw from './sw.json';
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
  hi,
  ar,
  rw,
  lg,
  sw,
};
