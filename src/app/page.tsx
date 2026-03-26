"use client";

import { useState } from "react";
import { RepoInput } from "@/components/RepoInput";
import { ReadmePreview } from "@/components/ReadmePreview";

export default function Home() {
  const [readme, setReadme] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function handleGenerate(repoUrl: string) {
    setLoading(true);
    setError("");
    setReadme("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate README");
      }
      const data = await res.json();
      setReadme(data.readme);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            ReadmeAI
          </h1>
          <p className="text-xl text-gray-400">
            Generate professional README files for your GitHub repos in seconds.
          </p>
        </div>
        <RepoInput onGenerate={handleGenerate} loading={loading} />
        {error && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
            {error}
          </div>
        )}
        {readme && <ReadmePreview markdown={readme} />}
      </div>
    </main>
  );
}
