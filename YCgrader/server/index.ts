import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { assertNoApiKey } from "../src/lib/llm.ts";
import { FormInput } from "../src/lib/schema.ts";
import { analyze } from "./analyze.ts";
import { deleteRun, listRuns, saveRun } from "./runs.ts";

const PORT = Number(process.env.PORT ?? 8787);

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(payload);
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "POST" && req.url === "/api/analyze") {
    try {
      const body = await readBody(req);
      const parsed = FormInput.safeParse(body);
      if (!parsed.success) {
        sendJson(res, 400, { error: "Invalid form input", detail: parsed.error.flatten() });
        return;
      }
      const result = await analyze(parsed.data);
      const run = await saveRun(parsed.data, result); // auto-persist to data/runs/
      sendJson(res, 200, { run });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[analyze] failed:", msg);
      sendJson(res, 502, { error: "Analysis failed", detail: msg });
    }
    return;
  }

  // History — served straight from the files on disk.
  if (req.method === "GET" && req.url === "/api/runs") {
    try {
      sendJson(res, 200, { runs: await listRuns() });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      sendJson(res, 500, { error: "Failed to read history", detail: msg });
    }
    return;
  }

  if (req.method === "DELETE" && req.url?.startsWith("/api/runs/")) {
    const id = decodeURIComponent(req.url.slice("/api/runs/".length));
    const ok = await deleteRun(id);
    sendJson(res, ok ? 200 : 404, { ok });
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

// Fail fast if a paid API key is present — this tool spends the subscription only.
try {
  assertNoApiKey();
} catch (err) {
  console.error("\n✗ " + (err instanceof Error ? err.message : String(err)) + "\n");
  process.exit(1);
}

server.listen(PORT, () => {
  console.log(`✓ YC grader server on http://localhost:${PORT}  (model: ${process.env.GRADER_MODEL ?? "claude-opus-4-8"})`);
});
