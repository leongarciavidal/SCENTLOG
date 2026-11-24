"use client";

/**
 * Last-resort error screen, used only if the root layout itself fails.
 * It cannot rely on translations or styles, so it is self-contained.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#0e0e0d",
          color: "#ede8df",
          fontFamily: "Georgia, serif",
          padding: "15vh 8vw",
        }}
      >
        <p style={{ letterSpacing: "0.3em", fontSize: 12, fontFamily: "system-ui, sans-serif" }}>
          SCENTLOG
        </p>
        <h1 style={{ fontSize: 48, fontWeight: 400 }}>Something went wrong · Algo ha fallado</h1>
        <button
          onClick={reset}
          style={{
            marginTop: 24,
            padding: "12px 24px",
            background: "#ede8df",
            color: "#0e0e0d",
            border: 0,
            cursor: "pointer",
          }}
        >
          Try again · Reintentar
        </button>
      </body>
    </html>
  );
}
