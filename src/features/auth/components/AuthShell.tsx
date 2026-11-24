import { getTranslations } from "next-intl/server";

import { Container } from "@/components/ui/Container";

/**
 * Editorial two-column frame for auth pages: a quiet typographic panel on the
 * left (desktop only) and the form on the right.
 */
export async function AuthShell({
  eyebrow,
  title,
  intro,
  footer,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = await getTranslations("Auth");

  return (
    <Container className="grid min-h-[calc(100dvh-4rem)] gap-16 py-16 lg:grid-cols-12 lg:gap-12 lg:py-0">
      <aside className="relative hidden overflow-hidden border-r border-line lg:col-span-6 lg:flex lg:items-end lg:pr-12 lg:pb-20">
        <div className="absolute inset-y-16 right-12 left-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(111,154,125,0.10),transparent_60%)]" />
        <blockquote className="relative max-w-lg font-serif text-6xl leading-[0.95] text-paper/90 italic">
          {t("asideQuote")}
        </blockquote>
      </aside>

      <section className="flex flex-col justify-center lg:col-span-5 lg:col-start-8 lg:py-20">
        <div className="mx-auto flex w-full max-w-md flex-col gap-10 lg:mx-0">
          <header className="flex flex-col gap-4">
            <p className="eyebrow text-moss-bright">{eyebrow}</p>
            <h1 className="font-serif text-5xl leading-none sm:text-6xl">{title}</h1>
            {intro ? <p className="leading-relaxed text-paper-muted">{intro}</p> : null}
          </header>
          {children}
          {footer ? (
            <div className="border-t border-line pt-6 text-sm text-paper-muted">{footer}</div>
          ) : null}
        </div>
      </section>
    </Container>
  );
}
