import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthShell } from "@/features/auth/components/AuthShell";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/forgot-password">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Auth.forgot" });
  return { title: t("metaTitle"), robots: { index: false } };
}

export default async function ForgotPasswordPage({
  params,
}: PageProps<"/[locale]/forgot-password">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Auth.forgot");

  return (
    <AuthShell
      eyebrow={t("eyebrow")}
      title={t("title")}
      intro={t("body")}
      footer={
        <Link href="/login" className="link-underline text-paper">
          {t("back")}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
