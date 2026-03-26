"use client";

import { useState } from "react";
import {
  CustomizationOptions,
  DEFAULT_OPTIONS,
  type ReadmeOptions,
} from "./CustomizationOptions";

interface RepoInputProps {
  onGenerate: (repoUrl: string, options: ReadmeOptions) => void;
  loading: boolean;
}

export function RepoInput({ onGenerate, loading }: RepoInputProps) {
  const [url, setUrl] = useState("");
  const [options, setOptions] = useState<ReadmeOptions>(DEFAULT_OPTIONS);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (url.trim()) {
      onGenerate(url.trim(), options);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
        >
          {loading ? "Generating..." : "Generate README"}
        </button>
      </form>
      <CustomizationOptions
        options={options}
        onChange={setOptions}
        disabled={loading}
      />
    </div>
  );
}
