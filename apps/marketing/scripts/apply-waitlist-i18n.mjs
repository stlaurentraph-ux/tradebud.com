#!/usr/bin/env node
/**
 * Force-overwrites waitlist / FAQ keys that must not claim active pilots.
 * Locale patches win; missing locales fall back to en marketing values.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, "../messages");

const locales = ["en", "fr", "es", "pt", "id", "vi", "de", "nl", "it", "am", "no"];

function deepAssign(target, source) {
  if (source === null || typeof source !== "object" || Array.isArray(source)) {
    return source;
  }
  const result = { ...target };
  for (const key of Object.keys(source)) {
    result[key] = deepAssign(result[key] ?? {}, source[key]);
  }
  return result;
}

const enMessages = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"));
const enPatch = {
  common: {
    joinWaitlist: enMessages.common.joinWaitlist,
  },
  marketing: {
    exitIntentModal: enMessages.marketing.exitIntentModal,
    waitlistDialog: enMessages.marketing.waitlistDialog,
    thankYou: enMessages.marketing.thankYou,
    finalCtaSection: enMessages.marketing.finalCtaSection,
    earlyAdopters: enMessages.marketing.earlyAdopters,
  },
  footer: enMessages.footer,
  faq: enMessages.faq,
};

const localePatches = {
  fr: {
    common: { joinWaitlist: "Rejoindre la liste d'attente" },
    marketing: {
      exitIntentModal: {
        headline: "Commencez à construire la traçabilité pour votre réseau.",
        description:
          "Rejoignez la liste d'attente pour un accès anticipé lorsque Tracebud ouvrira dans votre région et pour votre produit.",
        cta: { primary: "Rejoindre la liste d'attente", secondary: "Continuer la navigation" },
        note: "Pas de spam. Désinscription possible à tout moment.",
      },
      waitlistDialog: {
        headline: "Rejoindre la liste d'attente",
        description:
          "Parlez-nous de votre réseau et nous vous contacterons lorsque Tracebud sera prêt pour vous.",
        submit: "Rejoindre la liste d'attente",
        success: {
          title: "Vous êtes inscrit",
          description: "Nous examinons chaque demande personnellement et vous répondrons par e-mail.",
        },
      },
      thankYou: {
        timeline: {
          accessDescription:
            "Les membres de la liste d'attente obtiennent un accès prioritaire à mesure que nous ouvrons de nouvelles régions et produits.",
        },
      },
      earlyAdopters: "Rejoignez la liste d'attente pour un accès anticipé",
    },
    footer: {
      waitlistPrompt: "Prêt à rejoindre la liste d'attente ?",
      waitlistSubline: "Soyez informé en premier lorsque Tracebud ouvrira pour votre réseau.",
      joinWaitlist: "Rejoindre maintenant",
    },
    faq: {
      whenLaunch: "Quand puis-je commencer à utiliser Tracebud ?",
      whenLaunchAnswer:
        "Tracebud s'ouvre par phases selon la région et le produit. Rejoignez la liste d'attente et nous vous écrirons lorsque votre cas d'usage sera pris en charge.",
      whyCommoditiesAnswer:
        "Le café en premier, puis les six autres produits EUDR : cacao, huile de palme, caoutchouc, soja, bétail et bois. Consultez notre page tarifs pour la feuille de route complète.",
      howCostAnswer:
        "Gratuit pour les producteurs. Coopératives, exportateurs et acheteurs paient selon la taille du réseau et l'utilisation. Consultez la page tarifs ou rejoignez la liste d'attente pour les détails.",
      howLongAnswer:
        "Les producteurs peuvent commencer à cartographier avec l'application hors ligne dès maintenant. La plupart des coopératives importent leur réseau et envoient la première demande en une semaine.",
      supportAnswer:
        "Chaque membre de la liste d'attente reçoit un suivi personnel par e-mail. Une fois intégré, vous avez un accès direct à notre équipe pour la configuration et les questions de conformité.",
    },
  },
  es: {
    common: { joinWaitlist: "Unirse a la lista de espera" },
    marketing: {
      exitIntentModal: {
        headline: "Empieza a construir trazabilidad para tu red.",
        description:
          "Únete a la lista de espera para acceso anticipado cuando Tracebud abra en tu región y producto.",
        cta: { primary: "Unirse a la lista de espera", secondary: "Seguir navegando" },
        note: "Sin spam. Cancela cuando quieras.",
      },
      waitlistDialog: {
        headline: "Unirse a la lista de espera",
        description: "Cuéntanos sobre tu red y te contactaremos cuando Tracebud esté listo para ti.",
        submit: "Unirse a la lista de espera",
        success: {
          title: "Estás en la lista",
          description: "Revisamos cada solicitud personalmente y te responderemos por correo.",
        },
      },
      earlyAdopters: "Únete a la lista de espera para acceso anticipado",
    },
    footer: {
      waitlistPrompt: "¿Listo para unirte a la lista de espera?",
      waitlistSubline: "Sé el primero en saber cuando Tracebud abra para tu red.",
      joinWaitlist: "Unirse ahora",
    },
    faq: {
      whenLaunch: "¿Cuándo puedo empezar a usar Tracebud?",
      whenLaunchAnswer:
        "Tracebud se abre por fases según región y producto. Únete a la lista de espera y te avisaremos cuando tu caso esté soportado.",
      whyCommoditiesAnswer:
        "Café primero, luego los otros seis productos EUDR: cacao, aceite de palma, caucho, soja, ganado y madera. Consulta nuestra página de precios para la hoja de ruta completa.",
      howCostAnswer:
        "Gratis para productores. Cooperativas, exportadores y compradores pagan según el tamaño de la red y el uso. Visita la página de precios o únete a la lista de espera.",
      howLongAnswer:
        "Los productores pueden empezar a mapear con la app offline de inmediato. La mayoría de cooperativas suben su red y envían la primera solicitud en una semana.",
      supportAnswer:
        "Cada miembro de la lista recibe seguimiento personal por correo. Una vez integrado, tienes acceso directo a nuestro equipo para configuración y cumplimiento.",
    },
  },
  pt: {
    common: { joinWaitlist: "Entrar na lista de espera" },
    marketing: {
      exitIntentModal: {
        headline: "Comece a construir rastreabilidade para a sua rede.",
        description:
          "Entre na lista de espera para acesso antecipado quando o Tracebud abrir na sua região e commodity.",
        cta: { primary: "Entrar na lista de espera", secondary: "Continuar a navegar" },
        note: "Sem spam. Cancele quando quiser.",
      },
      waitlistDialog: {
        headline: "Entrar na lista de espera",
        description: "Conte-nos sobre a sua rede e entraremos em contacto quando o Tracebud estiver pronto.",
        submit: "Entrar na lista de espera",
        success: {
          title: "Está na lista",
          description: "Analisamos cada pedido pessoalmente e respondemos por e-mail.",
        },
      },
      earlyAdopters: "Entre na lista de espera para acesso antecipado",
    },
    footer: {
      waitlistPrompt: "Pronto para entrar na lista de espera?",
      waitlistSubline: "Seja o primeiro a saber quando o Tracebud abrir para a sua rede.",
      joinWaitlist: "Entrar agora",
    },
    faq: {
      whenLaunch: "Quando posso começar a usar o Tracebud?",
      whenLaunchAnswer:
        "O Tracebud abre por fases, por região e commodity. Entre na lista de espera e avisaremos quando o seu caso for suportado.",
      whyCommoditiesAnswer:
        "Café primeiro, depois as outras seis commodities EUDR: cacau, óleo de palma, borracha, soja, gado e madeira. Veja a página de preços para o roadmap completo.",
      howCostAnswer:
        "Grátis para produtores. Cooperativas, exportadores e compradores pagam conforme o tamanho da rede e uso. Visite preços ou entre na lista de espera.",
      howLongAnswer:
        "Produtores podem começar a mapear com a app offline imediatamente. A maioria das cooperativas carrega a rede e envia o primeiro pedido numa semana.",
      supportAnswer:
        "Cada membro da lista recebe acompanhamento pessoal por e-mail. Após integração, tem acesso direto à nossa equipa para configuração e conformidade.",
    },
  },
  de: {
    common: { joinWaitlist: "Zur Warteliste" },
    marketing: {
      exitIntentModal: {
        headline: "Bauen Sie Rückverfolgbarkeit für Ihr Netzwerk auf.",
        description:
          "Treten Sie der Warteliste bei für frühen Zugang, wenn Tracebud in Ihrer Region und Ware verfügbar ist.",
        cta: { primary: "Zur Warteliste", secondary: "Weiter stöbern" },
        note: "Kein Spam. Jederzeit abmelden.",
      },
      waitlistDialog: {
        headline: "Zur Warteliste",
        description: "Erzählen Sie uns von Ihrem Netzwerk — wir melden uns, wenn Tracebud bereit ist.",
        submit: "Zur Warteliste",
        success: {
          title: "Sie stehen auf der Liste",
          description: "Wir prüfen jede Anfrage persönlich und melden uns per E-Mail.",
        },
      },
      earlyAdopters: "Zur Warteliste für frühen Zugang",
    },
    footer: {
      waitlistPrompt: "Bereit für die Warteliste?",
      waitlistSubline: "Erfahren Sie zuerst, wenn Tracebud für Ihr Netzwerk öffnet.",
      joinWaitlist: "Jetzt beitreten",
    },
    faq: {
      whenLaunch: "Wann kann ich Tracebud nutzen?",
      whenLaunchAnswer:
        "Tracebud öffnet schrittweise nach Region und Ware. Treten Sie der Warteliste bei — wir mailen, wenn Ihr Anwendungsfall unterstützt wird.",
      whyCommoditiesAnswer:
        "Zuerst Kaffee, dann die anderen sechs EUDR-Waren: Kakao, Palmöl, Kautschuk, Soja, Rinder und Holz. Siehe Preisseite für die Roadmap.",
      howCostAnswer:
        "Kostenlos für Produzenten. Genossenschaften, Exporteure und Käufer zahlen nach Netzwerkgröße und Nutzung. Preisseite oder Warteliste für Details.",
      howLongAnswer:
        "Produzenten können sofort mit der Offline-App kartieren. Die meisten Genossenschaften laden ihr Netzwerk hoch und senden die erste Anfrage innerhalb einer Woche.",
      supportAnswer:
        "Jedes Wartelisten-Mitglied erhält persönliche E-Mail-Nachverfolgung. Nach dem Onboarding direkter Zugang zu unserem Team für Setup und Compliance.",
    },
  },
  nl: {
    common: { joinWaitlist: "Op de wachtlijst" },
    marketing: {
      exitIntentModal: {
        headline: "Begin met traceerbaarheid voor uw netwerk.",
        description:
          "Sluit u aan bij de wachtlijst voor vroege toegang wanneer Tracebud opent in uw regio en commodity.",
        cta: { primary: "Op de wachtlijst", secondary: "Verder browsen" },
        note: "Geen spam. Altijd uitschrijven.",
      },
      waitlistDialog: {
        headline: "Op de wachtlijst",
        description: "Vertel ons over uw netwerk — we nemen contact op wanneer Tracebud klaar is.",
        submit: "Op de wachtlijst",
        success: {
          title: "U staat op de lijst",
          description: "We beoordelen elke aanvraag persoonlijk en volgen per e-mail op.",
        },
      },
      earlyAdopters: "Op de wachtlijst voor vroege toegang",
    },
    footer: {
      waitlistPrompt: "Klaar om u aan te sluiten?",
      waitlistSubline: "Wees als eerste op de hoogte wanneer Tracebud opent voor uw netwerk.",
      joinWaitlist: "Nu aanmelden",
    },
    faq: {
      whenLaunch: "Wanneer kan ik Tracebud gebruiken?",
      whenLaunchAnswer:
        "Tracebud opent gefaseerd per regio en commodity. Sluit u aan bij de wachtlijst — we mailen wanneer uw use case wordt ondersteund.",
      whyCommoditiesAnswer:
        "Eerst koffie, daarna de andere zes EUDR-grondstoffen: cacao, palmolie, rubber, soja, vee en hout. Zie onze prijspagina voor de volledige roadmap.",
      howCostAnswer:
        "Gratis voor producenten. Coöperaties, exporteurs en kopers betalen op basis van netwerkgrootte en gebruik. Prijspagina of wachtlijst voor details.",
      howLongAnswer:
        "Producenten kunnen meteen beginnen met kaarteren in de offline app. De meeste coöperaties uploaden hun netwerk en sturen binnen een week het eerste verzoek.",
      supportAnswer:
        "Elk wachtlijstlid krijgt persoonlijke opvolging per e-mail. Na onboarding directe toegang tot ons team voor setup en compliance.",
    },
  },
  it: {
    common: { joinWaitlist: "Unisciti alla lista d'attesa" },
    marketing: {
      exitIntentModal: {
        headline: "Inizia a costruire la tracciabilità per la tua rete.",
        description:
          "Unisciti alla lista d'attesa per l'accesso anticipato quando Tracebud aprirà nella tua regione e commodity.",
        cta: { primary: "Unisciti alla lista d'attesa", secondary: "Continua a navigare" },
        note: "Niente spam. Disiscriviti quando vuoi.",
      },
      waitlistDialog: {
        headline: "Unisciti alla lista d'attesa",
        description: "Raccontaci della tua rete — ti contatteremo quando Tracebud sarà pronto.",
        submit: "Unisciti alla lista d'attesa",
        success: {
          title: "Sei in lista",
          description: "Esaminiamo ogni richiesta personalmente e rispondiamo via email.",
        },
      },
      earlyAdopters: "Unisciti alla lista d'attesa per accesso anticipato",
    },
    footer: {
      waitlistPrompt: "Pronto a unirti alla lista d'attesa?",
      waitlistSubline: "Sii il primo a sapere quando Tracebud aprirà per la tua rete.",
      joinWaitlist: "Unisciti ora",
    },
    faq: {
      whenLaunch: "Quando posso iniziare a usare Tracebud?",
      whenLaunchAnswer:
        "Tracebud apre per fasi per regione e commodity. Unisciti alla lista d'attesa e ti scriveremo quando il tuo caso sarà supportato.",
      whyCommoditiesAnswer:
        "Prima il caffè, poi le altre sei commodity EUDR: cacao, olio di palma, gomma, soia, bestiame e legno. Vedi la pagina prezzi per la roadmap completa.",
      howCostAnswer:
        "Gratuito per i produttori. Cooperative, esportatori e acquirenti pagano in base alla dimensione della rete e all'utilizzo. Pagina prezzi o lista d'attesa per i dettagli.",
      howLongAnswer:
        "I produttori possono iniziare subito a mappare con l'app offline. La maggior parte delle cooperative carica la rete e invia la prima richiesta entro una settimana.",
      supportAnswer:
        "Ogni membro della lista riceve un follow-up personale via email. Dopo l'onboarding, accesso diretto al nostro team per setup e conformità.",
    },
  },
  id: {
    common: { joinWaitlist: "Gabung daftar tunggu" },
    marketing: {
      exitIntentModal: {
        headline: "Mulai bangun traceability untuk jaringan Anda.",
        description:
          "Gabung daftar tunggu untuk akses awal saat Tracebud dibuka di wilayah dan komoditas Anda.",
        cta: { primary: "Gabung daftar tunggu", secondary: "Lanjutkan browsing" },
        note: "Tanpa spam. Berhenti berlangganan kapan saja.",
      },
      waitlistDialog: {
        headline: "Gabung daftar tunggu",
        description: "Ceritakan tentang jaringan Anda — kami akan menghubungi saat Tracebud siap.",
        submit: "Gabung daftar tunggu",
        success: {
          title: "Anda terdaftar",
          description: "Kami meninjau setiap permohonan secara personal dan akan follow-up via email.",
        },
      },
      earlyAdopters: "Gabung daftar tunggu untuk akses awal",
    },
    footer: {
      waitlistPrompt: "Siap gabung daftar tunggu?",
      waitlistSubline: "Jadilah yang pertama tahu saat Tracebud dibuka untuk jaringan Anda.",
      joinWaitlist: "Gabung sekarang",
    },
    faq: {
      whenLaunch: "Kapan saya bisa mulai menggunakan Tracebud?",
      whenLaunchAnswer:
        "Tracebud dibuka bertahap per wilayah dan komoditas. Gabung daftar tunggu dan kami akan email saat use case Anda didukung.",
      whyCommoditiesAnswer:
        "Kopi dulu, lalu enam komoditas EUDR lainnya: kakao, minyak kelapa sawit, karet, kedelai, sapi, dan kayu. Lihat halaman harga untuk roadmap lengkap.",
      howCostAnswer:
        "Gratis untuk produsen. Koperasi, eksportir, dan pembeli membayar berdasarkan ukuran jaringan dan penggunaan. Halaman harga atau daftar tunggu untuk detail.",
      howLongAnswer:
        "Produsen bisa langsung mulai memetakan dengan app offline. Sebagian besar koperasi mengunggah jaringan dan mengirim permintaan pertama dalam seminggu.",
      supportAnswer:
        "Setiap anggota daftar tunggu mendapat follow-up personal via email. Setelah onboarding, akses langsung ke tim kami untuk setup dan kepatuhan.",
    },
  },
  vi: {
    common: { joinWaitlist: "Tham gia danh sách chờ" },
    marketing: {
      exitIntentModal: {
        headline: "Bắt đầu xây dựng truy xuất nguồn gốc cho mạng lưới của bạn.",
        description:
          "Tham gia danh sách chờ để được truy cập sớm khi Tracebud mở ở khu vực và hàng hóa của bạn.",
        cta: { primary: "Tham gia danh sách chờ", secondary: "Tiếp tục duyệt" },
        note: "Không spam. Hủy đăng ký bất cứ lúc nào.",
      },
      waitlistDialog: {
        headline: "Tham gia danh sách chờ",
        description: "Cho chúng tôi biết về mạng lưới của bạn — chúng tôi sẽ liên hệ khi Tracebud sẵn sàng.",
        submit: "Tham gia danh sách chờ",
        success: {
          title: "Bạn đã trong danh sách",
          description: "Chúng tôi xem xét từng đơn cá nhân và sẽ phản hồi qua email.",
        },
      },
      earlyAdopters: "Tham gia danh sách chờ để truy cập sớm",
    },
    footer: {
      waitlistPrompt: "Sẵn sàng tham gia danh sách chờ?",
      waitlistSubline: "Hãy là người đầu tiên biết khi Tracebud mở cho mạng lưới của bạn.",
      joinWaitlist: "Tham gia ngay",
    },
    faq: {
      whenLaunch: "Khi nào tôi có thể bắt đầu dùng Tracebud?",
      whenLaunchAnswer:
        "Tracebud mở theo từng giai đoạn theo khu vực và hàng hóa. Tham gia danh sách chờ và chúng tôi sẽ email khi use case của bạn được hỗ trợ.",
      whyCommoditiesAnswer:
        "Cà phê trước, sau đó sáu hàng hóa EUDR khác: ca cao, dầu cọ, cao su, đậu nành, gia súc và gỗ. Xem trang giá để biết lộ trình đầy đủ.",
      howCostAnswer:
        "Miễn phí cho nông dân. Hợp tác xã, nhà xuất khẩu và người mua trả theo quy mô mạng lưới và mức sử dụng. Trang giá hoặc danh sách chờ để biết chi tiết.",
      howLongAnswer:
        "Nông dân có thể bắt đầu lập bản đồ ngay với app offline. Hầu hết hợp tác xã tải mạng lưới và gửi yêu cầu đầu tiên trong một tuần.",
      supportAnswer:
        "Mỗi thành viên danh sách chờ được follow-up cá nhân qua email. Sau onboarding, truy cập trực tiếp đội ngũ của chúng tôi cho setup và tuân thủ.",
    },
  },
  no: {
    common: { joinWaitlist: "Bli med på ventelisten" },
    marketing: {
      exitIntentModal: {
        headline: "Begynn å bygge sporbarhet for nettverket ditt.",
        description:
          "Bli med på ventelisten for tidlig tilgang når Tracebud åpner i din region og råvare.",
        cta: { primary: "Bli med på ventelisten", secondary: "Fortsett å bla" },
        note: "Ingen spam. Avslutt abonnement når som helst.",
      },
      waitlistDialog: {
        headline: "Bli med på ventelisten",
        description: "Fortell oss om nettverket ditt — vi tar kontakt når Tracebud er klart.",
        submit: "Bli med på ventelisten",
        success: {
          title: "Du står på listen",
          description: "Vi vurderer hver forespørsel personlig og følger opp på e-post.",
        },
      },
      earlyAdopters: "Bli med på ventelisten for tidlig tilgang",
    },
    footer: {
      waitlistPrompt: "Klar for ventelisten?",
      waitlistSubline: "Vær først ute når Tracebud åpner for nettverket ditt.",
      joinWaitlist: "Bli med nå",
    },
    faq: {
      whenLaunch: "Når kan jeg begynne å bruke Tracebud?",
      whenLaunchAnswer:
        "Tracebud åpner i faser etter region og råvare. Bli med på ventelisten — vi sender e-post når use casen din støttes.",
      whyCommoditiesAnswer:
        "Kaffe først, deretter de andre seks EUDR-varene: kakao, palmeolje, gummi, soya, storfe og tre. Se prissiden for full roadmap.",
      howCostAnswer:
        "Gratis for produsenter. Kooperativer, eksportører og kjøpere betaler etter nettverksstørrelse og bruk. Prisside eller venteliste for detaljer.",
      howLongAnswer:
        "Produsenter kan begynne å kartlegge med offline-appen med en gang. De fleste kooperativer laster opp nettverket og sender første forespørsel innen en uke.",
      supportAnswer:
        "Hvert ventelistemedlem får personlig oppfølging på e-post. Etter onboarding har du direkte tilgang til teamet vårt for oppsett og compliance.",
    },
  },
  am: {
    common: { joinWaitlist: "Join the waitlist" },
    marketing: {
      earlyAdopters: "Join the waitlist for early access",
    },
  },
};

for (const locale of locales) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  const messages = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const patch = deepAssign(enPatch, localePatches[locale] ?? {});
  messages.common = deepAssign(messages.common ?? {}, patch.common ?? {});
  messages.marketing = deepAssign(messages.marketing ?? {}, patch.marketing ?? {});
  messages.footer = deepAssign(messages.footer ?? {}, patch.footer ?? {});
  messages.faq = deepAssign(messages.faq ?? {}, patch.faq ?? {});
  fs.writeFileSync(filePath, `${JSON.stringify(messages, null, 2)}\n`);
  console.log(`Applied waitlist copy: ${locale}.json`);
}
