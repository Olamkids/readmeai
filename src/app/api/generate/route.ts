import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fetchRepoContext } from "@/lib/github";

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { repoUrl } = await req.json();

    if (!repoUrl || typeof repoUrl !== "string") {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
    }

    // Parse GitHub URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return NextResponse.json({ error: "Invalid GitHub repository URL" }, { status: 400 });
    }
    const [, owner, repo] = match;

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

    return NextResponse.json({ readme });
  } catch (err: unknown) {
    console.error("Generate error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
