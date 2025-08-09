export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

export interface GitRemote {
  owner: string;
  repo: string;
}

export interface HeimdallConfig {
  defaultBranch: string;
  morphModel?: string;
  // Optional MCP GitHub server configuration
  mcpGithubCommand?: string;
  mcpGithubArgs?: string[];
}

export interface CommitMessage {
  type: string;
  scope?: string;
  description: string;
  body?: string;
  footer?: string;
}

export interface PullRequestOptions {
  base: string;
  title?: string;
  body?: string;
}

export interface ApplyFixOptions {
  update: string;
  dry?: boolean;
}

export interface McpRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: unknown;
}

export interface McpResponse<T = unknown> {
  jsonrpc: '2.0';
  id: number | string;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
}
