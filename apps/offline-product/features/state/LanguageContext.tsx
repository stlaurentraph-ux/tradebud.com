import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getSetting, initDatabase, setSetting } from '@/features/state/persistence';

export type SupportedLanguage = 'en' | 'es';

const LANG_STORAGE_KEY = 'tracebudAppLanguage';

type LanguageContextValue = {
  lang: SupportedLanguage;
  setLang: (lang: SupportedLanguage) => void;
  /** Translate key; optional `{var}` placeholders in strings are replaced from `vars`. */
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const strings: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Legacy / shared
    home_title: 'Tracebud Offline',
    home_intro:
      'Walk the coffee plot and save its boundary offline. Later, sync to Tracebud for compliance checks.',
    farmer_identity: 'Farmer identity',
    farmer_id_label: 'Farmer ID (IHCAFE or temporary)',
    farmer_id_placeholder: 'Type farmer ID',
    farmer_name_label: 'Farmer name (optional)',
    farmer_name_placeholder: 'Type farmer name',
    farmer_uuid_hint:
      'Farmer ID must be a UUID from your Tracebud backend user, e.g. 550e8400-e29b-41d4-a716-446655440000.',
    producer_profile_card_title: 'Producer profile',
    simplified_declaration_postal_label: 'Postal / mailing address (optional)',
    simplified_declaration_postal_ph: 'Village, municipality, department — for simplified declaration',
    simplified_declaration_geo_label: 'Declaration location (optional)',
    simplified_declaration_geo_body:
      'For micro/small operators you may anchor the simplified declaration with a single GPS fix (six-decimal WGS84) instead of or in addition to a postal address.',
    simplified_declaration_capture_gps: 'Save current GPS for declaration',
    simplified_declaration_clear_gps: 'Clear GPS',
    simplified_declaration_location_denied: 'Location permission is required to save a declaration GPS point.',
    simplified_declaration_location_failed: 'Could not read GPS position.',
    settings_declaration_geo_label: 'Declaration GPS (simplified)',
    commodity_primary_label: 'Primary commodity',
    commodity_coffee: 'Coffee',
    commodity_cocoa: 'Cocoa',
    commodity_rubber: 'Rubber',
    commodity_soy: 'Soy',
    commodity_timber: 'Timber',
    producer_profile_error_title: 'Producer profile',
    producer_profile_error_uuid: 'Enter a valid farmer UUID before continuing.',
    producer_profile_missing_farmer: 'Farmer profile is missing. Go back and complete producer profile first.',
    vertex_avg_60s: 'Add averaged vertex (60s)',
    vertex_avg_120s: 'Add averaged vertex (120s)',
    settings_postal_label: 'Declaration address',
    settings_commodity_label: 'Primary commodity',
    settings_vertex_avg_title: 'Vertex averaging (GNSS)',
    settings_vertex_avg_body:
      'Default sampling window when adding an averaged vertex on the map (EUDR GIS, vertex averaging). You can still pick the other duration per vertex.',
    settings_vertex_60: '60 seconds',
    settings_vertex_120: '120 seconds',
    harvest_yield_indicative_hint:
      'Indicative cap for this plot (~{kgPerHa} kg/ha × {ha} ha): ≈ {max} kg. Tracebud server validates; adjust if your agronomy differs.',
    harvest_yield_exceeds_cap_title: 'Weight above indicative cap',
    harvest_yield_exceeds_cap_body:
      'This delivery ({kg} kg) exceeds the indicative cap (≈ {max} kg at {kgPerHa} kg/ha for this plot). Continue only if the weight is correct.',
    harvest_record_anyway: 'Record anyway',
    declaration_audit_section: 'Declaration & audit',
    declaration_audit_body:
      'Export a JSON snapshot of producer data and plot counts for your records, or send the same snapshot to the Tracebud audit log when signed in.',
    declaration_export_json: 'Export declaration JSON',
    declaration_sync_server: 'Send snapshot to Tracebud audit',
    declaration_export_no_farmer: 'Set up a producer profile in Register plot first.',
    declaration_sync_need_signin: 'Sign in under Your profile with your Tracebud email and password.',
    declaration_sync_failed: 'Could not write audit event.',
    declaration_sync_ok_title: 'Sent',
    declaration_sync_ok_body: 'Declaration snapshot was added to the server audit log.',
    declaration_button_accept: 'Accept self-declaration',
    declaration_button_accepted: 'Declaration accepted',
    declaration_text:
      'I declare that no forest was cleared on this plot after 31 Dec 2020.',
    save_farmer: 'Save farmer & continue',
    farmer_set: 'Farmer set',
    walk_title: 'Walk the perimeter',
    walk_help:
      'Walk around the plot with this device to record its boundary. Keep the phone visible to the sky.',
    start_walking: 'Start walking',
    stop: 'Stop',
    reset: 'Reset',
    save_plot: 'Save plot',
    no_farmer: 'No farmer selected yet.',
    my_plots: 'My plots',
    synced_plots: 'Synced plots (backend)',
    record_harvest_title: 'Record harvest (creates voucher)',
    kg_delivered: 'Kg delivered',
    vouchers_title: 'My vouchers',
    dds_title: 'DDS packages',
    recent_activity: 'Recent activity',
    backend_issue_title: 'Backend sync issue',
    fpic_title: 'FPIC & labor',
    fpic_label: 'Land is not in use without Free, Prior and Informed Consent (FPIC).',
    labor_no_child: 'No child labor on this plot.',
    labor_no_forced: 'No forced labor or trafficking on this plot.',

    // Tabs
    tab_home: 'Home',
    tab_my_plots: 'My Plots',
    tab_harvests: 'Harvests',
    tab_settings: 'Settings',

    // Common UI
    back: 'Back',
    online: 'Online',
    offline: 'Offline',
    cancel: 'Cancel',
    delete: 'Delete',
    warning: 'Warning',
    farmer_fallback: 'Farmer',
    language: 'Language',

    // Home
    home_subtitle: 'Farmer Field App',
    welcome_back: 'Welcome back,',
    plots_stat: 'Plots',
    compliant_stat: 'Compliant',
    pending_stat: 'Pending',
    getting_started_title: 'Getting started checklist',
    getting_started_body: 'Follow these steps once when setting up the app for a new farmer.',
    checklist_backend: 'Connect backend account in Settings.',
    checklist_farmer: 'Ensure a farmer profile is selected.',
    checklist_plot: 'Register the first plot by walking the perimeter.',
    open_settings: 'Open settings',
    record_a_plot: 'Record a plot',
    register_plot_tile: 'Register Plot',
    walk_perimeter_sub: 'Walk perimeter',
    log_harvest_tile: 'Log Harvest',
    record_delivery_sub: 'Record delivery',
    documents_tile: 'Documents',
    land_permits_sub: 'Land & permits',
    my_vouchers_tile: 'My Vouchers',
    compliance_qr_sub: 'Compliance QR',
    action_required: 'Action Required',
    home_action_plot_photos:
      'Plot “{name}” needs ground-truth photos to complete compliance verification.',
    complete_now: 'Complete Now',
    sync_status: 'Sync Status',
    pending_count: '{n} pending',
    last_sync_pending: 'Last sync: pending uploads',
    last_sync_now: 'Last sync: just now',
    backend_unreachable: 'Backend unreachable',

    // My plots (explore prototype)
    my_plots_header: 'My Plots',
    register_new_plot: 'Register New Plot',
    rename_plot_title: 'Rename plot',
    rename_plot_label: 'Plot name',
    rename_plot_save: 'Save',
    rename_plot_empty: 'Enter a name for this plot.',
    plot_edit_title: 'Edit plot',
    plot_edit_declared_label: 'Declared area (hectares)',
    plot_edit_declared_hint: 'Optional. If GPS area is shown, declared must be within 5% of it.',
    plot_edit_declared_discrepancy: 'Declared area differs from GPS by more than 5%.',
    plot_edit_redo_boundary: 'Redo boundary on map',
    plot_geometry_error_title: 'Invalid GPS data',
    plot_geometry_error_body: 'Coordinates could not be prepared for upload.',
    plot_boundary_required_title: 'Boundary required',
    plot_boundary_required_body:
      'Plots of 4 hectares or more need a walked perimeter with at least three GPS points.',
    plot_rename_backend_reason: 'Plot name updated from plot details in the app',
    plot_rename_local_only: 'Renamed on this device. Server copy could not be updated.',
    photos_meta: '{n} photos',
    harvests_meta: '{n} harvests',
    ha_suffix: 'ha',
    delete_plot_title: 'Warning',
    delete_plot_body:
      'Are you sure you want to delete your plot? All info and harvest related to it will be deleted.',
    status_compliant: 'Compliant',
    status_action_needed: 'Action Needed',

    // Harvests
    harvest_header_log: 'Log Harvest',
    harvest_header_weight: 'Record Weight',
    harvest_header_select: 'Select Plot',
    harvest_header_logged: 'Harvest Logged',
    harvest_logged_title: 'Harvest Logged!',
    harvest_logged_body: 'Digital receipt generated and saved locally.',
    harvest_share_qr: 'Share this QR with your buyer',
    log_another_harvest: 'Log Another Harvest',
    back_to_home: 'Back to Home',
    weight_kg_title: 'Weight (kg)',
    enter_weight_ph: 'Enter weight',
    plot_capacity: '{name} capacity',
    kg_remaining: '{n} kg remaining',
    max_yield_line: 'Max yield (1,500 kg/ha)',
    kg_total: '{n} kg total',
    record_delivery: 'Record Delivery',
    select_plot_harvest: 'Select the plot for this harvest:',
    no_synced_plots: 'No synced plots yet. Go to My Plots and sync first.',
    available_capacity: 'Available capacity: {n} kg',
    plot_fallback: 'Plot',
    log_harvest_card_title: 'Log a Harvest Delivery',
    log_harvest_card_sub: 'Record weight and generate a compliance receipt for your buyer.',
    start_new_harvest: 'Start New Harvest Log',
    recent_deliveries: 'Recent Deliveries',
    no_deliveries: 'No deliveries yet.',
    status_synced: 'Synced',
    status_pending: 'Pending',
    harvest_recorded_msg: 'Harvest recorded and voucher created.',
    harvest_plot_local_badge: 'Local — sync under My Plots to record online',


    // Settings
    settings_title: 'Settings',
    your_profile: 'Your profile',
    change_photo: 'Change photo',
    label_your_name: 'Your name',
    ph_your_name: 'Your name',
    ph_complete_home: 'Complete Home setup first',
    save_name: 'Save name',
    farmer_region: 'Farmer · Honduras',
    tracebud_account: 'Tracebud account',
    sign_in_sync_plots: 'Sign in to sync plots',
    signed_in_as: 'Signed in as',
    plot_sync_note: 'Plot sync uses this account. Sign out to use a different one.',
    sign_in_sub: 'Use the same email and password as your Tracebud account. Saved only on this device.',
    label_email: 'Email',
    label_password: 'Password',
    sign_in: 'Sign in',
    sign_out_device: 'Sign out on this device',
    sync_status_section: 'Sync Status',
    up_to_date: 'Up to date',
    sync_now: 'Sync Now',
    settings_api_base: 'API base URL',
    settings_api_url_hint:
      'On a phone or tablet, use your computer’s LAN address (e.g. http://192.168.1.10:4000/api), not localhost. Set EXPO_PUBLIC_API_URL and restart Expo.',
    sync_backend_ok: 'Backend connection OK.',
    sync_no_farmer_profile: 'No farmer profile on this device. Complete Home setup first.',
    sync_plots_none: 'No local plot boundaries to upload.',
    sync_session_expired_short: 'Session expired. Sign in again under Your profile.',
    sync_plots_fetch_failed: 'Could not reach Tracebud API while checking plots.',
    sync_plots_already_synced: 'All plot boundaries are already on the server.',
    sync_plots_uploaded_all: 'Uploaded {uploaded} of {total} missing plot(s) to the server.',
    sync_plots_partial: 'Plots: uploaded {uploaded} of {total} ({failed} failed).',
    sync_queue_fetch_failed:
      'Could not load server plots — pending harvests, photos, or documents were not sent.',
    sync_queue_sent: 'Sent {n} pending item(s) (harvests, photos, or documents).',
    sync_queue_dropped_invalid: 'Removed {n} invalid queue entry(ies).',
    sync_queue_failed_remain: '{n} queue item(s) failed — check connection and try again.',
    local_storage: 'Local Storage',
    mb_used: '{used} MB / {total} MB used',
    need_help: 'Need Help?',
    contact_us: 'Contact us',
    contact_us_btn: 'Contact Us',
    enter_email_password: 'Enter your Tracebud email and password.',
    signed_out_device: 'Signed out on this device.',
    perm_library_title: 'Permission needed',
    perm_library_body: 'Allow photo library access to set your profile picture.',
    perm_camera_title: 'Permission needed',
    perm_camera_body: 'Allow camera access to take a profile picture.',
    profile_title: 'Profile',
    finish_home_first: 'Finish setup on the Home tab first.',
    finish_home_photo:
      'Finish setup on the Home tab first — then you can add a profile photo here.',
    profile_photo_title: 'Profile photo',
    profile_photo_body: 'Update your profile picture',
    photo_library: 'Photo library',
    take_photo: 'Take photo',
    remove_photo: 'Remove photo',
    profile_edit: 'Edit',
    profile_save: 'Save',
    profile_email_none: 'Not signed in',
    profile_no_name: 'No name yet',

    // Plot detail
    plot_detail_fallback: 'Plot',
    plot_not_found: 'Plot not found',
    plot_hectares: '{n} hectares',
    plot_hectares_gps: 'GPS — {n} ha',
    plot_hectares_declared: 'Declared — {n} ha',
    plot_status_title: 'Status',
    plot_status_subtitle: 'What remains for compliance on this plot',
    plot_status_remaining_hint: 'Tap an item to open the section you need.',
    plot_status_ground: 'Ground-truth photos ({current}/{min})',
    plot_status_ground_hint:
      'Open Photo Vault and capture one photo per direction (North, East, South, West).',
    plot_status_land: 'Land title & tenure evidence',
    plot_status_land_hint: 'Upload cadastral or municipal documents in Land Documents.',
    plot_status_fpic: 'FPIC documentation (indigenous overlap)',
    plot_status_fpic_hint: 'Upload FPIC repository proof for overlapping indigenous territory.',
    plot_status_permit: 'Protected-area permit',
    plot_status_permit_hint: 'Upload a permit or management plan for protected-area overlap.',
    plot_status_sync: 'Plot on Tracebud server',
    plot_status_sync_hint: 'Sign in and sync from My Plots so this plot exists online.',
    plot_status_all_done: 'All checklist items complete for now.',
    plot_status_n_open: '{n} open',
    tap_to_open: 'Tap to open',
    plot_status_item_done: 'Done',
    voucher_share: 'Share',
    voucher_share_title: 'Compliance voucher',
    voucher_share_message:
      'Tracebud compliance voucher\nCode: {code}\nVerify (scan):\n{payload}',
    voucher_share_failed: 'Sharing could not be opened. Try again.',
    voucher_share_loading: '…',
  },
  es: {
    home_title: 'Tracebud sin conexión',
    home_intro:
      'Camina el cafetal y guarda el límite de la parcela sin conexión. Luego sincroniza con Tracebud para las verificaciones.',
    farmer_identity: 'Identidad del productor',
    farmer_id_label: 'ID IHCAFE (o ID temporal)',
    farmer_id_placeholder: 'Escribe el ID del productor',
    farmer_name_label: 'Nombre del productor (opcional)',
    farmer_name_placeholder: 'Escribe el nombre del productor',
    farmer_uuid_hint:
      'El ID de productor debe ser un UUID del usuario en el servidor Tracebud, p. ej. 550e8400-e29b-41d4-a716-446655440000.',
    producer_profile_card_title: 'Perfil del productor',
    simplified_declaration_postal_label: 'Dirección postal (opcional)',
    simplified_declaration_postal_ph: 'Aldea, municipio, departamento — para declaración simplificada',
    simplified_declaration_geo_label: 'Ubicación en declaración (opcional)',
    simplified_declaration_geo_body:
      'Para micro/pequeños operadores puede anclar la declaración simplificada con un punto GPS (WGS84 a seis decimales) además o en lugar de la dirección postal.',
    simplified_declaration_capture_gps: 'Guardar GPS actual para declaración',
    simplified_declaration_clear_gps: 'Quitar GPS',
    simplified_declaration_location_denied: 'Se necesita permiso de ubicación para guardar el punto GPS de declaración.',
    simplified_declaration_location_failed: 'No se pudo leer la posición GPS.',
    settings_declaration_geo_label: 'GPS de declaración (simplificada)',
    commodity_primary_label: 'Producto principal',
    commodity_coffee: 'Café',
    commodity_cocoa: 'Cacao',
    commodity_rubber: 'Caucho',
    commodity_soy: 'Soja',
    commodity_timber: 'Madera',
    producer_profile_error_title: 'Perfil del productor',
    producer_profile_error_uuid: 'Introduce un UUID de productor válido antes de continuar.',
    producer_profile_missing_farmer: 'Falta el perfil de productor. Vuelve atrás y complétalo.',
    vertex_avg_60s: 'Añadir vértice promedio (60s)',
    vertex_avg_120s: 'Añadir vértice promedio (120s)',
    settings_postal_label: 'Dirección en declaración',
    settings_commodity_label: 'Producto principal',
    settings_vertex_avg_title: 'Promedio de vértices (GNSS)',
    settings_vertex_avg_body:
      'Ventana de muestreo por defecto al añadir un vértice promediado en el mapa (EUDR GIS, promedio de vértices). Aún puede elegir la otra duración por vértice.',
    settings_vertex_60: '60 segundos',
    settings_vertex_120: '120 segundos',
    harvest_yield_indicative_hint:
      'Tope indicativo para esta parcela (~{kgPerHa} kg/ha × {ha} ha): ≈ {max} kg. El servidor Tracebud valida; ajústelo si su agronomía difiere.',
    harvest_yield_exceeds_cap_title: 'Peso por encima del tope indicativo',
    harvest_yield_exceeds_cap_body:
      'Esta entrega ({kg} kg) supera el tope indicativo (≈ {max} kg a {kgPerHa} kg/ha en esta parcela). Continúe solo si el peso es correcto.',
    harvest_record_anyway: 'Registrar de todos modos',
    declaration_audit_section: 'Declaración y auditoría',
    declaration_audit_body:
      'Exporta un JSON con datos del productor y recuento de parcelas, o envía la misma instantánea al registro de auditoría de Tracebud si has iniciado sesión.',
    declaration_export_json: 'Exportar JSON de declaración',
    declaration_sync_server: 'Enviar instantánea a auditoría Tracebud',
    declaration_export_no_farmer: 'Primero configura el perfil de productor en Registrar parcela.',
    declaration_sync_need_signin: 'Inicia sesión en Tu perfil con correo y contraseña Tracebud.',
    declaration_sync_failed: 'No se pudo registrar el evento de auditoría.',
    declaration_sync_ok_title: 'Enviado',
    declaration_sync_ok_body: 'La instantánea de declaración se añadió al registro de auditoría del servidor.',
    declaration_button_accept: 'Aceptar autodeclaración',
    declaration_button_accepted: 'Autodeclaración aceptada',
    declaration_text:
      'Declaro que no se desmontó bosque en esta parcela después del 31 de diciembre de 2020.',
    save_farmer: 'Guardar productor y continuar',
    farmer_set: 'Productor guardado',
    walk_title: 'Camina el perímetro',
    walk_help:
      'Camina alrededor de la parcela con este teléfono para registrar el límite. Mantén el teléfono con vista al cielo.',
    start_walking: 'Empezar recorrido',
    stop: 'Detener',
    reset: 'Reiniciar',
    save_plot: 'Guardar parcela',
    no_farmer: 'Todavía no hay productor seleccionado.',
    my_plots: 'Mis parcelas',
    synced_plots: 'Parcelas sincronizadas (servidor)',
    record_harvest_title: 'Registrar entrega (crea vale)',
    kg_delivered: 'Kg entregados',
    vouchers_title: 'Mis vales',
    dds_title: 'Paquetes DDS',
    recent_activity: 'Actividad reciente',
    backend_issue_title: 'Problema al sincronizar con el servidor',
    fpic_title: 'Consentimiento y trabajo',
    fpic_label:
      'La tierra no se usa sin Consentimiento Libre, Previo e Informado (CLPI/FPIC).',
    labor_no_child: 'No hay trabajo infantil en esta parcela.',
    labor_no_forced: 'No hay trabajo forzoso ni trata de personas en esta parcela.',

    tab_home: 'Inicio',
    tab_my_plots: 'Mis parcelas',
    tab_harvests: 'Cosechas',
    tab_settings: 'Ajustes',

    back: 'Atrás',
    online: 'En línea',
    offline: 'Sin conexión',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    warning: 'Advertencia',
    farmer_fallback: 'Productor',
    language: 'Idioma',

    home_subtitle: 'App de campo',
    welcome_back: 'Bienvenido,',
    plots_stat: 'Parcelas',
    compliant_stat: 'Conforme',
    pending_stat: 'Pendiente',
    getting_started_title: 'Lista para empezar',
    getting_started_body: 'Sigue estos pasos al configurar la app para un nuevo productor.',
    checklist_backend: 'Conecta la cuenta del servidor en Ajustes.',
    checklist_farmer: 'Asegúrate de tener un perfil de productor.',
    checklist_plot: 'Registra la primera parcela caminando el perímetro.',
    open_settings: 'Abrir ajustes',
    record_a_plot: 'Registrar parcela',
    register_plot_tile: 'Registrar parcela',
    walk_perimeter_sub: 'Caminar perímetro',
    log_harvest_tile: 'Registrar cosecha',
    record_delivery_sub: 'Registrar entrega',
    documents_tile: 'Documentos',
    land_permits_sub: 'Tierra y permisos',
    my_vouchers_tile: 'Mis vales',
    compliance_qr_sub: 'QR de cumplimiento',
    action_required: 'Acción requerida',
    home_action_plot_photos:
      'La parcela «{name}» necesita fotos de verificación en campo para completar el cumplimiento.',
    complete_now: 'Completar ahora',
    sync_status: 'Estado de sincronización',
    pending_count: '{n} pendientes',
    last_sync_pending: 'Última sync: cargas pendientes',
    last_sync_now: 'Última sync: ahora',
    backend_unreachable: 'Servidor no disponible',

    my_plots_header: 'Mis parcelas',
    register_new_plot: 'Registrar nueva parcela',
    rename_plot_title: 'Renombrar parcela',
    rename_plot_label: 'Nombre de la parcela',
    rename_plot_save: 'Guardar',
    rename_plot_empty: 'Escribe un nombre para esta parcela.',
    plot_edit_title: 'Editar parcela',
    plot_edit_declared_label: 'Superficie declarada (hectáreas)',
    plot_edit_declared_hint: 'Opcional. Si hay área GPS, la declarada debe estar dentro del 5%.',
    plot_edit_declared_discrepancy: 'La superficie declarada difiere del GPS en más del 5%.',
    plot_edit_redo_boundary: 'Volver a trazar en el mapa',
    plot_geometry_error_title: 'Datos GPS no válidos',
    plot_geometry_error_body: 'No se pudieron preparar las coordenadas para subirlas.',
    plot_boundary_required_title: 'Se necesita perímetro',
    plot_boundary_required_body:
      'Las parcelas de 4 hectáreas o más requieren un perímetro caminado con al menos tres puntos GPS.',
    plot_rename_backend_reason: 'Nombre de parcela actualizado desde el detalle en la app',
    plot_rename_local_only: 'Renombrado en este dispositivo. No se pudo actualizar la copia en el servidor.',
    photos_meta: '{n} fotos',
    harvests_meta: '{n} cosechas',
    ha_suffix: 'ha',
    delete_plot_title: 'Advertencia',
    delete_plot_body:
      '¿Seguro que quieres eliminar esta parcela? Se borrará toda la información y cosechas relacionadas.',
    status_compliant: 'Conforme',
    status_action_needed: 'Acción necesaria',

    harvest_header_log: 'Registrar cosecha',
    harvest_header_weight: 'Registrar peso',
    harvest_header_select: 'Elegir parcela',
    harvest_header_logged: 'Cosecha registrada',
    harvest_logged_title: '¡Cosecha registrada!',
    harvest_logged_body: 'Recibo digital generado y guardado en el dispositivo.',
    harvest_share_qr: 'Comparte este QR con tu comprador',
    log_another_harvest: 'Registrar otra cosecha',
    back_to_home: 'Volver al inicio',
    weight_kg_title: 'Peso (kg)',
    enter_weight_ph: 'Ingresa el peso',
    plot_capacity: 'Capacidad de {name}',
    kg_remaining: '{n} kg disponibles',
    max_yield_line: 'Rendimiento máx. (1.500 kg/ha)',
    kg_total: '{n} kg en total',
    record_delivery: 'Registrar entrega',
    select_plot_harvest: 'Selecciona la parcela para esta cosecha:',
    no_synced_plots: 'Aún no hay parcelas sincronizadas. Ve a Mis parcelas y sincroniza.',
    available_capacity: 'Capacidad disponible: {n} kg',
    plot_fallback: 'Parcela',
    log_harvest_card_title: 'Registrar entrega de cosecha',
    log_harvest_card_sub: 'Registra el peso y genera un comprobante de cumplimiento para tu comprador.',
    start_new_harvest: 'Nuevo registro de cosecha',
    recent_deliveries: 'Entregas recientes',
    no_deliveries: 'Aún no hay entregas.',
    status_synced: 'Sincronizado',
    status_pending: 'Pendiente',
    harvest_recorded_msg: 'Cosecha registrada y vale creado.',
    harvest_plot_local_badge: 'Local — sincroniza en Mis parcelas para registrar en línea',


    settings_title: 'Ajustes',
    your_profile: 'Tu perfil',
    change_photo: 'Cambiar foto',
    label_your_name: 'Tu nombre',
    ph_your_name: 'Tu nombre',
    ph_complete_home: 'Primero completa el inicio',
    save_name: 'Guardar nombre',
    farmer_region: 'Productor · Honduras',
    tracebud_account: 'Cuenta Tracebud',
    sign_in_sync_plots: 'Inicia sesión para sincronizar parcelas',
    signed_in_as: 'Sesión iniciada como',
    plot_sync_note: 'La sincronización usa esta cuenta. Cierra sesión para usar otra.',
    sign_in_sub: 'Usa el mismo correo y contraseña que en Tracebud. Solo se guardan en este dispositivo.',
    label_email: 'Correo',
    label_password: 'Contraseña',
    sign_in: 'Iniciar sesión',
    sign_out_device: 'Cerrar sesión en este dispositivo',
    sync_status_section: 'Estado de sincronización',
    up_to_date: 'Al día',
    sync_now: 'Sincronizar ahora',
    settings_api_base: 'URL base de la API',
    settings_api_url_hint:
      'En teléfono o tablet usa la IP local de tu ordenador (p. ej. http://192.168.1.10:4000/api), no localhost. Define EXPO_PUBLIC_API_URL y reinicia Expo.',
    sync_backend_ok: 'Conexión con el servidor correcta.',
    sync_no_farmer_profile: 'No hay perfil de productor en este dispositivo. Completa el inicio en Inicio.',
    sync_plots_none: 'No hay límites de parcela locales para subir.',
    sync_session_expired_short: 'Sesión caducada. Vuelve a iniciar sesión en Tu perfil.',
    sync_plots_fetch_failed: 'No se pudo contactar la API de Tracebud al revisar parcelas.',
    sync_plots_already_synced: 'Todos los límites de parcela ya están en el servidor.',
    sync_plots_uploaded_all: 'Subidos {uploaded} de {total} parcela(s) faltante(s) al servidor.',
    sync_plots_partial: 'Parcelas: subidas {uploaded} de {total} ({failed} fallaron).',
    sync_queue_fetch_failed:
      'No se pudieron cargar las parcelas del servidor — no se enviaron cosechas, fotos ni documentos pendientes.',
    sync_queue_sent: 'Enviados {n} elemento(s) pendiente(s) (cosechas, fotos o documentos).',
    sync_queue_dropped_invalid: 'Eliminadas {n} entrada(s) inválida(s) de la cola.',
    sync_queue_failed_remain: '{n} elemento(s) de la cola fallaron — revisa la conexión e inténtalo de nuevo.',
    local_storage: 'Almacenamiento local',
    mb_used: '{used} MB / {total} MB usados',
    need_help: '¿Necesitas ayuda?',
    contact_us: 'Contáctanos',
    contact_us_btn: 'Contáctanos',
    enter_email_password: 'Ingresa correo y contraseña de Tracebud.',
    signed_out_device: 'Sesión cerrada en este dispositivo.',
    perm_library_title: 'Permiso necesario',
    perm_library_body: 'Permite acceso a la galería para tu foto de perfil.',
    perm_camera_title: 'Permiso necesario',
    perm_camera_body: 'Permite acceso a la cámara para tomar la foto de perfil.',
    profile_title: 'Perfil',
    finish_home_first: 'Primero completa la configuración en Inicio.',
    finish_home_photo:
      'Primero completa la configuración en Inicio — luego podrás añadir la foto de perfil aquí.',
    profile_photo_title: 'Foto de perfil',
    profile_photo_body: 'Actualiza tu foto de perfil',
    photo_library: 'Galería',
    take_photo: 'Tomar foto',
    remove_photo: 'Quitar foto',
    profile_edit: 'Editar',
    profile_save: 'Guardar',
    profile_email_none: 'Sin sesión',
    profile_no_name: 'Sin nombre',

    plot_detail_fallback: 'Parcela',
    plot_not_found: 'Parcela no encontrada',
    plot_hectares: '{n} hectáreas',
    plot_hectares_gps: 'GPS — {n} ha',
    plot_hectares_declared: 'Declarado — {n} ha',
    plot_status_title: 'Estado',
    plot_status_subtitle: 'Qué falta para el cumplimiento en esta parcela',
    plot_status_remaining_hint: 'Toca un elemento para abrir la sección correspondiente.',
    plot_status_ground: 'Fotos de verificación en campo ({current}/{min})',
    plot_status_ground_hint:
      'Abre Bóveda de fotos y captura una por dirección (Norte, Este, Sur, Oeste).',
    plot_status_land: 'Título de tierra y evidencia de tenencia',
    plot_status_land_hint: 'Sube catastro o constancia municipal en Documentos de tierra.',
    plot_status_fpic: 'Documentación FPIC (superposición indígena)',
    plot_status_fpic_hint: 'Sube prueba de repositorio FPIC por territorio indígena superpuesto.',
    plot_status_permit: 'Permiso de área protegida',
    plot_status_permit_hint: 'Sube permiso o plan de manejo por superposición con área protegida.',
    plot_status_sync: 'Parcela en el servidor Tracebud',
    plot_status_sync_hint: 'Inicia sesión y sincroniza desde Mis parcelas para que exista en línea.',
    plot_status_all_done: 'Todos los puntos del checklist están completos por ahora.',
    plot_status_n_open: '{n} pendiente(s)',
    tap_to_open: 'Toca para abrir',
    plot_status_item_done: 'Hecho',
    voucher_share: 'Compartir',
    voucher_share_title: 'Vale de cumplimiento',
    voucher_share_message:
      'Vale Tracebud\nCódigo: {code}\nVerificar (escanear):\n{payload}',
    voucher_share_failed: 'No se pudo abrir compartir. Inténtalo de nuevo.',
    voucher_share_loading: '…',
  },
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    let cancelled = false;
    initDatabase()
      .then(() => getSetting(LANG_STORAGE_KEY))
      .then((v) => {
        if (cancelled) return;
        if (v === 'en' || v === 'es') setLangState(v);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const setLang = useCallback((next: SupportedLanguage) => {
    setLangState(next);
    setSetting(LANG_STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let s = strings[lang][key] ?? strings.en[key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return s;
    },
    [lang],
  );

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t,
    }),
    [lang, setLang, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
