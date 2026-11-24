import { getLocale, getTranslations } from "next-intl/server";

import { Avatar } from "@/components/profile/Avatar";
import { signOut } from "@/features/auth/actions";
import { Link } from "@/i18n/navigation";

/**
 * Account menu built on <details>/<summary>: keyboard accessible and works
 * without JavaScript. Sign out is a real form POST (Server Action).
 */
export async function UserMenu({
  username,
  displayName,
  avatarUrl,
}: {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}) {
  const t = await getTranslations("Nav");
  const locale = await getLocale();
  const itemClass =
    "block px-4 py-2.5 text-sm text-paper-muted transition-colors hover:bg-ink-raised hover:text-paper";

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 [&::-webkit-details-marker]:hidden">
        <span className="sr-only">{t("account")}:</span>
        <Avatar url={avatarUrl} name={displayName || username} size="sm" />
        <span className="hidden text-sm text-paper-muted transition-colors group-open:text-paper hover:text-paper md:inline">
          {username}
        </span>
      </summary>
      <div className="absolute right-0 z-50 mt-3 w-52 border border-line-strong bg-ink py-2 shadow-2xl shadow-black/50">
        <Link href={`/${username}`} className={itemClass}>
          {t("profile")}
        </Link>
        <Link href="/feed" className={itemClass}>
          {t("feed")}
        </Link>
        <Link href={`/${username}/collection`} className={itemClass}>
          {t("collection")}
        </Link>
        <Link href={`/${username}/lists`} className={itemClass}>
          {t("myLists")}
        </Link>
        <Link href="/settings/profile" className={itemClass}>
          {t("settings")}
        </Link>
        <div className="my-2 h-px bg-line" />
        <form action={signOut.bind(null, locale)}>
          <button type="submit" className={`${itemClass} w-full text-left`}>
            {t("signOut")}
          </button>
        </form>
      </div>
    </details>
  );
}
