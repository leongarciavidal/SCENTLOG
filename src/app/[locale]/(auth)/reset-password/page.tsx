import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { buttonClasses } from "@/components/ui/Button";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { getCurrentProfile } from "@/features/auth/session";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/reset-password">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Auth.reset" });
  return { title: t("metaTitle"), robots: { index: false } };
}

/**
 * Reached from the reset email (the /auth/confirm route signs the user in
 * first) or from Settings while signed in.
 */
export default async function ResetPasswordPage({ params }: PageProps<"/[locale]/reset-password">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Auth.reset");
  const profile = await getCurrentProfile();

  return (
    <AuthShell eyebrow={t("eyebrow")} title={t("title")}>
      {profile ? (
        <ResetPasswordForm profileHref={`/${profile.username}`} />
      ) : (
        <div className="flex flex-col items-start gap-6">
          <p className="leading-relaxed text-paper-muted">{t("noSession")}</p>
          <Link href="/forgot-password" className={buttonClasses("secondary")}>
            {t("requestNew")}
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
