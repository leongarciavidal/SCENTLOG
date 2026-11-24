import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { getLegalDocument } from "@/features/legal/content";
import { LegalPage } from "@/features/legal/LegalPage";
import type { Locale } from "@/i18n/routing";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: getLegalDocument("privacy", locale).title,
    alternates: alternatesFor(locale, "/privacy"),
  };
}

export default async function Page({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return <LegalPage doc="privacy" locale={locale} />;
}
