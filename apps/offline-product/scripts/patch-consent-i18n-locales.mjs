#!/usr/bin/env node
/**
 * Localized strings for backup_consent_* and data_sharing_* (sovereignty slice).
 * Run: node scripts/patch-consent-i18n-locales.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { asiaAfricaPatches } from './consent-i18n-asia-africa-patches.mjs';

const messagesDir = resolve(dirname(fileURLToPath(import.meta.url)), '../features/i18n/messages');

const patches = {
  es: {
    backup_consent_title: '¿Guardar copia en Tracebud?',
    backup_consent_body:
      '{n} parcela(s) en este dispositivo aún no están respaldadas. Suba límites, cosechas y metadatos de evidencia a Tracebud para recuperarlos si pierde el teléfono.',
    backup_consent_confirm: 'Subir mis datos',
    backup_consent_decline: 'Ahora no',
    data_sharing_title: 'Compartir datos',
    data_sharing_subtitle: 'Quién puede ver sus registros de productor',
    data_sharing_settings_body:
      'Vea quién puede acceder a sus parcelas y evidencias, apruebe solicitudes o revoque el acceso.',
    data_sharing_manage: 'Gestionar compartición',
    data_sharing_intro:
      'Usted decide qué organizaciones pueden usar sus registros Tracebud. Cooperativas y compradores solo acceden tras su aprobación en Tracebud. Puede revocar el acceso futuro en cualquier momento; los datos ya vinculados a lotes o envíos vendidos siguen disponibles para cumplimiento. Los importadores pueden conservarlos hasta 5 años según normas UE.',
    data_sharing_eudr_note:
      'Las declaraciones EUDR (deforestación, FPIC, trabajo) son attestaciones distintas para el mercado UE — no es lo mismo que compartir acceso aquí.',
    data_sharing_sign_in_required:
      'Inicie sesión para ver y gestionar quién accede a sus datos respaldados.',
    data_sharing_load_failed:
      'No se pudieron cargar los ajustes de compartición. Intente de nuevo en línea.',
    data_sharing_queue_synced: '{n} actualización(es) de compartición enviada(s) desde la cola sin conexión.',
    data_sharing_queued_offline: 'Guardado sin conexión — se sincronizará cuando vuelva en línea.',
    data_sharing_pending: 'Solicitudes pendientes',
    data_sharing_active: 'Organizaciones con acceso',
    data_sharing_none_active:
      'Ninguna organización tiene acceso actualmente. Sus datos permanecen en este dispositivo hasta respaldar y aprobar una solicitud.',
    data_sharing_status_pending: 'Pendiente',
    data_sharing_status_active: 'Activo',
    data_sharing_can_see: 'Puede ver: {scope}',
    data_sharing_scope_identity: 'perfil',
    data_sharing_scope_plots: 'parcelas',
    data_sharing_scope_evidence: 'evidencia',
    data_sharing_allow: 'Permitir',
    data_sharing_deny: 'Denegar',
    data_sharing_revoke: 'Revocar acceso futuro',
    data_sharing_revoke_title: '¿Revocar acceso futuro?',
    data_sharing_revoke_body:
      'Esto impide que {org} vea sus parcelas, cosechas y evidencias nuevas. Los datos ya vinculados a lotes o envíos que les vendió no pueden retirarse — permanecen para cumplimiento. Los importadores pueden conservarlos hasta 5 años según normas UE.',
    data_sharing_revoke_confirm: 'Revocar',
    data_sharing_revoke_reason: 'Revocado por el productor en la app de campo',
    data_sharing_unknown_org: 'esta organización',
    data_sharing_action_failed: 'No se pudo actualizar la compartición.',
    data_sharing_export_title: 'Su copia personal',
    data_sharing_export_body:
      'Descargue para sus archivos. Cooperativas y compradores solo acceden tras su aprobación en Tracebud.',
    data_sharing_export_footnote:
      'Este archivo es solo una copia personal. No está verificado para flujos cooperativos ni presentación UE.',
    data_sharing_download_records: 'Descargar para mis archivos',
    data_sharing_gdpr_title: 'Solicitar borrado de datos',
    data_sharing_gdpr_body:
      'Envíe una solicitud de borrado RGPD. Los datos ya vendidos en lotes o envíos pueden conservarse hasta 5 años por cumplimiento UE y no pueden retirarse retroactivamente.',
    data_sharing_gdpr_placeholder: 'Explique brevemente por qué desea borrar los datos de su cuenta…',
    data_sharing_gdpr_submit: 'Enviar solicitud de borrado',
  },
  pt: {
    backup_consent_title: 'Fazer backup no Tracebud?',
    backup_consent_body:
      '{n} parcela(s) neste dispositivo ainda não foram salvas. Envie limites, colheitas e metadados de evidência ao Tracebud para recuperá-los se perder o telefone.',
    backup_consent_confirm: 'Enviar meus dados',
    backup_consent_decline: 'Agora não',
    data_sharing_title: 'Partilha de dados',
    data_sharing_subtitle: 'Quem pode ver os seus registos de produtor',
    data_sharing_settings_body:
      'Veja quem pode aceder às suas parcelas e evidências, aprove pedidos ou revogue o acesso.',
    data_sharing_manage: 'Gerir partilha',
    data_sharing_intro:
      'Você decide quais organizações podem usar os seus registos Tracebud. Cooperativas e compradores só acedem após a sua aprovação no Tracebud. Pode revogar o acesso futuro a qualquer momento; dados já ligados a lotes ou expedições vendidos permanecem disponíveis para conformidade. Importadores podem conservá-los até 5 anos segundo regras UE.',
    data_sharing_eudr_note:
      'Declarações EUDR (desmatamento, FPIC, trabalho) são atestações distintas para o mercado UE — não é o mesmo que partilhar acesso aqui.',
    data_sharing_sign_in_required:
      'Inicie sessão para ver e gerir quem acede aos seus dados guardados.',
    data_sharing_load_failed:
      'Não foi possível carregar as definições de partilha. Tente novamente online.',
    data_sharing_queue_synced: '{n} atualização(ões) de partilha enviada(s) da fila offline.',
    data_sharing_queued_offline: 'Guardado offline — sincroniza quando estiver online.',
    data_sharing_pending: 'Pedidos pendentes',
    data_sharing_active: 'Organizações com acesso',
    data_sharing_none_active:
      'Nenhuma organização tem acesso atualmente. Os seus dados ficam neste dispositivo até fazer backup e aprovar um pedido.',
    data_sharing_status_pending: 'Pendente',
    data_sharing_status_active: 'Ativo',
    data_sharing_can_see: 'Pode ver: {scope}',
    data_sharing_scope_identity: 'perfil',
    data_sharing_scope_plots: 'parcelas',
    data_sharing_scope_evidence: 'evidência',
    data_sharing_allow: 'Permitir',
    data_sharing_deny: 'Recusar',
    data_sharing_revoke: 'Revogar acesso futuro',
    data_sharing_revoke_title: 'Revogar acesso futuro?',
    data_sharing_revoke_body:
      'Isto impede {org} de ver as suas novas parcelas, colheitas e evidências. Dados já ligados a lotes ou expedições que lhes vendeu não podem ser retirados — permanecem para conformidade. Importadores podem conservá-los até 5 anos segundo regras UE.',
    data_sharing_revoke_confirm: 'Revogar',
    data_sharing_revoke_reason: 'Revogado pelo produtor na app de campo',
    data_sharing_unknown_org: 'esta organização',
    data_sharing_action_failed: 'Não foi possível atualizar a partilha.',
    data_sharing_export_title: 'A sua cópia pessoal',
    data_sharing_export_body:
      'Descarregue para os seus registos. Cooperativas e compradores só acedem após a sua aprovação no Tracebud.',
    data_sharing_export_footnote:
      'Este ficheiro é apenas uma cópia pessoal. Não está verificado para fluxos cooperativos nem submissão UE.',
    data_sharing_download_records: 'Descarregar para os meus registos',
    data_sharing_gdpr_title: 'Pedir eliminação de dados',
    data_sharing_gdpr_body:
      'Envie um pedido de eliminação RGPD. Dados já vendidos em lotes ou expedições podem ser conservados até 5 anos por conformidade UE e não podem ser retirados retroativamente.',
    data_sharing_gdpr_placeholder: 'Explique brevemente por que deseja eliminar os dados da sua conta…',
    data_sharing_gdpr_submit: 'Enviar pedido de eliminação',
  },
  de: {
    backup_consent_title: 'Auf Tracebud sichern?',
    backup_consent_body:
      '{n} Parzelle(n) auf diesem Gerät sind noch nicht gesichert. Laden Sie Grenzen, Ernten und Nachweis-Metadaten zu Tracebud hoch, um sie bei Verlust des Telefons wiederherzustellen.',
    backup_consent_confirm: 'Meine Daten hochladen',
    backup_consent_decline: 'Nicht jetzt',
    data_sharing_title: 'Datenfreigabe',
    data_sharing_subtitle: 'Wer Ihre Produzentendaten sehen darf',
    data_sharing_settings_body:
      'Sehen Sie, wer auf Parzellen und Nachweise zugreifen darf, genehmigen Sie Anfragen oder widerrufen Sie den Zugriff.',
    data_sharing_manage: 'Datenfreigabe verwalten',
    data_sharing_intro:
      'Sie entscheiden, welche Organisationen Ihre Tracebud-Daten nutzen dürfen. Genossenschaften und Käufer erhalten Zugriff nur nach Ihrer Freigabe in Tracebud. Sie können künftigen Zugriff jederzeit widerrufen; Daten, die bereits mit verkauften Chargen oder Sendungen verknüpft sind, bleiben für die Compliance verfügbar. Importeure dürfen sie bis zu 5 Jahre nach EU-Regeln aufbewahren.',
    data_sharing_eudr_note:
      'EUDR-Parzellenerklärungen (Entwaldung, FPIC, Arbeit) sind separate Nachweise für EU-Marktregeln — nicht dasselbe wie die Freigabe hier.',
    data_sharing_sign_in_required:
      'Melden Sie sich an, um zu sehen und zu steuern, wer auf Ihre gesicherten Daten zugreifen darf.',
    data_sharing_load_failed:
      'Freigabeeinstellungen konnten nicht geladen werden. Versuchen Sie es online erneut.',
    data_sharing_queue_synced: '{n} Freigabe-Aktualisierung(en) aus der Offline-Warteschlange gesendet.',
    data_sharing_queued_offline: 'Offline gespeichert — wird synchronisiert, sobald Sie online sind.',
    data_sharing_pending: 'Offene Anfragen',
    data_sharing_active: 'Organisationen mit Zugriff',
    data_sharing_none_active:
      'Derzeit hat keine Organisation Zugriff. Ihre Daten bleiben auf diesem Gerät, bis Sie sichern und eine Anfrage genehmigen.',
    data_sharing_status_pending: 'Ausstehend',
    data_sharing_status_active: 'Aktiv',
    data_sharing_can_see: 'Darf sehen: {scope}',
    data_sharing_scope_identity: 'Profil',
    data_sharing_scope_plots: 'Parzellen',
    data_sharing_scope_evidence: 'Nachweise',
    data_sharing_allow: 'Erlauben',
    data_sharing_deny: 'Ablehnen',
    data_sharing_revoke: 'Künftigen Zugriff widerrufen',
    data_sharing_revoke_title: 'Künftigen Zugriff widerrufen?',
    data_sharing_revoke_body:
      '{org} kann danach keine neuen Parzellen, Ernten und Nachweise mehr sehen. Bereits mit verkauften Chargen oder Sendungen verknüpfte Daten können nicht zurückgezogen werden — sie bleiben für die Compliance verfügbar. Importeure dürfen sie bis zu 5 Jahre nach EU-Regeln aufbewahren.',
    data_sharing_revoke_confirm: 'Widerrufen',
    data_sharing_revoke_reason: 'Vom Produzenten in der Feld-App widerrufen',
    data_sharing_unknown_org: 'diese Organisation',
    data_sharing_action_failed: 'Freigabe konnte nicht aktualisiert werden.',
    data_sharing_export_title: 'Ihre persönliche Kopie',
    data_sharing_export_body:
      'Für Ihre Unterlagen herunterladen. Genossenschaften und Käufer erhalten Zugriff nur nach Ihrer Freigabe in Tracebud.',
    data_sharing_export_footnote:
      'Diese Datei ist nur eine persönliche Sicherung. Sie ist nicht für Genossenschafts-Workflows oder EU-Einreichung verifiziert.',
    data_sharing_download_records: 'Für meine Unterlagen herunterladen',
    data_sharing_gdpr_title: 'Datenlöschung beantragen',
    data_sharing_gdpr_body:
      'Stellen Sie einen DSGVO-Löschantrag. Bereits in Chargen oder Sendungen verkaufte Daten können bis zu 5 Jahre für EU-Compliance aufbewahrt werden und sind nicht rückwirkend widerrufbar.',
    data_sharing_gdpr_placeholder: 'Kurz erklären, warum Sie Ihre Kontodaten löschen möchten…',
    data_sharing_gdpr_submit: 'Löschantrag senden',
  },
  nl: {
    backup_consent_title: 'Back-up naar Tracebud?',
    backup_consent_body:
      '{n} perce(e)l(en) op dit apparaat zijn nog niet geback-upt. Upload perceelgrenzen, oogsten en bewijsmetadata naar Tracebud om ze te herstellen als u uw telefoon verliest.',
    backup_consent_confirm: 'Mijn gegevens uploaden',
    backup_consent_decline: 'Niet nu',
    data_sharing_title: 'Gegevens delen',
    data_sharing_subtitle: 'Wie uw producentgegevens mag zien',
    data_sharing_settings_body:
      'Bekijk wie toegang heeft tot uw percelen en bewijs, keur verzoeken goed of trek toegang in.',
    data_sharing_manage: 'Delen beheren',
    data_sharing_intro:
      'U bepaalt welke organisaties uw Tracebud-gegevens mogen gebruiken. Coöperaties en kopers krijgen alleen toegang na uw goedkeuring in Tracebud. U kunt toekomstige toegang altijd intrekken; gegevens die al gekoppeld zijn aan verkochte partijen of zendingen blijven beschikbaar voor compliance. Importeurs mogen ze tot 5 jaar bewaren volgens EU-regels.',
    data_sharing_eudr_note:
      'EUDR-perceelverklaringen (ontbossing, FPIC, arbeid) zijn aparte attestaties voor EU-marktregels — niet hetzelfde als toegang delen hier.',
    data_sharing_sign_in_required:
      'Meld u aan om te zien en beheren wie toegang heeft tot uw geback-upte gegevens.',
    data_sharing_load_failed:
      'Kon deelinstellingen niet laden. Probeer opnieuw wanneer u online bent.',
    data_sharing_queue_synced: '{n} deelupdate(s) verzonden vanuit offline wachtrij.',
    data_sharing_queued_offline: 'Offline opgeslagen — synchroniseert wanneer u online bent.',
    data_sharing_pending: 'Openstaande verzoeken',
    data_sharing_active: 'Organisaties met toegang',
    data_sharing_none_active:
      'Geen organisatie heeft momenteel toegang. Uw gegevens blijven op dit apparaat tot u back-upt en een verzoek goedkeurt.',
    data_sharing_status_pending: 'In afwachting',
    data_sharing_status_active: 'Actief',
    data_sharing_can_see: 'Mag zien: {scope}',
    data_sharing_scope_identity: 'profiel',
    data_sharing_scope_plots: 'percelen',
    data_sharing_scope_evidence: 'bewijs',
    data_sharing_allow: 'Toestaan',
    data_sharing_deny: 'Weigeren',
    data_sharing_revoke: 'Toekomstige toegang intrekken',
    data_sharing_revoke_title: 'Toekomstige toegang intrekken?',
    data_sharing_revoke_body:
      'Dit voorkomt dat {org} uw nieuwe percelen, oogsten en bewijs ziet. Gegevens die al gekoppeld zijn aan partijen of zendingen die u aan hen verkocht heeft, kunnen niet worden ingetrokken — ze blijven voor compliance beschikbaar. Importeurs mogen ze tot 5 jaar bewaren volgens EU-regels.',
    data_sharing_revoke_confirm: 'Intrekken',
    data_sharing_revoke_reason: 'Ingetrokken door producent in veld-app',
    data_sharing_unknown_org: 'deze organisatie',
    data_sharing_action_failed: 'Kon deelinstellingen niet bijwerken.',
    data_sharing_export_title: 'Uw persoonlijke kopie',
    data_sharing_export_body:
      'Download voor uw administratie. Coöperaties en kopers krijgen alleen toegang na uw goedkeuring in Tracebud.',
    data_sharing_export_footnote:
      'Dit bestand is alleen een persoonlijke back-up. Het is niet geverifieerd voor coöperatieve workflows of EU-indiening.',
    data_sharing_download_records: 'Downloaden voor mijn administratie',
    data_sharing_gdpr_title: 'Gegevenswissing aanvragen',
    data_sharing_gdpr_body:
      'Dien een AVG-wissingsverzoek in. Reeds verkochte gegevens in partijen of zendingen kunnen tot 5 jaar voor EU-compliance bewaard worden en zijn niet met terugwerkende kracht in te trekken.',
    data_sharing_gdpr_placeholder: 'Leg kort uit waarom u uw accountgegevens wilt wissen…',
    data_sharing_gdpr_submit: 'Wissingsverzoek indienen',
  },
  it: {
    backup_consent_title: 'Eseguire backup su Tracebud?',
    backup_consent_body:
      '{n} appezzamento/i su questo dispositivo non sono ancora salvati. Carica confini, raccolti e metadati delle prove su Tracebud per recuperarli se perdi il telefono.',
    backup_consent_confirm: 'Carica i miei dati',
    backup_consent_decline: 'Non ora',
    data_sharing_title: 'Condivisione dati',
    data_sharing_subtitle: 'Chi può vedere i tuoi registri produttore',
    data_sharing_settings_body:
      'Vedi chi può accedere a appezzamenti e prove, approva richieste o revoca l\'accesso.',
    data_sharing_manage: 'Gestisci condivisione',
    data_sharing_intro:
      'Decidi quali organizzazioni possono usare i tuoi registri Tracebud. Cooperative e acquirenti accedono solo dopo la tua approvazione in Tracebud. Puoi revocare l\'accesso futuro in qualsiasi momento; i dati già collegati a lotti o spedizioni venduti restano disponibili per la conformità. Gli importatori possono conservarli fino a 5 anni secondo le regole UE.',
    data_sharing_eudr_note:
      'Le dichiarazioni EUDR (deforestazione, FPIC, lavoro) sono attestazioni separate per il mercato UE — non è la stessa cosa della condivisione qui.',
    data_sharing_sign_in_required:
      'Accedi per vedere e gestire chi può accedere ai tuoi dati salvati.',
    data_sharing_load_failed:
      'Impossibile caricare le impostazioni di condivisione. Riprova quando sei online.',
    data_sharing_queue_synced: '{n} aggiornamento/i di condivisione inviato/i dalla coda offline.',
    data_sharing_queued_offline: 'Salvato offline — si sincronizzerà quando sei online.',
    data_sharing_pending: 'Richieste in attesa',
    data_sharing_active: 'Organizzazioni con accesso',
    data_sharing_none_active:
      'Nessuna organizzazione ha attualmente accesso. I tuoi dati restano su questo dispositivo finché non fai backup e approvi una richiesta.',
    data_sharing_status_pending: 'In attesa',
    data_sharing_status_active: 'Attivo',
    data_sharing_can_see: 'Può vedere: {scope}',
    data_sharing_scope_identity: 'profilo',
    data_sharing_scope_plots: 'appezzamenti',
    data_sharing_scope_evidence: 'prove',
    data_sharing_allow: 'Consenti',
    data_sharing_deny: 'Rifiuta',
    data_sharing_revoke: 'Revoca accesso futuro',
    data_sharing_revoke_title: 'Revocare l\'accesso futuro?',
    data_sharing_revoke_body:
      'Questo impedisce a {org} di vedere i tuoi nuovi appezzamenti, raccolti e prove. I dati già collegati a lotti o spedizioni che gli hai venduto non possono essere ritirati — restano per la conformità. Gli importatori possono conservarli fino a 5 anni secondo le regole UE.',
    data_sharing_revoke_confirm: 'Revoca',
    data_sharing_revoke_reason: 'Revocato dal produttore nell\'app di campo',
    data_sharing_unknown_org: 'questa organizzazione',
    data_sharing_action_failed: 'Impossibile aggiornare la condivisione.',
    data_sharing_export_title: 'La tua copia personale',
    data_sharing_export_body:
      'Scarica per i tuoi archivi. Cooperative e acquirenti accedono solo dopo la tua approvazione in Tracebud.',
    data_sharing_export_footnote:
      'Questo file è solo un backup personale. Non è verificato per flussi cooperativi o deposito UE.',
    data_sharing_download_records: 'Scarica per i miei archivi',
    data_sharing_gdpr_title: 'Richiedi cancellazione dati',
    data_sharing_gdpr_body:
      'Invia una richiesta di cancellazione GDPR. I dati già venduti in lotti o spedizioni possono essere conservati fino a 5 anni per conformità UE e non possono essere ritirati retroattivamente.',
    data_sharing_gdpr_placeholder: 'Spiega brevemente perché vuoi cancellare i dati del tuo account…',
    data_sharing_gdpr_submit: 'Invia richiesta di cancellazione',
  },
  id: {
    backup_consent_title: 'Cadangkan ke Tracebud?',
    backup_consent_body:
      '{n} petak di perangkat ini belum dicadangkan. Unggah batas lahan, panen, dan metadata bukti ke Tracebud agar bisa dipulihkan jika ponsel hilang.',
    backup_consent_confirm: 'Unggah data saya',
    backup_consent_decline: 'Nanti saja',
    data_sharing_title: 'Berbagi data',
    data_sharing_subtitle: 'Siapa yang dapat melihat catatan petani Anda',
    data_sharing_settings_body:
      'Lihat siapa yang dapat mengakses petak dan bukti Anda, setujui permintaan, atau cabut akses.',
    data_sharing_manage: 'Kelola berbagi data',
    data_sharing_intro:
      'Anda yang memutuskan organisasi mana yang boleh menggunakan catatan Tracebud Anda. Koperasi dan pembeli hanya mengakses setelah Anda menyetujui di Tracebud. Anda dapat mencabut akses di masa depan kapan saja; data yang sudah terkait batch atau pengiriman yang dijual tetap tersedia untuk kepatuhan. Importir dapat menyimpannya hingga 5 tahun sesuai aturan UE.',
    data_sharing_eudr_note:
      'Deklarasi EUDR (deforestasi, FPIC, tenaga kerja) adalah pernyataan terpisah untuk aturan pasar UE — bukan sama dengan berbagi akses di sini.',
    data_sharing_sign_in_required:
      'Masuk untuk melihat dan mengelola siapa yang mengakses data cadangan Anda.',
    data_sharing_load_failed:
      'Tidak dapat memuat pengaturan berbagi. Coba lagi saat online.',
    data_sharing_queue_synced: '{n} pembaruan berbagi terkirim dari antrean offline.',
    data_sharing_queued_offline: 'Disimpan offline — akan disinkronkan saat online.',
    data_sharing_pending: 'Permintaan menunggu',
    data_sharing_active: 'Organisasi dengan akses',
    data_sharing_none_active:
      'Tidak ada organisasi yang memiliki akses saat ini. Data Anda tetap di perangkat ini sampai Anda mencadangkan dan menyetujui permintaan.',
    data_sharing_status_pending: 'Menunggu',
    data_sharing_status_active: 'Aktif',
    data_sharing_can_see: 'Dapat melihat: {scope}',
    data_sharing_scope_identity: 'profil',
    data_sharing_scope_plots: 'petak',
    data_sharing_scope_evidence: 'bukti',
    data_sharing_allow: 'Izinkan',
    data_sharing_deny: 'Tolak',
    data_sharing_revoke: 'Cabut akses di masa depan',
    data_sharing_revoke_title: 'Cabut akses di masa depan?',
    data_sharing_revoke_body:
      'Ini mencegah {org} melihat petak, panen, dan bukti baru Anda. Data yang sudah terkait batch atau pengiriman yang Anda jual tidak dapat ditarik — tetap tersedia untuk kepatuhan. Importir dapat menyimpannya hingga 5 tahun sesuai aturan UE.',
    data_sharing_revoke_confirm: 'Cabut',
    data_sharing_revoke_reason: 'Dicabut oleh petani di aplikasi lapangan',
    data_sharing_unknown_org: 'organisasi ini',
    data_sharing_action_failed: 'Tidak dapat memperbarui pengaturan berbagi.',
    data_sharing_export_title: 'Salinan pribadi Anda',
    data_sharing_export_body:
      'Unduh untuk arsip Anda. Koperasi dan pembeli hanya mengakses setelah Anda menyetujui di Tracebud.',
    data_sharing_export_footnote:
      'Berkas ini hanya cadangan pribadi. Tidak diverifikasi untuk alur koperasi atau pengajuan UE.',
    data_sharing_download_records: 'Unduh untuk arsip saya',
    data_sharing_gdpr_title: 'Minta penghapusan data',
    data_sharing_gdpr_body:
      'Kirim permintaan penghapusan GDPR. Data yang sudah dijual dalam batch atau pengiriman dapat disimpan hingga 5 tahun untuk kepatuhan UE dan tidak dapat ditarik secara retroaktif.',
    data_sharing_gdpr_placeholder: 'Jelaskan singkat mengapa Anda ingin menghapus data akun…',
    data_sharing_gdpr_submit: 'Kirim permintaan penghapusan',
  },
  vi: {
    backup_consent_title: 'Sao lưu lên Tracebud?',
    backup_consent_body:
      '{n} thửa đất trên thiết bị này chưa được sao lưu. Tải lên ranh giới, mùa thu hoạch và siêu dữ liệu bằng chứng lên Tracebud để khôi phục nếu mất điện thoại.',
    backup_consent_confirm: 'Tải dữ liệu của tôi',
    backup_consent_decline: 'Để sau',
    data_sharing_title: 'Chia sẻ dữ liệu',
    data_sharing_subtitle: 'Ai có thể xem hồ sơ nông hộ của bạn',
    data_sharing_settings_body:
      'Xem ai có thể truy cập thửa đất và bằng chứng, phê duyệt yêu cầu hoặc thu hồi quyền truy cập.',
    data_sharing_manage: 'Quản lý chia sẻ',
    data_sharing_intro:
      'Bạn quyết định tổ chức nào được dùng hồ sơ Tracebud. Hợp tác xã và người mua chỉ truy cập sau khi bạn phê duyệt trên Tracebud. Bạn có thể thu hồi quyền truy cập tương lai bất cứ lúc nào; dữ liệu đã gắn với lô hoặc lô hàng đã bán vẫn có sẵn cho tuân thủ. Nhà nhập khẩu có thể lưu tới 5 năm theo quy tắc EU.',
    data_sharing_eudr_note:
      'Khai báo EUDR (phá rừng, FPIC, lao động) là chứng thực riêng cho thị trường EU — không giống chia sẻ quyền truy cập ở đây.',
    data_sharing_sign_in_required:
      'Đăng nhập để xem và quản lý ai truy cập dữ liệu đã sao lưu.',
    data_sharing_load_failed:
      'Không tải được cài đặt chia sẻ. Thử lại khi có mạng.',
    data_sharing_queue_synced: 'Đã gửi {n} cập nhật chia sẻ từ hàng đợi ngoại tuyến.',
    data_sharing_queued_offline: 'Đã lưu ngoại tuyến — sẽ đồng bộ khi có mạng.',
    data_sharing_pending: 'Yêu cầu đang chờ',
    data_sharing_active: 'Tổ chức có quyền truy cập',
    data_sharing_none_active:
      'Hiện không có tổ chức nào có quyền truy cập. Dữ liệu ở trên thiết bị này cho đến khi bạn sao lưu và phê duyệt yêu cầu.',
    data_sharing_status_pending: 'Đang chờ',
    data_sharing_status_active: 'Đang hoạt động',
    data_sharing_can_see: 'Có thể xem: {scope}',
    data_sharing_scope_identity: 'hồ sơ',
    data_sharing_scope_plots: 'thửa đất',
    data_sharing_scope_evidence: 'bằng chứng',
    data_sharing_allow: 'Cho phép',
    data_sharing_deny: 'Từ chối',
    data_sharing_revoke: 'Thu hồi quyền truy cập tương lai',
    data_sharing_revoke_title: 'Thu hồi quyền truy cập tương lai?',
    data_sharing_revoke_body:
      'Điều này ngăn {org} xem thửa đất, thu hoạch và bằng chứng mới. Dữ liệu đã gắn với lô hoặc lô hàng bạn đã bán không thể rút lại — vẫn có sẵn cho tuân thủ. Nhà nhập khẩu có thể lưu tới 5 năm theo quy tắc EU.',
    data_sharing_revoke_confirm: 'Thu hồi',
    data_sharing_revoke_reason: 'Thu hồi bởi nông hộ trong ứng dụng hiện trường',
    data_sharing_unknown_org: 'tổ chức này',
    data_sharing_action_failed: 'Không thể cập nhật cài đặt chia sẻ.',
    data_sharing_export_title: 'Bản sao cá nhân',
    data_sharing_export_body:
      'Tải về cho hồ sơ của bạn. Hợp tác xã và người mua chỉ truy cập sau khi bạn phê duyệt trên Tracebud.',
    data_sharing_export_footnote:
      'Tệp này chỉ là bản sao lưu cá nhân. Không được xác minh cho quy trình hợp tác xã hoặc nộp EU.',
    data_sharing_download_records: 'Tải về cho hồ sơ của tôi',
    data_sharing_gdpr_title: 'Yêu cầu xóa dữ liệu',
    data_sharing_gdpr_body:
      'Gửi yêu cầu xóa GDPR. Dữ liệu đã bán trong lô hoặc lô hàng có thể được lưu tới 5 năm cho tuân thủ EU và không thể rút lại hồi tố.',
    data_sharing_gdpr_placeholder: 'Giải thích ngắn tại sao bạn muốn xóa dữ liệu tài khoản…',
    data_sharing_gdpr_submit: 'Gửi yêu cầu xóa',
  },
  am: {
    backup_consent_title: 'ወደ Tracebud ይጠበቅ?',
    backup_consent_body:
      'በዚህ መሣሪያ ላይ {n} ቦታ(ዎች) ገና አልተጠበቁም። ስልክ ካጡት ለመመለስ የቦታ ገደቦች፣ መከር እና የማስረጃ መረጃዎችን ወደ Tracebud ይስቀሉ።',
    backup_consent_confirm: 'ውሂቤን ስቀል',
    backup_consent_decline: 'አሁን አይደለም',
    data_sharing_title: 'የውሂብ ማጋራት',
    data_sharing_subtitle: 'የእርሻ አምራዮች መዝገቦችዎን ማን ማየት ይችላል',
    data_sharing_settings_body:
      'ቦታዎችዎን እና ማስረጃዎችዎን ማን እንደሚደርስ ይመልከቱ፣ ጥያቄዎችን ያጽድቁ ወይም መዳረሻ ይሰርዙ።',
    data_sharing_manage: 'የውሂብ ማጋራት ያስተዳድሩ',
    data_sharing_intro:
      'የ Tracebud መዝገቦችዎን የሚጠቀሙ ድርጅቶችን እርስዎ ይወስናሉ። ኮኦፐሬቲቮች እና ገዢዎች በ Tracebud ከፈቀዱ በኋላ ብቻ ይደርሳሉ። የወደፊት መዳረሻ በማንኛውም ጊዜ ሊሰርዙት ይችላሉ — ነገር ግን ከተሸጡ ቦታዎች ወይም ላኪዎች ጋር የተያያዙ ውሂቦች ለተገዢነት ይቆያሉ። አስመጪዎች እስከ 5 ዓመት ሊያቆዩ ይችላሉ።',
    data_sharing_eudr_note:
      'የ EUDR ቦታ መግለጫዎች (ደን ማጥፋት፣ FPIC፣ ሠራተኛ) ለ EU ገበያ ህጎች የተለዩ ማረጋገጫዎች ናቸው — እዚህ የመዳረሻ ማጋራት አይደለም።',
    data_sharing_sign_in_required:
      'የተጠበቁ ውሂቦችዎን ማን እንደሚደርስ ለማየት እና ለማስተዳደር ይግቡ።',
    data_sharing_load_failed:
      'የማጋራት ቅንብሮችን ማስገባት አልተሳካም። በመስመር ላይ እንደገና ይሞክሩ።',
    data_sharing_queue_synced: '{n} የማጋራት ዝመና(ዎች) ከኦፍላይን ተራ ወደ አገልጋይ ተልኳል።',
    data_sharing_queued_offline: 'ኦፍላይን ተቀምጧል — በመስመር ላይ ሲሆኑ ይመሳሰላል።',
    data_sharing_pending: 'በመጠባበቅ ላይ ያሉ ጥያቄዎች',
    data_sharing_active: 'መዳረሻ ያላቸው ድርጅቶች',
    data_sharing_none_active:
      'አሁን ምንም ድርጅት መዳረሻ የለውም። ውሂብዎ በዚህ መሣሪያ ላይ ይቆያል እስከ መጠበቅ እና ጥያቄ ማጽደቅ ድረስ።',
    data_sharing_status_pending: 'በመጠባበቅ ላይ',
    data_sharing_status_active: 'ንቁ',
    data_sharing_can_see: 'ማየት ይችላል፡ {scope}',
    data_sharing_scope_identity: 'መገለጫ',
    data_sharing_scope_plots: 'ቦታዎች',
    data_sharing_scope_evidence: 'ማስረጃ',
    data_sharing_allow: 'ፍቀድ',
    data_sharing_deny: 'አትፍቀድ',
    data_sharing_revoke: 'የወደፊት መዳረሻ ሰርዝ',
    data_sharing_revoke_title: 'የወደፊት መዳረሻ ይሰረዝ?',
    data_sharing_revoke_body:
      '{org} አዲስ ቦታዎችዎን፣ መከሮችዎን እና ማስረጃዎችዎን እንዳያይ ይከለክላል። ከተሸጡ ቦታዎች ወይም ላኪዎች ጋር የተያያዙ ውሂቦች ሊወጡ አይችሉም — ለተገዢነት ይቆያሉ። አስመጪዎች እስከ 5 ዓመት ሊያቆዩ ይችላሉ።',
    data_sharing_revoke_confirm: 'ሰርዝ',
    data_sharing_revoke_reason: 'በመስክ መተግበሪያ በእርሻ አምራይ ተሰርዟል',
    data_sharing_unknown_org: 'ይህ ድርጅት',
    data_sharing_action_failed: 'የማጋራት ቅንብሮችን ማዘመን አልተሳካም።',
    data_sharing_export_title: 'የግል ቅጂዎ',
    data_sharing_export_body:
      'ለመዝገብዎ ያውርዱ። ኮኦፐሬቲቮች እና ገዢዎች በ Tracebud ከፈቀዱ በኋላ ብቻ ይደርሳሉ።',
    data_sharing_export_footnote:
      'ይህ ፋይል የግል ቅጂ ብቻ ነው። ለኮኦፐሬቲቭ ሂደቶች ወይም EU ማስረከብ አልተረጋገጠም።',
    data_sharing_download_records: 'ለመዝገቤ ያውርዱ',
    data_sharing_gdpr_title: 'የውሂብ ማጥፋት ጠይቅ',
    data_sharing_gdpr_body:
      'የ GDPR ማጥፋት ጥያቄ ያስገቡ። በቦታዎች ወይም ላኪዎች የተሸጡ ውሂቦች ለ EU ተገዢነት እስከ 5 ዓመት ሊቆዩ ይችላሉ እና በኋላ ሊወጡ አይችሉም።',
    data_sharing_gdpr_placeholder: 'የመለያ ውሂብ ለምን እንደሚሰርዙ በአጭሩ ይግለጹ…',
    data_sharing_gdpr_submit: 'የማጥፋት ጥያቄ ላክ',
  },
};

const allPatches = { ...patches, ...asiaAfricaPatches };

for (const [locale, strings] of Object.entries(allPatches)) {
  const path = resolve(messagesDir, `${locale}.json`);
  const data = JSON.parse(readFileSync(path, 'utf8'));
  let count = 0;
  for (const [key, value] of Object.entries(strings)) {
    data[key] = value;
    count += 1;
  }
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`${locale}.json — patched ${count} consent/sharing strings`);
}
