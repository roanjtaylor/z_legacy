// Robust JSON extraction from LLM output.
// Handles: markdown code fences, leading/trailing prose, partial wrappers,
// and trailing prose that contains brackets (e.g., markdown links, footnotes).
//
// Strategy: find the first `{` or `[`, then walk forward tracking bracket
// depth and string-literal state. Stop at the matching close. Anything after
// that point is ignored, so trailing prose can contain `[` / `]` / `{` / `}`
// without confusing the extractor.

function findBalancedEnd(
  text: string,
  start: number,
  open: string,
  close: string
): number {
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (inString) {
      if (ch === "\\") {
        escapeNext = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === open) {
      depth++;
    } else if (ch === close) {
      depth--;
      if (depth === 0) return i;
    }
  }

  return -1;
}

export function extractJsonObject<T = unknown>(text: string): T {
  const start = text.indexOf("{");
  if (start === -1) {
    throw new Error(
      `No JSON object found in model output. First 500 chars:\n${text.slice(0, 500)}`
    );
  }
  const end = findBalancedEnd(text, start, "{", "}");
  if (end === -1) {
    throw new Error(
      `Unbalanced JSON object in model output (no matching close brace). First 500 chars from {:\n${text.slice(start, start + 500)}`
    );
  }
  const slice = text.slice(start, end + 1);
  try {
    return JSON.parse(slice) as T;
  } catch (err) {
    throw new Error(
      `JSON.parse failed on extracted object. Error: ${
        err instanceof Error ? err.message : String(err)
      }\n\nExtracted slice (first 800 chars):\n${slice.slice(0, 800)}`
    );
  }
}

export function extractJsonArray<T = unknown>(text: string): T[] {
  const start = text.indexOf("[");
  if (start === -1) {
    throw new Error(
      `No JSON array found in model output. First 500 chars:\n${text.slice(0, 500)}`
    );
  }
  const end = findBalancedEnd(text, start, "[", "]");
  if (end === -1) {
    throw new Error(
      `Unbalanced JSON array in model output (no matching close bracket). First 500 chars from [:\n${text.slice(start, start + 500)}`
    );
  }
  const slice = text.slice(start, end + 1);
  try {
    const parsed = JSON.parse(slice);
    if (!Array.isArray(parsed)) {
      throw new Error("Parsed value is not an array");
    }
    return parsed as T[];
  } catch (err) {
    throw new Error(
      `JSON.parse failed on extracted array. Error: ${
        err instanceof Error ? err.message : String(err)
      }\n\nExtracted slice (first 800 chars):\n${slice.slice(0, 800)}`
    );
  }
}
