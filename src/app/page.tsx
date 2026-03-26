"use client";

import { useState } from "react";
import { RepoInput } from "@/components/RepoInput";
import { ReadmePreview } from "@/components/ReadmePreview";
import { AuthButton } from "@/components/AuthButton";
import { useAuth } from "@/components/AuthProvider";

export default function Home() {
  const { session } = useAuth();
  const [readme, setReadme] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(
    null
  );

  async function handleGenerate(repoUrl: string) {
    setLoading(true);
    setError("");
    setReadme("");
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({ repoUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate README");
      }

      setReadme(data.readme);
      if (data.used !== undefined) {
        setUsage({ used: data.used, limit: data.limit });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-lg bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            ReadmeAI
          </span>
          <AuthButton />
        </div>
      </nav>
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
        {usage && (
          <div className="mt-4 text-center text-sm text-gray-500">
            {usage.used} / {usage.limit} free generations used
            {usage.used >= usage.limit && !session && (
              <span className="text-amber-400 ml-2">
                Sign in for more generations
              </span>
            )}
          </div>
        )}
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
