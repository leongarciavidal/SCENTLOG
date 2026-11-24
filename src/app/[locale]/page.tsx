import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { FragranceCard } from "@/components/fragrance/FragranceCard";
import { Container } from "@/components/ui/Container";
import { getFeaturedFragrances } from "@/features/fragrances/queries";
import type { Metadata } from "next";

import { getRecentReviews } from "@/features/reviews/queries";
import { Link } from "@/i18n/navigation";
import { alternatesFor } from "@/lib/seo";
import type { QueryResult } from "@/lib/result";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: alternatesFor(locale, "") };
}

const PILLARS = ["log", "rate", "collect", "follow"] as const;

export default async function HomePage({ params, searchParams }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale as "en" | "es");

  const [t, format, fragrances, reviews] = await Promise.all([
    getTranslations("Home"),
    getFormatter(),
    getFeaturedFragrances(9),
    getRecentReviews(3),
  ]);

  const items = fragrances.status === "ok" ? fragrances.data.items : [];
  const accountDeleted = (await searchParams).accountDeleted === "1";
  const ta = accountDeleted ? await getTranslations("Account") : null;
  const [lead, ...rest] = items;

  return (
    <>
      {ta ? (
        <p
          role="status"
          className="border-b border-line bg-ink-raised px-5 py-3 text-center text-sm text-paper-muted"
        >
          {ta("deleted")}
        </p>
      ) : null}
      {/* ------------------------------------------------------------------ Hero */}
      <section className="border-b border-line">
        <Container className="grid gap-14 pt-16 pb-20 sm:pt-24 lg:grid-cols-12 lg:gap-12 lg:pb-28">
          <div className="flex flex-col justify-between gap-12 lg:col-span-7">
            <div className="flex flex-col gap-8">
              <p className="eyebrow text-moss-bright">{t("heroEyebrow")}</p>
              <h1 className="font-serif text-[clamp(3rem,7.4vw,7.25rem)] leading-[0.92] tracking-[-0.015em] text-balance">
                {t.rich("heroTitle", {
                  em: (chunks) => <em className="text-paper-muted">{chunks}</em>,
                })}
              </h1>
            </div>
            <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
              <p className="max-w-md text-base leading-relaxed text-paper-muted">{t("heroBody")}</p>
              <Link
                href="/fragrances"
                className="group inline-flex shrink-0 items-center gap-3 border-b border-paper/40 pb-1.5 text-sm tracking-wide transition-colors hover:border-paper"
              >
                {t("heroCta")}
                <span
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
            </div>
          </div>

          {lead ? (
            <div className="lg:col-span-5">
              <FragranceCard fragrance={lead} size="large" priority />
            </div>
          ) : null}
        </Container>
      </section>

      {/* -------------------------------------------------------------- Pillars */}
      <section aria-labelledby="pillars-title" className="border-b border-line">
        <Container className="py-20 sm:py-24">
          <h2 id="pillars-title" className="eyebrow mb-12">
            {t("pillarsTitle")}
          </h2>
          <ol className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((key, index) => (
              <li
                key={key}
                className="flex flex-col gap-5 bg-ink py-8 sm:px-8 sm:first:pl-0 lg:py-2"
              >
                <span className="text-xs text-paper-faint tabular-nums">0{index + 1}</span>
                <h3 className="font-serif text-4xl">{t(`pillars.${key}.title`)}</h3>
                <p className="max-w-xs text-sm leading-relaxed text-paper-muted">
                  {t(`pillars.${key}.body`)}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ------------------------------------------------------------ Catalogue */}
      <section id="catalogue" aria-labelledby="catalogue-title" className="scroll-mt-16">
        <Container className="py-20 sm:py-28">
          <SectionHeading
            eyebrow={t("catalogueEyebrow")}
            title={t("catalogueTitle")}
            id="catalogue-title"
            aside={
              fragrances.status === "ok" && fragrances.data.total > 0
                ? t("catalogueCount", { count: fragrances.data.total })
                : undefined
            }
          />

          <StatusNotice result={fragrances} />

          {fragrances.status === "ok" && items.length === 0 ? (
            <EmptyState>{t("catalogueEmpty")}</EmptyState>
          ) : null}

          {rest.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-14 sm:gap-x-6 lg:grid-cols-4">
              {rest.map((fragrance) => (
                <FragranceCard key={fragrance.id} fragrance={fragrance} />
              ))}
            </div>
          ) : null}

          {items.length > 0 ? (
            <Link
              href="/fragrances"
              className="link-underline mt-16 inline-block text-sm text-paper-muted"
            >
              {t("viewAll")} →
            </Link>
          ) : null}
        </Container>
      </section>

      {/* -------------------------------------------------------------- Reviews */}
      <section
        id="reviews"
        aria-labelledby="reviews-title"
        className="scroll-mt-16 border-t border-line"
      >
        <Container className="py-20 sm:py-28">
          <SectionHeading
            eyebrow={t("reviewsEyebrow")}
            title={t("reviewsTitle")}
            id="reviews-title"
          />

          {reviews.status === "ok" && reviews.data.length === 0 ? (
            <EmptyState>{t("reviewsEmpty")}</EmptyState>
          ) : null}

          {reviews.status === "ok" && reviews.data.length > 0 ? (
            <ul className="grid gap-px bg-line lg:grid-cols-3">
              {reviews.data.map((review) => (
                <li
                  key={review.id}
                  className="flex flex-col gap-4 bg-ink py-8 lg:px-8 lg:first:pl-0"
                >
                  <p className="eyebrow">{review.fragrance.brand.name}</p>
                  <h3 className="font-serif text-2xl">
                    <Link href={`/reviews/${review.id}`} className="hover:text-paper-muted">
                      {review.fragrance.name}
                    </Link>
                  </h3>
                  <p className="line-clamp-5 text-sm leading-relaxed text-paper-muted">
                    {review.body}
                  </p>
                  <p className="text-xs text-paper-faint">
                    {t("reviewBy", { username: review.author.username })} ·{" "}
                    {format.dateTime(new Date(review.created_at), { dateStyle: "medium" })}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </Container>
      </section>
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  id,
  aside,
}: {
  eyebrow: string;
  title: string;
  id: string;
  aside?: string;
}) {
  return (
    <div className="mb-12 flex items-end justify-between gap-6 border-b border-line pb-6 sm:mb-16">
      <div className="flex flex-col gap-4">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id} className="font-serif text-4xl leading-none sm:text-6xl">
          {title}
        </h2>
      </div>
      {aside ? <p className="shrink-0 text-sm text-paper-faint tabular-nums">{aside}</p> : null}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-lg font-serif text-2xl leading-snug text-paper-muted italic">{children}</p>
  );
}

async function StatusNotice({ result }: { result: QueryResult<unknown> }) {
  const t = await getTranslations("Home");

  if (result.status === "unconfigured") {
    // Developer hint only; production builds always have Supabase configured.
    if (process.env.NODE_ENV !== "development") return null;
    return (
      <p role="status" className="mb-12 border-l border-moss-bright pl-4 text-sm text-paper-muted">
        {t("notConfigured")}
      </p>
    );
  }

  if (result.status === "error") {
    return (
      <p role="alert" className="mb-12 border-l border-amber pl-4 text-sm text-paper-muted">
        {t("loadError")}
      </p>
    );
  }

  return null;
}
