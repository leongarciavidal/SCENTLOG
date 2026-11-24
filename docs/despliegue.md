# Guía de publicación de SCENTLOG

Pasos para publicar SCENTLOG en internet con tu propio dominio. Hazlos en orden y no pases al siguiente hasta terminar el anterior.

> ⚠️ Nunca pegues contraseñas ni claves secretas en un chat, en GitHub ni en el código. Solo van en los paneles de Supabase, Vercel o Resend.

---

## 0. Antes de empezar: checklist

- [ ] Tienes un **dominio** (por ejemplo `scentlog.es`). Puedes comprarlo en Cloudflare, Namecheap, DonDominio o similares (unos 10–20 €/año).
- [ ] Has revisado los **textos legales** (`/privacy`, `/terms`, `/cookies`). Son una buena base, pero conviene que los revise un profesional para tu caso.
- [ ] Sabes qué datos legales vas a mostrar: nombre o empresa, NIF, dirección postal y email de contacto.

---

## 1. Supabase (la base de datos)

Usaremos el proyecto que ya tienes (`qazyhjlwjsiydquqqczr`).

### 1.1 Comprobar que la base de datos está al día

En la carpeta del proyecto, en tu ordenador:

```bash
git pull
```

```bash
npx supabase db push --remote
```

### 1.2 Direcciones permitidas

En el panel de Supabase, ve a **Authentication → URL Configuration**:

- **Site URL**: `https://tudominio.es`
- **Redirect URLs**: añade `https://tudominio.es/**`. Si quieres seguir probando en tu ordenador, deja también `http://localhost:3000/**`.

### 1.3 Emails propios (obligatorio para el público)

El servicio de email gratuito de Supabase tiene un límite muy bajo y puede que solo envíe a direcciones del equipo. Para que los emails lleguen a cualquier usuario, usa **Resend** (tiene plan gratuito):

1. Crea una cuenta en **resend.com**.
2. En **Domains**, añade tu dominio y copia los registros DNS que te indica en el panel de tu registrador de dominios. Espera a que aparezca como **Verified**.
3. En **API Keys**, crea una clave. Cópiala solo para el paso siguiente, sin guardarla en ningún archivo.
4. En Supabase, ve a **Project Settings → Authentication → SMTP Settings** y activa **Enable custom SMTP**:
   - Sender email: `hola@tudominio.es`
   - Sender name: `SCENTLOG`
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: la clave de Resend
5. Guarda.

### 1.4 Plantillas de email con la imagen de SCENTLOG

En **Authentication → Email Templates**:

- **Confirm signup**: pega el contenido de `supabase/templates/confirmation.html`. Asunto: `Confirm your SCENTLOG account · Confirma tu cuenta`.
- **Reset password**: pega `supabase/templates/recovery.html`. Asunto: `Reset your SCENTLOG password · Restablece tu contraseña`.

Los emails salen en español o en inglés según el idioma con el que se registró cada persona.

### 1.5 Ajustes de seguridad recomendados

En **Authentication → Providers → Email**: deja activado **Confirm email** y pon la longitud mínima de contraseña en **8**.

---

## 2. Vercel (donde vive la web)

1. Crea una cuenta en **vercel.com** usando **Continue with GitHub**.
2. Pulsa **Add New → Project** e importa el repositorio `SCENTLOG`.
3. Antes de pulsar Deploy, abre **Environment Variables** y añade:

| Nombre                                 | Valor                                                  |
| -------------------------------------- | ------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | `https://qazyhjlwjsiydquqqczr.supabase.co`             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | tu clave `sb_publishable_…` (la misma de `.env.local`) |
| `NEXT_PUBLIC_SITE_URL`                 | `https://tudominio.es`                                 |
| `NEXT_PUBLIC_LEGAL_OWNER`              | tu nombre o el de tu empresa                           |
| `NEXT_PUBLIC_LEGAL_TAX_ID`             | tu NIF/CIF                                             |
| `NEXT_PUBLIC_LEGAL_ADDRESS`            | dirección postal                                       |
| `NEXT_PUBLIC_CONTACT_EMAIL`            | email de contacto                                      |
| `NEXT_PUBLIC_LEGAL_JURISDICTION`       | por ejemplo `España` (o `Spain`)                       |

> La clave **secreta** de Supabase (`sb_secret_…`) **no** se añade. La web no la necesita.

4. Pulsa **Deploy** y espera 1–2 minutos.
5. En **Settings → Domains**, añade `tudominio.es` y sigue las instrucciones de DNS en tu registrador.

---

## 3. Después de publicar: comprobaciones

- [ ] La web carga en `https://tudominio.es` con el candado de HTTPS.
- [ ] Puedes crear una cuenta con un email que no sea el tuyo y el email de confirmación llega (revisa también la carpeta de spam).
- [ ] Funciona "¿Has olvidado tu contraseña?".
- [ ] Las páginas legales muestran tus datos y no los corchetes `[…]`.
- [ ] Te haces administrador desde el **SQL Editor** de Supabase:

```sql
update public.profiles set is_admin = true where username = 'tu_usuario';
```

- [ ] Registra la web en **Google Search Console** e indica el mapa del sitio: `https://tudominio.es/sitemap.xml`.

---

## 4. Mantenimiento

- **Copias de seguridad**: el plan gratuito de Supabase no incluye copias diarias. Antes de tener muchos usuarios, valora el plan Pro.
- **Cambios en el código**: cada vez que se suba código a GitHub (rama `main`), Vercel publica la nueva versión automáticamente.
- **Cambios en la base de datos**: tras cada `git pull` con migraciones nuevas, ejecuta `npx supabase db push --remote`.
