import Anthropic from '@anthropic-ai/sdk';
import { isAuthenticated, setCorsHeaders } from '../_auth.js';

// All env getters throw immediately if the var is missing so the handler fails
// closed (500) rather than falling back to an insecure default. Values are
// never forwarded to the client — only sanitised output fields are returned.
function getAnthropicKey() {
  const v = process.env.ANTHROPIC_API_KEY;
  if (!v) throw new Error('Missing ANTHROPIC_API_KEY env var');
  return v;
}
function getGithubToken() {
  const v = process.env.GITHUB_TOKEN;
  if (!v) throw new Error('Missing GITHUB_TOKEN env var');
  return v;
}
function getRepoOwner() {
  const v = process.env.GITHUB_REPO_OWNER;
  if (!v) throw new Error('Missing GITHUB_REPO_OWNER env var');
  return v;
}
function getRepoName() {
  const v = process.env.GITHUB_REPO_NAME;
  if (!v) throw new Error('Missing GITHUB_REPO_NAME env var');
  return v;
}
const BRANCH = () => process.env.GITHUB_BRANCH || 'main';

// ---------------------------------------------------------------------------
// GitHub helpers
// ---------------------------------------------------------------------------

async function githubFetch(path, options = {}) {
  const url = `https://api.github.com${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getGithubToken()}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { message: text }; }

  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${data.message || text}`);
  }
  return data;
}

async function getFileSha(filePath) {
  try {
    const data = await githubFetch(
      `/repos/${getRepoOwner()}/${getRepoName()}/contents/${filePath}?ref=${BRANCH()}`
    );
    return { content: Buffer.from(data.content, 'base64').toString('utf-8'), sha: data.sha };
  } catch (err) {
    if (err.message.includes('404')) return null;
    throw err;
  }
}

async function getLatestCommitSha() {
  const data = await githubFetch(
    `/repos/${getRepoOwner()}/${getRepoName()}/git/refs/heads/${BRANCH()}`
  );
  return data.object.sha;
}

async function getTreeSha(commitSha) {
  const data = await githubFetch(
    `/repos/${getRepoOwner()}/${getRepoName()}/git/commits/${commitSha}`
  );
  return data.tree.sha;
}

async function createBlob(content) {
  const data = await githubFetch(`/repos/${getRepoOwner()}/${getRepoName()}/git/blobs`, {
    method: 'POST',
    body: JSON.stringify({ content, encoding: 'utf-8' }),
  });
  return data.sha;
}

async function createTree(baseTreeSha, files) {
  const tree = files.map(({ path, blobSha }) => ({
    path,
    mode: '100644',
    type: 'blob',
    sha: blobSha,
  }));
  const data = await githubFetch(`/repos/${getRepoOwner()}/${getRepoName()}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseTreeSha, tree }),
  });
  return data.sha;
}

async function createCommit(message, treeSha, parentSha) {
  const data = await githubFetch(`/repos/${getRepoOwner()}/${getRepoName()}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: treeSha, parents: [parentSha] }),
  });
  return data.sha;
}

async function updateRef(commitSha) {
  await githubFetch(`/repos/${getRepoOwner()}/${getRepoName()}/git/refs/heads/${BRANCH()}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commitSha }),
  });
}

// ---------------------------------------------------------------------------
// Parse Claude response → map of filePath → newContent
// ---------------------------------------------------------------------------

function parseFileBlocks(text) {
  // Expects blocks like:
  //   ### FILE: src/foo/bar.jsx
  //   ```jsx
  //   <content>
  //   ```
  const result = {};
  const pattern = /###\s+FILE:\s+([^\n]+)\n```[^\n]*\n([\s\S]*?)```/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const path = match[1].trim();
    const content = match[2];
    result[path] = content;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  setCorsHeaders(req, res, 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  if (!isAuthenticated(req)) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }

  // Parse body
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); }
    catch { res.status(400).json({ ok: false, error: 'Invalid JSON body' }); return; }
  }

  const { prompt, filePaths } = body || {};

  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    res.status(400).json({ ok: false, error: 'prompt is required' });
    return;
  }
  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    res.status(400).json({ ok: false, error: 'filePaths must be a non-empty array' });
    return;
  }
  if (filePaths.length > 10) {
    res.status(400).json({ ok: false, error: 'Maximum 10 files per request' });
    return;
  }

  // Validate paths — no traversal, must be within repo
  for (const p of filePaths) {
    if (typeof p !== 'string' || p.includes('..') || p.startsWith('/')) {
      res.status(400).json({ ok: false, error: `Invalid path: ${p}` });
      return;
    }
  }

  try {
    // 1. Fetch file contents from GitHub
    const fileContents = {};
    const logs = [];

    for (const filePath of filePaths) {
      const result = await getFileSha(filePath);
      if (!result) {
        logs.push(`[warn] File not found in repo: ${filePath} — will be created as new`);
        fileContents[filePath] = null;
      } else {
        fileContents[filePath] = result.content;
        logs.push(`[ok] Fetched: ${filePath} (${result.content.length} chars)`);
      }
    }

    // 2. Build system + user messages for Claude
    const filesSection = Object.entries(fileContents)
      .map(([path, content]) => {
        if (content === null) return `### FILE: ${path}\n(file does not exist yet — create it)\n`;
        return `### FILE: ${path}\n\`\`\`\n${content}\n\`\`\``;
      })
      .join('\n\n');

    const systemPrompt = `You are an expert software engineer working on a React 19 + Vite 8 + Tailwind CSS v4 SPA codebase.
The project uses:
- React 19 with hooks (no class components)
- Tailwind CSS v4 (use @theme design tokens, not hardcoded colors)
- ESM imports throughout
- "@/" alias resolves to "src/"
- Lucide-react for icons
- No TypeScript — plain JS/JSX

You will receive one or more source files and a task prompt. Your job is to modify the files to fulfil the prompt.

CRITICAL OUTPUT FORMAT:
- Return ONLY the complete updated file(s), one block per file.
- Format each block exactly as:
  ### FILE: <relative/path/from/repo/root>
  \`\`\`<ext>
  <full file content>
  \`\`\`
- Include the FULL file content — never truncate or use ellipsis.
- Do NOT include any explanation, commentary, or text outside of these blocks.
- Only include files that you actually changed.`;

    const userMessage = `Here are the source files to modify:\n\n${filesSection}\n\n---\n\nTask:\n${prompt.trim()}`;

    logs.push('[claude] Sending request to Claude API…');

    // 3. Call Claude API (streaming, collect final message)
    // Client is instantiated here (not at module level) so the env getter runs
    // inside the request context and throws a clean 500 if the key is missing.
    const anthropic = new Anthropic({ apiKey: getAnthropicKey() });
    let claudeText = '';
    const stream = await anthropic.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const finalMessage = await stream.finalMessage();
    for (const block of finalMessage.content) {
      if (block.type === 'text') claudeText += block.text;
    }

    logs.push(`[claude] Response received (${claudeText.length} chars)`);

    // 4. Parse updated files from Claude's response
    const updatedFiles = parseFileBlocks(claudeText);
    const changedPaths = Object.keys(updatedFiles);

    if (changedPaths.length === 0) {
      res.status(200).json({
        ok: true,
        committed: false,
        message: 'Claude did not return any file changes.',
        logs,
        claudeResponse: claudeText,
      });
      return;
    }

    logs.push(`[github] Files to commit: ${changedPaths.join(', ')}`);

    // 5. Commit to GitHub
    const latestSha = await getLatestCommitSha();
    const baseTreeSha = await getTreeSha(latestSha);

    // Create blobs for each changed file
    const blobEntries = await Promise.all(
      changedPaths.map(async (path) => {
        const blobSha = await createBlob(updatedFiles[path]);
        logs.push(`[github] Created blob for: ${path}`);
        return { path, blobSha };
      })
    );

    const newTreeSha = await createTree(baseTreeSha, blobEntries);
    const commitMessage = `feat(ai-edit): ${prompt.trim().slice(0, 72).replace(/\n/g, ' ')}`;
    const newCommitSha = await createCommit(commitMessage, newTreeSha, latestSha);
    await updateRef(newCommitSha);

    logs.push(`[github] Committed: ${newCommitSha.slice(0, 7)} → branch ${BRANCH()}`);
    logs.push('[vercel] Vercel will automatically rebuild from the new commit.');

    res.status(200).json({
      ok: true,
      committed: true,
      commitSha: newCommitSha,
      changedFiles: changedPaths,
      commitMessage,
      logs,
    });
  } catch (err) {
    // Log full error server-side only — never forward raw messages to the client
    // because they can contain env var names, GitHub API paths, or SDK internals.
    console.error('[ai-edit] error:', err);

    // Produce a safe, human-readable message stripped of any secret-bearing content.
    const raw = err?.message ?? '';
    let safeMessage = 'Internal server error';
    if (raw.startsWith('Missing ') && raw.endsWith(' env var')) {
      safeMessage = 'Server misconfiguration: required environment variable is not set';
    } else if (raw.startsWith('GitHub API ')) {
      // "GitHub API 404: ..." — safe to surface the status code but not the full URL
      const status = raw.match(/^GitHub API (\d+)/)?.[1];
      safeMessage = `GitHub API error${status ? ` (${status})` : ''} — check server logs`;
    } else if (raw.includes('anthropic') || raw.includes('Anthropic') || raw.includes('api_key')) {
      safeMessage = 'Claude API error — check server logs';
    }

    res.status(500).json({ ok: false, error: safeMessage });
  }
}
