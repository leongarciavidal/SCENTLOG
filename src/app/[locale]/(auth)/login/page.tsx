import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthShell } from "@/features/auth/components/AuthShell";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { safeNextPath } from "@/features/auth/redirects";
import { getCurrentProfile } from "@/features/auth/session";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Auth.login" });
  return { title: t("metaTitle"), robots: { index: false } };
}

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const query = await searchParams;
  const next = typeof query.next === "string" ? safeNextPath(query.next, "") : "";

  const profile = await getCurrentProfile();
  if (profile) redirect(next || `/${locale}/${profile.username}`);

  const t = await getTranslations("Auth.login");

  return (
    <AuthShell
      eyebrow={t("eyebrow")}
      title={t("title")}
      footer={
        <>
          {t("noAccount")}{" "}
          <Link href="/signup" className="link-underline text-paper">
            {t("createOne")}
          </Link>
        </>
      }
    >
      {query.error === "link" ? (
        <p role="alert" className="border-l border-amber py-1 pl-4 text-sm text-paper">
          {t("linkError")}
        </p>
      ) : null}
      <LoginForm next={next || undefined} />
    </AuthShell>
  );
}
