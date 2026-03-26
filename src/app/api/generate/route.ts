import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fetchRepoContext } from "@/lib/github";
import { createSupabaseAdmin } from "@/lib/supabase-server";

const anthropic = new Anthropic();
const FREE_GENERATION_LIMIT = 3;

async function checkUsageLimit(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  userId: string | null,
  anonymousId: string
): Promise<{ allowed: boolean; used: number; isPro: boolean }> {
  // Pro subscribers get unlimited generations
  if (userId) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .single();

    if (sub?.status === "active") {
      const { count } = await supabase
        .from("generations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      return { allowed: true, used: count ?? 0, isPro: true };
    }
  }

  const column = userId ? "user_id" : "anonymous_id";
  const value = userId ?? anonymousId;

  const { count } = await supabase
    .from("generations")
    .select("*", { count: "exact", head: true })
    .eq(column, value);

  const used = count ?? 0;
  return { allowed: used < FREE_GENERATION_LIMIT, used, isPro: false };
}

async function recordGeneration(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  userId: string | null,
  anonymousId: string,
  repoUrl: string
) {
  await supabase.from("generations").insert({
    user_id: userId,
    anonymous_id: userId ? null : anonymousId,
    repo_url: repoUrl,
  });
}

function getAnonymousId(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return ip;
}

export async function POST(req: NextRequest) {
  try {
    const { repoUrl } = await req.json();

    if (!repoUrl || typeof repoUrl !== "string") {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 }
      );
    }

    // Parse GitHub URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid GitHub repository URL" },
        { status: 400 }
      );
    }
    const [, owner, repo] = match;

    const supabase = createSupabaseAdmin();

    // Check auth: extract user from Authorization header (bearer token)
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      userId = user?.id ?? null;
    }

    const anonymousId = getAnonymousId(req);

    // Check usage limit
    const { allowed, used, isPro } = await checkUsageLimit(
      supabase,
      userId,
      anonymousId
    );
    if (!allowed) {
      return NextResponse.json(
        {
          error: `Free limit reached (${FREE_GENERATION_LIMIT} generations). Sign in or upgrade to Pro for unlimited access.`,
          used,
          limit: FREE_GENERATION_LIMIT,
        },
        { status: 429 }
      );
    }

    // Fetch repo context from GitHub API
    const context = await fetchRepoContext(owner, repo.replace(/\.git$/, ""));

    // Generate README with Claude
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are an expert technical writer. Generate a professional, comprehensive README.md for the following GitHub repository.

Repository: ${owner}/${repo}
Description: ${context.description || "No description provided"}
Language: ${context.language || "Unknown"}
Topics: ${context.topics?.join(", ") || "None"}
Stars: ${context.stars}
License: ${context.license || "Not specified"}

File tree:
${context.tree.join("\n")}

${context.packageJson ? `package.json:\n${context.packageJson}` : ""}

Generate a complete README.md with these sections:
- Project title with badges (build status, license, version)
- Short description and key features
- Screenshots/demo placeholder
- Installation instructions
- Usage examples
- Configuration/environment variables
- API reference (if applicable)
- Contributing guidelines
- License

Use proper markdown formatting. Make it professional and inviting.`,
        },
      ],
    });

    const readme =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Record the generation
    await recordGeneration(supabase, userId, anonymousId, repoUrl);

    return NextResponse.json({
      readme,
      used: used + 1,
      limit: isPro ? null : FREE_GENERATION_LIMIT,
      isPro,
    });
  } catch (err: unknown) {
    console.error("Generate error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
