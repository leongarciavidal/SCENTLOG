import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

// Locale-aware versions of Next.js navigation helpers.
// Always import Link / redirect / useRouter from here, not from "next/link".
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
