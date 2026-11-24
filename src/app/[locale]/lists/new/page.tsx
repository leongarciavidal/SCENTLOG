import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { z } from "zod";

import { Container } from "@/components/ui/Container";
import { requireUser } from "@/features/auth/session";
import { ListForm } from "@/features/lists/components/ListForm";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lists/new">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Lists" });
  return { title: t("newTitle"), robots: { index: false } };
}

export default async function NewListPage({
  params,
  searchParams,
}: PageProps<"/[locale]/lists/new">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const raw = (await searchParams).add;
  const add = z.uuid().safeParse(Array.isArray(raw) ? raw[0] : raw);
  await requireUser(locale, `/${locale}/lists/new${add.success ? `?add=${add.data}` : ""}`);
  const t = await getTranslations("Lists");

  return (
    <Container className="py-16 sm:py-24">
      <div className="max-w-2xl">
        <header className="mb-12 flex flex-col gap-4 border-b border-line pb-10">
          <p className="eyebrow text-moss-bright">{t("title")}</p>
          <h1 className="font-serif text-5xl leading-none sm:text-6xl">{t("newTitle")}</h1>
          <p className="leading-relaxed text-paper-muted">{t("newIntro")}</p>
        </header>
        <ListForm addFragranceId={add.success ? add.data : undefined} />
      </div>
    </Container>
  );
}
