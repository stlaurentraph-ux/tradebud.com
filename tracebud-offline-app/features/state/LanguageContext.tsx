import { createContext, ReactNode, useContext, useState } from 'react';

export type SupportedLanguage = 'en' | 'es';

type LanguageContextValue = {
  lang: SupportedLanguage;
  setLang: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
};

const strings: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    home_title: 'Tracebud Offline',
    home_intro:
      'Walk the coffee plot and save its boundary offline. Later, sync to Tracebud for compliance checks.',
    farmer_identity: 'Farmer identity',
    farmer_id_label: 'Farmer ID (IHCAFE or temporary)',
    farmer_id_placeholder: 'Type farmer ID',
    farmer_name_label: 'Farmer name (optional)',
    farmer_name_placeholder: 'Type farmer name',
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
  },
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<SupportedLanguage>('en');

  const t = (key: string) => strings[lang][key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}

