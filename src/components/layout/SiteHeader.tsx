import { getTranslations } from "next-intl/server";

import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { getCurrentProfile } from "@/features/auth/session";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { LocaleSwitcher } from "./LocaleSwitcher";
import { UserMenu } from "./UserMenu";
import { Wordmark } from "./Wordmark";

/**
 * Only links to sections that exist are shown. Discover, Lists, etc. are
 * added as their milestones ship. The language switcher lives in the footer
 * on small screens to keep the header uncluttered.
 */
/** Main sections. On small screens only the `mobile` ones show; all are in the footer. */
const NAV: {
  href: string;
  label: "discover" | "fragrances" | "brands" | "lists" | "feed";
  mobile: boolean;
  auth?: boolean;
}[] = [
  { href: "/discover", label: "discover", mobile: true },
  { href: "/fragrances", label: "fragrances", mobile: true },
  { href: "/brands", label: "brands", mobile: false },
  { href: "/lists", label: "lists", mobile: false },
  { href: "/feed", label: "feed", mobile: false, auth: true },
];

export async function SiteHeader() {
  const t = await getTranslations("Nav");
  const profile = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ink/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Wordmark />
        <div className="flex items-center gap-5 sm:gap-8">
          <nav aria-label={t("label")} className="flex items-center gap-5 lg:gap-7">
            {NAV.filter((item) => !item.auth || profile).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm text-paper-muted transition-colors hover:text-paper",
                  !item.mobile && "hidden lg:inline",
                )}
              >
                {t(item.label)}
              </Link>
            ))}
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
