#!/usr/bin/env python3
"""Apply Luganda pass-2 fixes to features/i18n/messages/lg.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LG = ROOT / 'features/i18n/messages/lg.json'
FIXES = Path(__file__).resolve().parent / 'lg-pass2.json'

fixes = json.loads(FIXES.read_text(encoding='utf-8'))
data = json.loads(LG.read_text(encoding='utf-8'))
data.update(fixes)
LG.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Patched {len(fixes)} keys in lg.json')
