import { getFormatter, getTranslations } from "next-intl/server";

import { Container } from "@/components/ui/Container";

import { legalConfig } from "./config";
import { getLegalDocument, type LegalDoc } from "./content";

export async function LegalPage({ doc, locale }: { doc: LegalDoc; locale: string }) {
  const document = getLegalDocument(doc, locale);
  const [t, format] = await Promise.all([getTranslations("Legal"), getFormatter()]);

  return (
    <Container className="py-16 sm:py-24">
      <article className="max-w-2xl">
        <header className="mb-12 flex flex-col gap-4 border-b border-line pb-10">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="font-serif text-5xl leading-none sm:text-6xl">{document.title}</h1>
          <p className="text-xs text-paper-faint">
            {t("updated", {
              date: format.dateTime(new Date(legalConfig.updated), { dateStyle: "long" }),
            })}
          </p>
          <p className="leading-relaxed text-paper-muted">{document.intro}</p>
        </header>
        <div className="flex flex-col gap-10">
          {document.sections.map((section) => (
            <section key={section.heading} className="flex flex-col gap-3">
              <h2 className="font-serif text-2xl">{section.heading}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="leading-relaxed text-paper-muted">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </article>
    </Container>
  );
}
