interface RepoContext {
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  license: string | null;
  tree: string[];
  packageJson: string | null;
}

const headers: Record<string, string> = {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "ReadmeAI",
};

if (process.env.GITHUB_TOKEN) {
  headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
}

export async function fetchRepoContext(
  owner: string,
  repo: string
): Promise<RepoContext> {
  // Fetch repo metadata
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!repoRes.ok) {
    throw new Error(`GitHub API error: ${repoRes.status} ${repoRes.statusText}`);
  }
  const repoData = await repoRes.json();

  // Fetch file tree (default branch, top-level + 1 deep)
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${repoData.default_branch}?recursive=1`,
    { headers }
  );
  const treeData = treeRes.ok ? await treeRes.json() : { tree: [] };
  const tree = (treeData.tree || [])
    .filter((f: { type: string }) => f.type === "blob" || f.type === "tree")
    .map((f: { path: string; type: string }) => (f.type === "tree" ? `${f.path}/` : f.path))
    .slice(0, 100); // cap at 100 entries

  // Try to fetch package.json
  let packageJson: string | null = null;
  try {
    const pkgRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/package.json`,
      { headers }
    );
    if (pkgRes.ok) {
      const pkgData = await pkgRes.json();
      packageJson = Buffer.from(pkgData.content, "base64").toString("utf-8");
    }
  } catch {
    // Not a JS project, that's fine
  }

  return {
    description: repoData.description,
    language: repoData.language,
    topics: repoData.topics || [],
    stars: repoData.stargazers_count,
    license: repoData.license?.spdx_id || null,
    tree,
    packageJson,
  };
}
