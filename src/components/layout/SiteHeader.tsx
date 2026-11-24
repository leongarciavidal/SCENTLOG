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
 * added as their milestones ship. The language switcher lives in the footer
 * on small screens to keep the header uncluttered.
 */
export async function SiteHeader() {
  const t = await getTranslations("Nav");
  const profile = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ink/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Wordmark />
        <div className="flex items-center gap-5 sm:gap-8">
          <nav aria-label={t("label")} className="flex items-center gap-5 sm:gap-8">
            <Link
              href="/fragrances"
              className="text-sm text-paper-muted transition-colors hover:text-paper"
            >
              {t("fragrances")}
            </Link>
            <Link
              href="/brands"
              className="text-sm text-paper-muted transition-colors hover:text-paper"
            >
              {t("brands")}
            </Link>
            {profile ? (
              <Link
                href="/feed"
                className="hidden text-sm text-paper-muted transition-colors hover:text-paper sm:inline"
              >
                {t("feed")}
              </Link>
            ) : null}
          </nav>
          <LocaleSwitcher className="hidden sm:flex" />
          {profile ? (
            <UserMenu
              username={profile.username}
              displayName={profile.display_name}
              avatarUrl={profile.avatar_url}
            />
          ) : (
            <div className="flex items-center gap-5 border-l border-line pl-5 sm:border-0 sm:pl-0">
              <Link
                href="/login"
                className="text-sm text-paper-muted transition-colors hover:text-paper"
              >
                {t("signIn")}
              </Link>
              <span className="hidden sm:inline-flex">
                <Link href="/signup" className={buttonClasses("primary", "h-9 px-4 text-xs")}>
                  {t("join")}
                </Link>
              </span>
            </div>
          )}
        </div>
      </Container>
    </header>
  );
}
