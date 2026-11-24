import { getTranslations } from "next-intl/server";

import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { getCurrentProfile } from "@/features/auth/session";
import { Link } from "@/i18n/navigation";

import { LocaleSwitcher } from "./LocaleSwitcher";
import { UserMenu } from "./UserMenu";
import { Wordmark } from "./Wordmark";

/**
 * Only links to sections that exist are shown. Discover, Lists, etc. are
 * added as their milestones ship.
 */
export async function SiteHeader() {
  const t = await getTranslations("Nav");
  const profile = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ink/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Wordmark />
        <div className="flex items-center gap-6 sm:gap-8">
          <nav aria-label={t("label")} className="hidden items-center gap-8 md:flex">
            <Link
              href="/#catalogue"
              className="text-sm text-paper-muted transition-colors hover:text-paper"
            >
              {t("catalogue")}
            </Link>
            <Link
              href="/#reviews"
              className="text-sm text-paper-muted transition-colors hover:text-paper"
            >
              {t("reviews")}
            </Link>
          </nav>
          <LocaleSwitcher className="hidden sm:flex" />
          {profile ? (
            <UserMenu
              username={profile.username}
              displayName={profile.display_name}
              avatarUrl={profile.avatar_url}
            />
          ) : (
            <div className="flex items-center gap-5">
              <Link
                href="/login"
                className="text-sm text-paper-muted transition-colors hover:text-paper"
              >
                {t("signIn")}
              </Link>
              <Link href="/signup" className={buttonClasses("primary", "h-9 px-4 text-xs")}>
                {t("join")}
              </Link>
            </div>
          )}
        </div>
      </Container>
    </header>
  );
}
