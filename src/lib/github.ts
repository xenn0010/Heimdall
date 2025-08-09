import fetch from 'node-fetch';
import { loadConfig } from './config.js';
import { withGithubMcp } from './mcp.js';

interface CreatePullRequestParams {
  owner: string;
  repo: string;
  head: string;
  base: string;
  title: string;
  body: string;
  draft: boolean;
}

export async function createPullRequest(params: CreatePullRequestParams): Promise<string> {
  const { owner, repo, head, base, title, body, draft } = params;

  // Try MCP first if configured
  try {
    const hasMcp = !!(process.env.MCP_GITHUB_CMD);

    if (hasMcp) {
      const result = await withGithubMcp(async (client) => {
        // Using GitHub's official MCP server method name
        return await client.call<{ html_url: string }>('create_pull_request', {
          owner,
          repo,
          head,
          base,
          title,
          body,
          draft,
        });
      });
      return result.html_url;
    }
  } catch (mcpError) {
    console.warn('MCP GitHub failed, falling back to REST API:', mcpError);
  }

  // Fallback to REST
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GH_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'heimdall-cli/0.1.0'
    },
    body: JSON.stringify({ title, head, base, body, draft })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} ${error}`);
  }

  const data = await response.json() as { html_url: string };
  return data.html_url;
}

export async function getIssues(owner: string, repo: string): Promise<any[]> {
  try {
    const hasMcp = !!(process.env.MCP_GITHUB_CMD);
    
    if (hasMcp) {
      return await withGithubMcp(async (client) => {
        // Using GitHub's official MCP server - may be 'list_issues' or similar
        return await client.call<any[]>('list_issues', { owner, repo });
      });
    }
  } catch (mcpError) {
    console.warn('MCP GitHub failed, falling back to REST API:', mcpError);
  }

  // Fallback to REST
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`);
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }
  return await response.json() as any[];
}

export async function createIssue(owner: string, repo: string, title: string, body: string): Promise<string> {
  try {
    const hasMcp = !!(process.env.MCP_GITHUB_CMD);
    
    if (hasMcp) {
      const result = await withGithubMcp(async (client) => {
        return await client.call<{ html_url: string }>('create_issue', {
          owner,
          repo,
          title,
          body,
        });
      });
      return result.html_url;
    }
  } catch (mcpError) {
    console.warn('MCP GitHub failed, falling back to REST API:', mcpError);
  }

  // Fallback to REST
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GH_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, body })
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json() as { html_url: string };
  return data.html_url;
}
