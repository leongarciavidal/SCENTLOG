/**
 * Username rules. Keep in sync with the database:
 *   - CHECK constraint profiles_username_format
 *   - function public.is_reserved_username()
 * The database enforces them anyway; these copies give users instant feedback.
 */
export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

export const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "api",
  "auth",
  "about",
  "account",
  "brands",
  "brand",
  "discover",
  "explore",
  "feed",
  "fragrances",
  "fragrance",
  "help",
  "home",
  "lists",
  "list",
  "login",
  "logout",
  "me",
  "members",
  "new",
  "notes",
  "perfumers",
  "perfumer",
  "privacy",
  "profile",
  "reviews",
  "review",
  "scentlog",
  "search",
  "settings",
  "signin",
  "signup",
  "support",
  "terms",
  "user",
  "users",
  "en",
  "es",
  "diary",
  "activity",
  "popular",
]);

export const PASSWORD_MIN_LENGTH = 8;
// bcrypt (used by Supabase Auth) ignores anything after 72 bytes.
export const PASSWORD_MAX_LENGTH = 72;
