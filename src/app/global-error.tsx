"use client";

// Replaces the root layout when the layout itself fails, so it must render
// its own <html> and <body> and cannot rely on globals.css.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050814",
          color: "#f5f7fa",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <main role="alert" style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 12px" }}>Conqueror Studios is having trouble.</h1>
          <p style={{ color: "#b6bfcc", lineHeight: 1.6, margin: "0 0 20px" }}>
            The site failed to load. Try again in a moment.
          </p>
          {error.digest ? (
            <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#8a94a6" }}>
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 12,
              padding: "12px 22px",
              border: 0,
              borderRadius: 6,
              background: "#00d4ff",
              color: "#04121a",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
