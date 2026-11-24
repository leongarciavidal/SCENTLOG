import { legalConfig as c } from "./config";

export type LegalDoc = "privacy" | "terms" | "cookies";
type Section = { heading: string; body: string[] };
type Document = { title: string; intro: string; sections: Section[] };

/*
 * Plain-language legal texts written for the EU (GDPR / ePrivacy).
 * They are a solid starting point, not legal advice: have them reviewed for
 * your specific situation before launch.
 */
const en: Record<LegalDoc, Document> = {
  privacy: {
    title: "Privacy policy",
    intro:
      "This policy explains what personal data SCENTLOG collects, why, and the rights you have over it.",
    sections: [
      {
        heading: "Who is responsible",
        body: [
          `The data controller is ${c.owner} (${c.taxId}), ${c.address}. Contact: ${c.email}.`,
        ],
      },
      {
        heading: "What we collect",
        body: [
          "Account data: email address, username and password (stored only as a secure hash by our authentication provider).",
          "Profile data you choose to add: display name, biography, photo and preferred language.",
          "Content you create: diary entries, ratings, notes, reviews, comments, lists, likes and follows.",
          "Technical data needed to run the service: session cookies, IP address and basic request logs kept by our hosting providers for security.",
          "We do not use advertising or analytics trackers.",
        ],
      },
      {
        heading: "Why we use it (legal bases)",
        body: [
          "To provide the service you signed up for: your account, diary, reviews and social features (performance of a contract, GDPR art. 6.1.b).",
          "To keep the service secure and prevent spam and abuse (legitimate interest, art. 6.1.f).",
          "To send account emails such as confirmation and password recovery (performance of a contract).",
        ],
      },
      {
        heading: "What is public",
        body: [
          "Your username, display name, biography, photo, public diary entries, reviews, comments, public lists, likes and follows are visible to anyone. Diary entries and lists you mark as private are visible only to you.",
        ],
      },
      {
        heading: "Who processes data for us",
        body: [
          "Supabase (database, authentication and file storage), Vercel (website hosting) and our email delivery provider. They act as processors under data processing agreements. Where data leaves the European Economic Area, transfers are covered by the European Commission's Standard Contractual Clauses or an adequacy decision.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "As long as your account exists. When you delete your account, your data is removed immediately from the live database and disappears from backups within their retention period (at most 30 days).",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can access, correct, export and delete your data at any time from Settings (“Download my data” and “Delete account”). You can also object to or restrict processing, or contact us at the address above.",
          "You have the right to lodge a complaint with your data protection authority (in Spain, the Agencia Española de Protección de Datos, aepd.es).",
        ],
      },
      { heading: "Minimum age", body: ["SCENTLOG is intended for people aged 16 or over."] },
      {
        heading: "Links to shops",
        body: [
          "Some fragrance pages may include links to third-party shops. If you follow them, the shop's own privacy policy applies on their website.",
        ],
      },
      {
        heading: "Changes",
        body: [
          "We will announce material changes to this policy on the site before they take effect.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of use",
    intro:
      "By creating an account or using SCENTLOG you agree to these terms. Please read them carefully.",
    sections: [
      {
        heading: "The service",
        body: [
          `SCENTLOG is a social diary for fragrance enthusiasts operated by ${c.owner}. It is not a shop: we do not sell fragrances.`,
        ],
      },
      {
        heading: "Your account",
        body: [
          "You must be at least 16, provide accurate information and keep your password safe. One account per person. You are responsible for activity on your account.",
        ],
      },
      {
        heading: "Your content",
        body: [
          "You keep ownership of the reviews, notes, lists, photos and comments you publish. You grant SCENTLOG a free, worldwide, non-exclusive licence to host, display and distribute that content within the service for as long as it is online.",
          "Only upload photos you took yourself or have the right to share.",
        ],
      },
      {
        heading: "What is not allowed",
        body: [
          "Harassment, hate speech, spam, impersonation, illegal content, content that infringes others' rights, and attempts to break or overload the service.",
          "We may remove content or suspend accounts that break these rules. Rate limits apply to protect the community from spam.",
        ],
      },
      {
        heading: "Fragrance information",
        body: [
          "Catalogue information (notes, perfumers, years, descriptions) is provided in good faith but may contain errors. Reviews express their authors' opinions, not ours.",
        ],
      },
      {
        heading: "Affiliate links",
        body: [
          "Some links to shops may be affiliate links: if you buy after following one, we may receive a commission at no extra cost to you. It never affects ratings or reviews.",
        ],
      },
      {
        heading: "Ending your account",
        body: [
          "You can delete your account at any time from Settings. We may close accounts that seriously or repeatedly break these terms.",
        ],
      },
      {
        heading: "Liability",
        body: [
          "The service is provided “as is”. To the extent permitted by law, we are not liable for indirect damages or for content published by users. Nothing in these terms limits rights you have as a consumer.",
        ],
      },
      {
        heading: "Applicable law",
        body: [`These terms are governed by the laws of ${c.jurisdiction}. Contact: ${c.email}.`],
      },
    ],
  },
  cookies: {
    title: "Cookies",
    intro:
      "SCENTLOG only uses the cookies that are strictly necessary for the site to work. We do not use advertising, analytics or tracking cookies.",
    sections: [
      {
        heading: "Cookies we use",
        body: [
          "sb-…-auth-token — keeps you signed in. Set when you sign in, removed when you sign out.",
          "NEXT_LOCALE — remembers your language (English or Spanish). Expires after one year.",
        ],
      },
      {
        heading: "Consent",
        body: [
          "Strictly necessary cookies do not require consent under EU law, so we do not show a cookie banner. If we ever add optional cookies, we will ask for your consent first.",
        ],
      },
      {
        heading: "Third-party sites",
        body: [
          "If you follow a link to a shop, that website may set its own cookies under its own policy.",
        ],
      },
      {
        heading: "Managing cookies",
        body: [
          "You can delete cookies in your browser settings at any time; you will simply be signed out.",
        ],
      },
    ],
  },
};

const es: Record<LegalDoc, Document> = {
  privacy: {
    title: "Política de privacidad",
    intro:
      "Esta política explica qué datos personales recoge SCENTLOG, para qué los usa y qué derechos tienes sobre ellos.",
    sections: [
      {
        heading: "Responsable",
        body: [
          `El responsable del tratamiento es ${c.owner} (${c.taxId}), ${c.address}. Contacto: ${c.email}.`,
        ],
      },
      {
        heading: "Qué datos recogemos",
        body: [
          "Datos de la cuenta: email, nombre de usuario y contraseña (guardada solo como un resumen cifrado por nuestro proveedor de autenticación).",
          "Datos de perfil que decidas añadir: nombre visible, biografía, foto e idioma preferido.",
          "Contenido que creas: entradas del diario, puntuaciones, notas, reseñas, comentarios, listas, likes y seguimientos.",
          "Datos técnicos necesarios para el servicio: cookies de sesión, dirección IP y registros básicos que guardan nuestros proveedores de alojamiento por seguridad.",
          "No usamos rastreadores publicitarios ni de analítica.",
        ],
      },
      {
        heading: "Para qué los usamos (bases legales)",
        body: [
          "Para prestar el servicio que has contratado: tu cuenta, diario, reseñas y funciones sociales (ejecución de un contrato, art. 6.1.b RGPD).",
          "Para mantener el servicio seguro y evitar spam y abusos (interés legítimo, art. 6.1.f).",
          "Para enviarte emails de la cuenta, como la confirmación o la recuperación de contraseña (ejecución de un contrato).",
        ],
      },
      {
        heading: "Qué es público",
        body: [
          "Tu nombre de usuario, nombre visible, biografía, foto, entradas públicas del diario, reseñas, comentarios, listas públicas, likes y seguimientos son visibles para cualquiera. Las entradas y listas que marques como privadas solo las ves tú.",
        ],
      },
      {
        heading: "Quién trata datos por nosotros",
        body: [
          "Supabase (base de datos, autenticación y almacenamiento de archivos), Vercel (alojamiento web) y nuestro proveedor de envío de emails. Actúan como encargados del tratamiento con contratos de tratamiento de datos. Si los datos salen del Espacio Económico Europeo, la transferencia se ampara en las Cláusulas Contractuales Tipo de la Comisión Europea o en una decisión de adecuación.",
        ],
      },
      {
        heading: "Cuánto tiempo los guardamos",
        body: [
          "Mientras exista tu cuenta. Al borrarla, tus datos se eliminan al momento de la base de datos y desaparecen de las copias de seguridad dentro de su plazo de conservación (como máximo 30 días).",
        ],
      },
      {
        heading: "Tus derechos",
        body: [
          "Puedes acceder, rectificar, exportar y suprimir tus datos en cualquier momento desde Ajustes («Descargar mis datos» y «Borrar cuenta»). También puedes oponerte al tratamiento o limitarlo, o escribirnos a la dirección indicada.",
          "Tienes derecho a reclamar ante la autoridad de protección de datos (en España, la Agencia Española de Protección de Datos, aepd.es).",
        ],
      },
      { heading: "Edad mínima", body: ["SCENTLOG está dirigido a personas de 16 años o más."] },
      {
        heading: "Enlaces a tiendas",
        body: [
          "Algunas fichas pueden incluir enlaces a tiendas de terceros. Si los sigues, en su web se aplica su propia política de privacidad.",
        ],
      },
      {
        heading: "Cambios",
        body: [
          "Anunciaremos en la web los cambios importantes de esta política antes de que entren en vigor.",
        ],
      },
    ],
  },
  terms: {
    title: "Términos de uso",
    intro: "Al crear una cuenta o usar SCENTLOG aceptas estos términos. Léelos con atención.",
    sections: [
      {
        heading: "El servicio",
        body: [
          `SCENTLOG es un diario social para amantes de los perfumes gestionado por ${c.owner}. No es una tienda: no vendemos perfumes.`,
        ],
      },
      {
        heading: "Tu cuenta",
        body: [
          "Debes tener al menos 16 años, dar información veraz y proteger tu contraseña. Una cuenta por persona. Eres responsable de la actividad de tu cuenta.",
        ],
      },
      {
        heading: "Tu contenido",
        body: [
          "Sigues siendo el titular de las reseñas, notas, listas, fotos y comentarios que publicas. Concedes a SCENTLOG una licencia gratuita, mundial y no exclusiva para alojar, mostrar y distribuir ese contenido dentro del servicio mientras esté publicado.",
          "Sube solo fotos hechas por ti o que tengas derecho a compartir.",
        ],
      },
      {
        heading: "Qué no está permitido",
        body: [
          "El acoso, el discurso de odio, el spam, la suplantación, el contenido ilegal o que infrinja derechos de terceros, y los intentos de romper o saturar el servicio.",
          "Podemos retirar contenido o suspender cuentas que incumplan estas normas. Se aplican límites de uso para proteger a la comunidad del spam.",
        ],
      },
      {
        heading: "Información de perfumes",
        body: [
          "La información del catálogo (notas, perfumistas, años, descripciones) se ofrece de buena fe pero puede contener errores. Las reseñas expresan la opinión de sus autores, no la nuestra.",
        ],
      },
      {
        heading: "Enlaces de afiliado",
        body: [
          "Algunos enlaces a tiendas pueden ser de afiliado: si compras tras seguir uno, podemos recibir una comisión sin coste extra para ti. Nunca influye en puntuaciones ni reseñas.",
        ],
      },
      {
        heading: "Fin de la cuenta",
        body: [
          "Puedes borrar tu cuenta cuando quieras desde Ajustes. Podemos cerrar cuentas que incumplan estos términos de forma grave o reiterada.",
        ],
      },
      {
        heading: "Responsabilidad",
        body: [
          "El servicio se ofrece «tal cual». En la medida permitida por la ley, no respondemos de daños indirectos ni del contenido publicado por los usuarios. Nada de esto limita tus derechos como consumidor.",
        ],
      },
      {
        heading: "Ley aplicable",
        body: [`Estos términos se rigen por las leyes de ${c.jurisdiction}. Contacto: ${c.email}.`],
      },
    ],
  },
  cookies: {
    title: "Cookies",
    intro:
      "SCENTLOG solo usa las cookies estrictamente necesarias para que la web funcione. No usamos cookies de publicidad, analítica ni seguimiento.",
    sections: [
      {
        heading: "Cookies que usamos",
        body: [
          "sb-…-auth-token: mantiene tu sesión iniciada. Se crea al entrar y se borra al cerrar sesión.",
          "NEXT_LOCALE: recuerda tu idioma (inglés o español). Caduca al cabo de un año.",
        ],
      },
      {
        heading: "Consentimiento",
        body: [
          "Las cookies estrictamente necesarias no requieren consentimiento según la normativa europea, por eso no mostramos un aviso de cookies. Si algún día añadimos cookies opcionales, te pediremos permiso antes.",
        ],
      },
      {
        heading: "Webs de terceros",
        body: [
          "Si sigues un enlace a una tienda, esa web puede usar sus propias cookies según su política.",
        ],
      },
      {
        heading: "Cómo gestionarlas",
        body: [
          "Puedes borrar las cookies desde los ajustes de tu navegador en cualquier momento; simplemente se cerrará tu sesión.",
        ],
      },
    ],
  },
};

export function getLegalDocument(doc: LegalDoc, locale: string): Document {
  return (locale === "es" ? es : en)[doc];
}
