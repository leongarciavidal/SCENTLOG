import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { getCurrentProfile, requireUser } from "@/features/auth/session";
import { AvatarUploader } from "@/features/profiles/components/AvatarUploader";
import { ProfileForm } from "@/features/profiles/components/ProfileForm";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings/profile">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Settings" });
  return { title: t("metaTitle"), robots: { index: false } };
}

export default async function SettingsProfilePage({
  params,
}: PageProps<"/[locale]/settings/profile">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const user = await requireUser(locale, `/${locale}/settings/profile`);
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Profile not found for signed-in user");

  const t = await getTranslations("Settings");

  return (
    <Container className="py-16 sm:py-24">
      <div className="max-w-2xl">
        <header className="mb-14 flex flex-col gap-6 border-b border-line pb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4">
            <p className="eyebrow text-moss-bright">{t("eyebrow")}</p>
            <h1 className="font-serif text-5xl leading-none sm:text-6xl">{t("title")}</h1>
          </div>
          <Link href={`/${profile.username}`} className="link-underline text-sm text-paper-muted">
            {t("viewProfile")}
          </Link>
        </header>

        <div className="flex flex-col gap-14">
          <AvatarUploader
            initialUrl={profile.avatar_url}
            name={profile.display_name || profile.username}
          />

          <ProfileForm
            initial={{
              username: profile.username,
              display_name: profile.display_name ?? "",
              bio: profile.bio ?? "",
              locale: profile.locale,
            }}
          />

          <section className="flex flex-col gap-5 border-t border-line pt-10">
            <h2 className="eyebrow text-paper">{t("topFour")}</h2>
            <Link href="/settings/favorites" className={buttonClasses("secondary", "self-start")}>
              {t("editTopFour")}
            </Link>
          </section>

          <section className="flex flex-col gap-5 border-t border-line pt-10">
            <h2 className="eyebrow text-paper">{t("security")}</h2>
            {user.email ? (
              <p className="text-sm text-paper-muted">{t("email", { email: user.email })}</p>
            ) : null}
            <Link href="/reset-password" className={buttonClasses("secondary", "self-start")}>
              {t("changePassword")}
            </Link>
          </section>
        </div>
      </div>
    </Container>
  );
}
