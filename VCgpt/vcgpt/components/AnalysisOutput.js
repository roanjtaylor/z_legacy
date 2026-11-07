"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function AnalysisOutput({ content }) {
  if (!content) return null;

  return (
    <div className="analysis-output text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
