"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface ReadmePreviewProps {
  markdown: string;
}

export function ReadmePreview({ markdown }: ReadmePreviewProps) {
  const [view, setView] = useState<"preview" | "raw">("preview");

  function handleCopy() {
    navigator.clipboard.writeText(markdown);
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setView("preview")}
            className={`px-3 py-1 rounded text-sm ${view === "preview" ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}
          >
            Preview
          </button>
          <button
            onClick={() => setView("raw")}
            className={`px-3 py-1 rounded text-sm ${view === "raw" ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}
          >
            Markdown
          </button>
        </div>
        <button
          onClick={handleCopy}
          className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm"
        >
          Copy
        </button>
      </div>
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 prose prose-invert max-w-none">
        {view === "preview" ? (
          <ReactMarkdown>{markdown}</ReactMarkdown>
        ) : (
          <pre className="whitespace-pre-wrap text-sm text-gray-300">{markdown}</pre>
        )}
      </div>
    </div>
  );
}
