import type { Source } from "../lib/schema.ts";

export function SourceCard({ source }: { source: Source }) {
  return (
    <blockquote className="source-card">
      <p className="source-quote">“{source.quote}”</p>
      <a className="source-link" href={source.url} target="_blank" rel="noreferrer">
        {source.source}
      </a>
    </blockquote>
  );
}
