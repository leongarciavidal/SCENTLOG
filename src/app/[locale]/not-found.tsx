import { useTranslations } from "next-intl";

import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <Container className="flex min-h-[60vh] flex-col items-start justify-center gap-6 py-24">
      <p className="eyebrow">404</p>
      <h1 className="max-w-3xl font-serif text-5xl leading-none sm:text-7xl">{t("title")}</h1>
      <p className="max-w-md text-paper-muted">{t("body")}</p>
      <Link href="/" className="link-underline text-sm">
        {t("back")}
      </Link>
    </Container>
  );
}
