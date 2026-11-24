import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthShell } from "@/features/auth/components/AuthShell";
import { SignUpForm } from "@/features/auth/components/SignUpForm";
import { getCurrentProfile } from "@/features/auth/session";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/signup">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Auth.signup" });
  return { title: t("metaTitle") };
}

export default async function SignUpPage({ params }: PageProps<"/[locale]/signup">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const profile = await getCurrentProfile();
  if (profile) redirect(`/${locale}/${profile.username}`);

  const t = await getTranslations("Auth.signup");

  return (
    <AuthShell
      eyebrow={t("eyebrow")}
      title={t("title")}
      footer={
        <>
          {t("haveAccount")}{" "}
          <Link href="/login" className="link-underline text-paper">
            {t("signIn")}
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
