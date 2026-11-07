import { useEffect, useState } from "react";
import { Form } from "./components/Form.tsx";
import { Report } from "./components/Report.tsx";
import type { FormInput } from "./lib/schema.ts";
import { deleteRun, fetchRuns, type Run } from "./lib/storage.ts";

export function App() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [active, setActive] = useState<Run | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load history from disk on mount.
  useEffect(() => {
    fetchRuns().then((r) => {
      setRuns(r);
      setActive((cur) => cur ?? r[0] ?? null);
    });
  }, []);

  async function handleSubmit(input: FormInput) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      // Read the raw text first so an empty/non-JSON body (e.g. a proxy timeout)
      // surfaces a clear error instead of "Unexpected end of JSON input".
      const text = await res.text();
      if (!text) {
        throw new Error(
          res.ok
            ? "Empty response from server (the analysis may have timed out — check the API server logs)."
            : `Server returned ${res.status} ${res.statusText} with no body.`,
        );
      }
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`Unexpected non-JSON response (${res.status}): ${text.slice(0, 200)}`);
      }
      const body = json as { run?: Run; detail?: string; error?: string };
      if (!res.ok) throw new Error(body.detail || body.error || "Request failed");
      if (!body.run) throw new Error("Server did not return a saved run.");
      // Server already persisted the run to disk; just reflect it in the UI.
      setRuns((prev) => [body.run as Run, ...prev]);
      setActive(body.run);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteRun(id);
    setRuns((prev) => prev.filter((r) => r.id !== id));
    setActive((cur) => (cur?.id === id ? null : cur));
  }

  return (
    <div className="app">
      <header className="header">
        <h1>YC Idea Grader</h1>
        <p className="tagline">Four honest inputs. One sourced verdict. Run the experiment.</p>
      </header>

      <div className="layout">
        <main className="main">
          <Form onSubmit={handleSubmit} loading={loading} />
          {error && <div className="error">⚠ {error}</div>}
          {active && <Report data={active.result} />}
        </main>

        <aside className="sidebar">
          <h3>History</h3>
          <ul className="history">
            {runs.map((r) => (
              <li
                key={r.id}
                className={active?.id === r.id ? "active" : ""}
                onClick={() => setActive(r)}
              >
                <span className={`dot dot-${r.result.output.verdict}`} />
                <span className="hist-title">{r.input.idea ?? r.input.problem.slice(0, 40)}</span>
                <button
                  className="hist-del"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(r.id);
                  }}
                >
                  ×
                </button>
              </li>
            ))}
            {runs.length === 0 && <li className="empty">No runs yet.</li>}
          </ul>
        </aside>
      </div>
    </div>
  );
}
