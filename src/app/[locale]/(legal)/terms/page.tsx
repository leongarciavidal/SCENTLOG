import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { getLegalDocument } from "@/features/legal/content";
import { LegalPage } from "@/features/legal/LegalPage";
import type { Locale } from "@/i18n/routing";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/terms">): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: getLegalDocument("terms", locale).title,
    alternates: alternatesFor(locale, "/terms"),
  };
}

export default async function Page({ params }: PageProps<"/[locale]/terms">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return <LegalPage doc="terms" locale={locale} />;
}
