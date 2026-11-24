import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { getLegalDocument } from "@/features/legal/content";
import { LegalPage } from "@/features/legal/LegalPage";
import type { Locale } from "@/i18n/routing";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cookies">): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: getLegalDocument("cookies", locale).title,
    alternates: alternatesFor(locale, "/cookies"),
  };
}

export default async function Page({ params }: PageProps<"/[locale]/cookies">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return <LegalPage doc="cookies" locale={locale} />;
}
