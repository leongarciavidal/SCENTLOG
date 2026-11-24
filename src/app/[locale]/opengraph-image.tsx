import { ImageResponse } from "next/og";

import { routing } from "@/i18n/routing";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "SCENTLOG — A diary of fragrance";

const TAGLINE: Record<string, string> = {
  en: "A diary of fragrance.",
  es: "Un diario de perfumes.",
};

/** Default image shown when a SCENTLOG link is shared on social networks. */
export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tagline = TAGLINE[locale] ?? TAGLINE[routing.defaultLocale];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#0e0e0d",
        color: "#ede8df",
      }}
    >
      <div style={{ display: "flex", fontSize: 28, letterSpacing: 16, fontWeight: 600 }}>
        SCENTLOG
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", fontSize: 96, fontFamily: "serif", lineHeight: 1 }}>
          {tagline}
        </div>
        <div style={{ display: "flex", width: 120, height: 2, background: "#6f9a7d" }} />
      </div>
    </div>,
    size,
  );
}
