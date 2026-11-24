"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";

/** Shown when a page fails unexpectedly. The header and footer stay visible. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-start justify-center gap-6 py-24">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1 className="max-w-3xl font-serif text-5xl leading-none sm:text-7xl">{t("title")}</h1>
      <p className="max-w-md text-paper-muted">{t("body")}</p>
      {error.digest ? (
        <p className="text-xs text-paper-faint">{t("reference", { digest: error.digest })}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={reset}>{t("retry")}</Button>
        <Link href="/" className="link-underline text-sm text-paper-muted">
          {t("home")}
        </Link>
      </div>
    </Container>
  );
}
