import { useTranslations } from "next-intl";

import { Container } from "@/components/ui/Container";

import { LocaleSwitcher } from "./LocaleSwitcher";

export function SiteFooter() {
  const t = useTranslations("Footer");
  const tc = useTranslations("Common");

  return (
    <footer className="mt-32 border-t border-line">
      <Container className="flex flex-col gap-10 py-12 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <span className="text-[0.8125rem] font-semibold tracking-[0.42em] uppercase">
            Scentlog
          </span>
          <span className="font-serif text-2xl text-paper-muted italic">{tc("brandTagline")}</span>
        </div>
        <div className="flex flex-col gap-4 text-sm text-paper-faint sm:items-end">
          <LocaleSwitcher />
          <p>
            {t("rights", { year: new Date().getFullYear() })} — {t("note")}
          </p>
        </div>
      </Container>
    </footer>
  );
}
