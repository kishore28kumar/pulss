import React, { useEffect, useState } from "react";

export default function App(): JSX.Element {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use VITE_API_URL if set, otherwise rely on Vite proxy (relative path)
  const API_BASE = import.meta.env.VITE_API_URL ?? "";

  useEffect(() => {
    const ctl = new AbortController();
    const url = API_BASE ? `${API_BASE.replace(/\/$/, "")}/health` : "/health";

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(url, { signal: ctl.signal });
        const text = await res.text();
        let data;
        try {
          data = text ? JSON.parse(text) : null;
        } catch (e) {
          data = { raw: text };
        }
        setHealth(data);
      } catch (err: any) {
        if (err.name !== "AbortError") setError(String(err));
      } finally {
        setLoading(false);
      }
    })();

    return () => ctl.abort();
  }, [API_BASE]);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 20 }}>
      <h1>Pulss — Frontend</h1>

      <section style={{ marginTop: 20 }}>
        <h2>Backend health</h2>
        {loading && <p>Checking backend…</p>}
        {error && <p style={{ color: "crimson" }}>Error: {error}</p>}
        {!loading && !error && (
          <pre style={{ background: "#f6f8fa", padding: 12, borderRadius: 6, maxWidth: 700 }}>
            {JSON.stringify(health, null, 2)}
          </pre>
        )}
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>Quick Links</h2>
        <ul>
          <li>Dev server: <code>npm run dev</code> (in frontend/)</li>
          <li>API base (frontend reads from): <code>{API_BASE || "relative / (use proxy or set VITE_API_URL)"}</code></li>
        </ul>
      </section>
    </div>
  );
fix-remove-mongo
}

}
main
