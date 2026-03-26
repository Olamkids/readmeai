"use client";

import { useState } from "react";
import { RepoInput } from "@/components/RepoInput";
import { ReadmePreview } from "@/components/ReadmePreview";
import { AuthButton } from "@/components/AuthButton";
import { useAuth } from "@/components/AuthProvider";

export default function Home() {
  const { session, signInWithGitHub } = useAuth();
  const [readme, setReadme] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [usage, setUsage] = useState<{
    used: number;
    limit: number | null;
    isPro?: boolean;
  } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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
        setUsage({ used: data.used, limit: data.limit, isPro: data.isPro });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade() {
    if (!session?.access_token) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to start checkout");
      }
    } catch {
      setError("Failed to start checkout");
    } finally {
      setCheckoutLoading(false);
    }
  }

  const showUpgradeCTA =
    session && !usage?.isPro && usage && usage.limit !== null && usage.used >= usage.limit;

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
            {usage.isPro ? (
              <span className="text-emerald-400">
                Pro plan &mdash; unlimited generations ({usage.used} used)
              </span>
            ) : (
              <>
                {usage.used} / {usage.limit} free generations used
                {usage.used >= usage.limit! && !session && (
                  <span className="text-amber-400 ml-2">
                    Sign in for more generations
                  </span>
                )}
              </>
            )}
          </div>
        )}
        {showUpgradeCTA && (
          <div className="mt-6 p-6 bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-700/50 rounded-xl text-center">
            <p className="text-lg font-semibold mb-2">
              Unlock unlimited README generations
            </p>
            <p className="text-gray-400 text-sm mb-4">
              Upgrade to Pro for $9/mo and never hit a limit again.
            </p>
            <button
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {checkoutLoading ? "Redirecting..." : "Upgrade to Pro \u2014 $9/mo"}
            </button>
          </div>
        )}
        {error && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
            {error}
          </div>
        )}
        {readme && <ReadmePreview markdown={readme} />}

        {/* Pricing Section */}
        <div className="mt-20 mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Pricing</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="p-6 bg-gray-900 border border-gray-700 rounded-xl">
              <h3 className="text-lg font-semibold mb-2">Free</h3>
              <p className="text-3xl font-bold mb-4">
                $0<span className="text-base font-normal text-gray-500">/mo</span>
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>&#10003; 3 README generations</li>
                <li>&#10003; GitHub OAuth sign-in</li>
                <li>&#10003; Markdown preview &amp; copy</li>
              </ul>
            </div>
            <div className="p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-600/50 rounded-xl relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-xs font-medium px-3 py-1 rounded-full">
                Popular
              </span>
              <h3 className="text-lg font-semibold mb-2">Pro</h3>
              <p className="text-3xl font-bold mb-4">
                $9<span className="text-base font-normal text-gray-500">/mo</span>
              </p>
              <ul className="space-y-2 text-sm text-gray-400 mb-6">
                <li>&#10003; Unlimited README generations</li>
                <li>&#10003; Priority Claude Sonnet 4</li>
                <li>&#10003; All free features included</li>
              </ul>
              {session ? (
                <button
                  onClick={handleUpgrade}
                  disabled={checkoutLoading || usage?.isPro}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  {usage?.isPro
                    ? "Current Plan"
                    : checkoutLoading
                      ? "Redirecting..."
                      : "Upgrade to Pro"}
                </button>
              ) : (
                <button
                  onClick={signInWithGitHub}
                  className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-all text-sm"
                >
                  Sign in to upgrade
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
