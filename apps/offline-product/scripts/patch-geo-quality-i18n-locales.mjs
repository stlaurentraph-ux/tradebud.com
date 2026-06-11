#!/usr/bin/env node
/**
 * Localized strings for geo_quality_* and sync_plot_geometry_* keys.
 * Run: node scripts/patch-geo-quality-i18n-locales.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const messagesDir = resolve(dirname(fileURLToPath(import.meta.url)), '../features/i18n/messages');

const patches = {
  es: {
    plot_geometry_warning_title: 'Revisar la forma del límite',
    plot_geometry_warning_fix: 'Corregir límite',
    plot_geometry_warning_save: 'Guardar de todos modos',
    geo_quality_self_intersect:
      'Su límite se cruza consigo mismo. Vuelva a caminar el perímetro sin cortar su propio recorrido.',
    geo_quality_overlap:
      'Este límite se superpone con «{plotName}». Mueva la línea o elimine la parcela duplicada.',
    geo_quality_overlap_unknown: 'otra parcela',
    geo_quality_micro_area:
      'Esta parcela es demasiado pequeña para un límite caminado. Use un punto GPS para parcelas muy pequeñas o vuelva a caminar el borde.',
    geo_quality_sliver:
      'Esta forma parece una mala captura GPS (franja fina). Vuelva a caminar el perímetro a ritmo constante.',
    sync_plot_geometry_block: 'Parcela «{name}»: {message}',
    sync_plot_invalid_geometry: 'La parcela «{name}» tiene geometría no válida.',
    sync_plot_upload_failed: 'Error al subir la parcela «{name}».',
    sync_no_access_token_plot: 'Sin sesión. Vuelva a iniciar sesión en Ajustes.',
  },
  pt: {
    plot_geometry_warning_title: 'Verificar forma do limite',
    plot_geometry_warning_fix: 'Corrigir limite',
    plot_geometry_warning_save: 'Guardar mesmo assim',
    geo_quality_self_intersect:
      'O seu limite cruza-se. Percorra o perímetro novamente sem cortar o seu próprio caminho.',
    geo_quality_overlap:
      'Este limite sobrepõe-se a «{plotName}». Mova a linha ou remova a parcela duplicada.',
    geo_quality_overlap_unknown: 'outra parcela',
    geo_quality_micro_area:
      'Esta parcela é pequena demais para um limite percorrido. Use um ponto GPS para parcelas muito pequenas ou percorra a borda novamente.',
    geo_quality_sliver:
      'Esta forma parece uma má captura GPS (faixa fina). Percorra o perímetro novamente em ritmo constante.',
    sync_plot_geometry_block: 'Parcela «{name}»: {message}',
    sync_plot_invalid_geometry: 'A parcela «{name}» tem geometria inválida.',
    sync_plot_upload_failed: 'Falha ao enviar a parcela «{name}».',
    sync_no_access_token_plot: 'Sem sessão. Inicie sessão novamente em Definições.',
  },
  de: {
    plot_geometry_warning_title: 'Grenzform prüfen',
    plot_geometry_warning_fix: 'Grenze korrigieren',
    plot_geometry_warning_save: 'Trotzdem speichern',
    geo_quality_self_intersect:
      'Ihre Grenze kreuzt sich. Gehen Sie den Umfang erneut ab, ohne Ihren Weg zu kreuzen.',
    geo_quality_overlap:
      'Diese Grenze überlappt «{plotName}». Verschieben Sie die Linie oder entfernen Sie die doppelte Parzelle.',
    geo_quality_overlap_unknown: 'eine andere Parzelle',
    geo_quality_micro_area:
      'Diese Parzelle ist zu klein für eine gelaufene Grenze. Verwenden Sie einen GPS-Punkt für sehr kleine Parzellen oder gehen Sie die Kante erneut ab.',
    geo_quality_sliver:
      'Diese Form wirkt wie eine schlechte GPS-Aufnahme (dünner Streifen). Gehen Sie den Umfang in gleichmäßigem Tempo erneut ab.',
    sync_plot_geometry_block: 'Parzelle «{name}»: {message}',
    sync_plot_invalid_geometry: 'Parzelle «{name}» hat ungültige Geometrie.',
    sync_plot_upload_failed: 'Upload der Parzelle «{name}» fehlgeschlagen.',
    sync_no_access_token_plot: 'Keine Sitzung. Melden Sie sich unter Einstellungen erneut an.',
  },
  nl: {
    plot_geometry_warning_title: 'Grenscontrole',
    plot_geometry_warning_fix: 'Grens corrigeren',
    plot_geometry_warning_save: 'Toch opslaan',
    geo_quality_self_intersect:
      'Uw grens kruist zichzelf. Loop de omtrek opnieuw zonder uw eigen pad te kruisen.',
    geo_quality_overlap:
      'Deze grens overlapt «{plotName}». Verschuif de lijn of verwijder het dubbele perceel.',
    geo_quality_overlap_unknown: 'een ander perceel',
    geo_quality_micro_area:
      'Dit perceel is te klein voor een gelopen grens. Gebruik een GPS-punt voor zeer kleine percelen of loop de rand opnieuw.',
    geo_quality_sliver:
      'Deze vorm lijkt op een slechte GPS-opname (dunne strook). Loop de omtrek opnieuw in een vast tempo.',
    sync_plot_geometry_block: 'Perceel «{name}»: {message}',
    sync_plot_invalid_geometry: 'Perceel «{name}» heeft ongeldige geometrie.',
    sync_plot_upload_failed: 'Upload van perceel «{name}» mislukt.',
    sync_no_access_token_plot: 'Geen sessie. Meld u opnieuw aan bij Instellingen.',
  },
  it: {
    plot_geometry_warning_title: 'Controlla la forma del confine',
    plot_geometry_warning_fix: 'Correggi confine',
    plot_geometry_warning_save: 'Salva comunque',
    geo_quality_self_intersect:
      'Il confine si incrocia. Percorri di nuovo il perimetro senza attraversare il tuo cammino.',
    geo_quality_overlap:
      'Questo confine si sovrappone a «{plotName}». Sposta la linea o rimuovi la parcella duplicata.',
    geo_quality_overlap_unknown: 'un\'altra parcella',
    geo_quality_micro_area:
      'Questa parcella è troppo piccola per un confine percorso. Usa un punto GPS per parcelle molto piccole o percorri di nuovo il bordo.',
    geo_quality_sliver:
      'Questa forma sembra una cattiva acquisizione GPS (striscia sottile). Percorri di nuovo il perimetro a passo costante.',
    sync_plot_geometry_block: 'Parcella «{name}»: {message}',
    sync_plot_invalid_geometry: 'La parcella «{name}» ha geometria non valida.',
    sync_plot_upload_failed: 'Caricamento della parcella «{name}» non riuscito.',
    sync_no_access_token_plot: 'Nessuna sessione. Accedi di nuovo in Impostazioni.',
  },
  id: {
    plot_geometry_warning_title: 'Periksa bentuk batas',
    plot_geometry_warning_fix: 'Perbaiki batas',
    plot_geometry_warning_save: 'Simpan tetap',
    geo_quality_self_intersect:
      'Batas Anda saling bersilangan. Jalani keliling lagi tanpa memotong jalur Anda sendiri.',
    geo_quality_overlap:
      'Batas ini tumpang tindih dengan «{plotName}». Geser garis atau hapus petak duplikat.',
    geo_quality_overlap_unknown: 'petak lain',
    geo_quality_micro_area:
      'Petak ini terlalu kecil untuk batas yang dijalani. Gunakan titik GPS untuk petak sangat kecil atau jalani tepinya lagi.',
    geo_quality_sliver:
      'Bentuk ini seperti tangkapan GPS buruk (jalur tipis). Jalani keliling lagi dengan langkah stabil.',
    sync_plot_geometry_block: 'Petak «{name}»: {message}',
    sync_plot_invalid_geometry: 'Petak «{name}» memiliki geometri tidak valid.',
    sync_plot_upload_failed: 'Gagal mengunggah petak «{name}».',
    sync_no_access_token_plot: 'Tidak ada sesi. Masuk lagi di Pengaturan.',
  },
  vi: {
    plot_geometry_warning_title: 'Kiểm tra hình dạng ranh giới',
    plot_geometry_warning_fix: 'Sửa ranh giới',
    plot_geometry_warning_save: 'Vẫn lưu',
    geo_quality_self_intersect:
      'Ranh giới tự cắt nhau. Đi bộ quanh chu vi lại mà không cắt ngang đường đi của bạn.',
    geo_quality_overlap:
      'Ranh giới này chồng lên «{plotName}». Di chuyển đường hoặc xóa thửa trùng.',
    geo_quality_overlap_unknown: 'thửa khác',
    geo_quality_micro_area:
      'Thửa quá nhỏ cho ranh giới đi bộ. Dùng điểm GPS cho thửa rất nhỏ hoặc đi bộ lại mép.',
    geo_quality_sliver:
      'Hình dạng giống GPS kém (dải mỏng). Đi bộ quanh chu vi lại với nhịp đều.',
    sync_plot_geometry_block: 'Thửa «{name}»: {message}',
    sync_plot_invalid_geometry: 'Thửa «{name}» có hình học không hợp lệ.',
    sync_plot_upload_failed: 'Tải lên thửa «{name}» thất bại.',
    sync_no_access_token_plot: 'Hết phiên. Đăng nhập lại trong Cài đặt.',
  },
  am: {
    plot_geometry_warning_title: 'የድንበር ቅርጽ ይፈትሹ',
    plot_geometry_warning_fix: 'ድንበር ያርሙ',
    plot_geometry_warning_save: 'ቢሆንም አስቀምጥ',
    geo_quality_self_intersect: 'ድንበርዎ እራሱን ይገታል። መንገድዎን ሳይቆራት የዙሪያ ድንበር እንደገና ይሂዱ።',
    geo_quality_overlap: 'ይህ ድንበር ከ«{plotName}» ጋር ይወራረዳል። መስመሩን ያንቀሳቅሱ ወይም ድርብ ቦታ ያስወግዱ።',
    geo_quality_overlap_unknown: 'ሌላ ቦታ',
    geo_quality_micro_area: 'ለየረዳ ድንበር ቦታው በጣም ትንሽ ነው። ለትንሽ ቦታዎች ነጠላ GPS ነጥብ ይጠቀሙ።',
    geo_quality_sliver: 'ቅርጹ መጥፎ GPS መሰላ (ቀጭን ችርቻሮ)። በተወሰነ ፍጥነት ድንበሩን እንደገና ይሂዱ።',
    sync_plot_geometry_block: 'ቦታ «{name}»: {message}',
    sync_plot_invalid_geometry: 'ቦታ «{name}» ልክ ያልሆነ ጂኦሜትሪ አለው።',
    sync_plot_upload_failed: 'ቦታ «{name}» መስቀል አልተሳካም።',
    sync_no_access_token_plot: 'ክፍለ ጊዜ የለም። በቅንብሮች እንደገና ይግቡ።',
  },
  hi: {
    plot_geometry_warning_title: 'सीमा का आकार जाँचें',
    plot_geometry_warning_fix: 'सीमा ठीक करें',
    plot_geometry_warning_save: 'फिर भी सहेजें',
    geo_quality_self_intersect:
      'आपकी सीमा आपस में टकराती है। अपने रास्ते को काटे बिना फिर से चौपाई घूमें।',
    geo_quality_overlap:
      'यह सीमा «{plotName}» से ओवरलैप करती है। रेखा हटाएँ या डुप्लिकेट प्लॉट हटाएँ।',
    geo_quality_overlap_unknown: 'दूसरा प्लॉट',
    geo_quality_micro_area:
      'यह प्लॉट चलकर सीमा के लिए बहुत छोटा है। बहुत छोटे प्लॉट के लिए एक GPS बिंदु उपयोग करें।',
    geo_quality_sliver:
      'आकार खराब GPS वॉक जैसा लगता है (पतली पट्टी)। समान गति से फिर से चौपाई घूमें।',
    sync_plot_geometry_block: 'प्लॉट «{name}»: {message}',
    sync_plot_invalid_geometry: 'प्लॉट «{name}» की ज्यामिति अमान्य है।',
    sync_plot_upload_failed: 'प्लॉट «{name}» अपलोड विफल।',
    sync_no_access_token_plot: 'सत्र नहीं। सेटिंग्स में फिर साइन इन करें।',
  },
  ar: {
    plot_geometry_warning_title: 'تحقق من شكل الحدود',
    plot_geometry_warning_fix: 'تصحيح الحدود',
    plot_geometry_warning_save: 'حفظ على أي حال',
    geo_quality_self_intersect:
      'حدودك تتقاطع مع نفسها. أعد المشي حول المحيط دون قطع مسارك.',
    geo_quality_overlap:
      'هذا الحد يتداخل مع «{plotName}». حرّك الخط أو أزل القطعة المكررة.',
    geo_quality_overlap_unknown: 'قطعة أخرى',
    geo_quality_micro_area:
      'هذه القطعة صغيرة جداً لحدود مشية. استخدم نقطة GPS للقطع الصغيرة جداً أو أعد المشي على الحافة.',
    geo_quality_sliver:
      'الشكل يبدو كتقاط GPS سيء (شريط رفيع). أعد المشي بوتيرة ثابتة.',
    sync_plot_geometry_block: 'القطعة «{name}»: {message}',
    sync_plot_invalid_geometry: 'القطعة «{name}» لها هندسة غير صالحة.',
    sync_plot_upload_failed: 'فشل رفع القطعة «{name}».',
    sync_no_access_token_plot: 'لا توجد جلسة. سجّل الدخول من الإعدادات.',
  },
  rw: {
    plot_geometry_warning_title: 'Reba imiterere y\'umupaka',
    plot_geometry_warning_fix: 'Kosora umupaka',
    plot_geometry_warning_save: 'Bika n\'ubwo bidakora',
    geo_quality_self_intersect:
      'Umupaka wawe uhura n\'umwenyine. Subira inyuma y\'umupaka utarenge inzira yawe.',
    geo_quality_overlap:
      'Uyu mupaka uhura na «{plotName}». Hindura umurongo cyangwa ukuremo isambu yisubiramo.',
    geo_quality_overlap_unknown: 'isambu yindi',
    geo_quality_micro_area:
      'Iyi sambu ni nto cyane ku mupaka utembewe. Koresha aho GPS hasanzwe ku masambu mato.',
    geo_quality_sliver:
      'Iyi miterere isa n\'imyenda mibi ya GPS. Subira inyuma y\'umupaka mu buryo bwizewe.',
    sync_plot_geometry_block: 'Isambu «{name}»: {message}',
    sync_plot_invalid_geometry: 'Isambu «{name}» ifite imiterere itemewe.',
    sync_plot_upload_failed: 'Kohereza isambu «{name}» byanze.',
    sync_no_access_token_plot: 'Nta sesiyo. Injira nanone mu Igenamiterere.',
  },
  lg: {
    plot_geometry_warning_title: 'Kebera enfaanana y\'omusalosalo',
    plot_geometry_warning_fix: 'Longosa omusalosalo',
    plot_geometry_warning_save: 'Tereka newankubade',
    geo_quality_self_intersect:
      'Omusalosalo gwo gwegatta. Ddamu okutambula okwetooloola nga tosala luguudo lwo.',
    geo_quality_overlap:
      'Omusalosalo guno gukwatagana ne «{plotName}». Kyusa layini oba ggyawo ekibanja ekyefaananyiriza.',
    geo_quality_overlap_unknown: 'ekibanja ekirala',
    geo_quality_micro_area:
      'Ekibanja kino kitono nnyo okutambulirako omusalosalo. Kozesa ekifo kya GPS ku bibanja ebitono.',
    geo_quality_sliver:
      'Enfaanana eno erina ng\'ekyeyambisibwa kya GPS ebibi. Ddamu okutambula mu ngeri entuufu.',
    sync_plot_geometry_block: 'Ekibanja «{name}»: {message}',
    sync_plot_invalid_geometry: 'Ekibanja «{name}» kirina ebifo ebitatuufu.',
    sync_plot_upload_failed: 'Okuteeka ekibanja «{name}» kulemeddwa.',
    sync_no_access_token_plot: 'Tewali sessa. Ddamu okyingira mu Settings.',
  },
  sw: {
    plot_geometry_warning_title: 'Angalia umbo la mpaka',
    plot_geometry_warning_fix: 'Rekebisha mpaka',
    plot_geometry_warning_save: 'Hifadhi hata hivyo',
    geo_quality_self_intersect:
      'Mpaka wako unajikata. Tembea mzunguko tena bila kukata njia yako.',
    geo_quality_overlap:
      'Mpaka huu unaingiliana na «{plotName}». Sogeza mstari au ondoa kiwanja kilichorudiwa.',
    geo_quality_overlap_unknown: 'kiwanja kingine',
    geo_quality_micro_area:
      'Kiwanja hiki kidogo sana kwa mpaka wa kutembea. Tumia pointi ya GPS kwa viwanja vidogo.',
    geo_quality_sliver:
      'Umbo linaonekana kama GPS mbaya (mstari mwembamba). Tembea mzunguko kwa kasi thabiti.',
    sync_plot_geometry_block: 'Kiwanja «{name}»: {message}',
    sync_plot_invalid_geometry: 'Kiwanja «{name}» kina jiometri batili.',
    sync_plot_upload_failed: 'Imeshindwa kupakia kiwanja «{name}».',
    sync_no_access_token_plot: 'Hakuna kikao. Ingia tena kwenye Mipangilio.',
  },
};

for (const [locale, keys] of Object.entries(patches)) {
  const path = resolve(messagesDir, `${locale}.json`);
  const json = JSON.parse(readFileSync(path, 'utf8'));
  Object.assign(json, keys);
  writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`);
  console.log(`patched ${locale}.json`);
}
