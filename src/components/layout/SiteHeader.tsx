import { useTranslations } from "next-intl";

import { Container } from "@/components/ui/Container";

import { LocaleSwitcher } from "./LocaleSwitcher";
import { Wordmark } from "./Wordmark";

/**
 * Only links to sections that exist are shown. Sign in, Discover, Lists, etc.
 * are added as their milestones ship.
 */
export function SiteHeader() {
  const t = useTranslations("Nav");

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ink/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Wordmark />
        <div className="flex items-center gap-8">
          <nav aria-label={t("label")} className="hidden items-center gap-8 sm:flex">
            <a
              href="#catalogue"
              className="text-sm text-paper-muted transition-colors hover:text-paper"
            >
              {t("catalogue")}
            </a>
            <a
              href="#reviews"
              className="text-sm text-paper-muted transition-colors hover:text-paper"
            >
              {t("reviews")}
            </a>
          </nav>
          <LocaleSwitcher />
        </div>
      </Container>
    </header>
  );
}
