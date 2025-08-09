import { execa } from 'execa';
import type { McpRequest, McpResponse } from '../types/index.js';

interface McpClientOptions {
  command: string;
  args?: string[];
  env?: Record<string, string | undefined>;
}

export class McpClient {
  private command: string;
  private args: string[];
  private env: Record<string, string | undefined> | undefined;

  constructor(options: McpClientOptions) {
    this.command = options.command;
    this.args = options.args ?? [];
    this.env = options.env;
  }

  async call<T = unknown>(method: string, params?: unknown): Promise<T> {
    const request: McpRequest = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    };

    const { stdout } = await execa(this.command, this.args, {
      env: this.env,
      input: JSON.stringify(request),
    });

    const response: McpResponse<T> = JSON.parse(stdout);
    if (response.error) {
      throw new Error(`MCP error ${response.error.code}: ${response.error.message}`);
    }
    return response.result as T;
  }
}

export async function withGithubMcp<T>(
  fn: (client: McpClient) => Promise<T>,
  options?: Partial<McpClientOptions>
): Promise<T> {
  const command = options?.command || process.env.MCP_GITHUB_CMD;
  const args = options?.args || (process.env.MCP_GITHUB_ARGS ? JSON.parse(process.env.MCP_GITHUB_ARGS) : undefined);

  if (!command) {
    throw new Error('MCP GitHub command is not configured. Set MCP_GITHUB_CMD or .heimdall.json');
  }

  // Ensure GitHub token is available for Docker container
  const env = {
    ...process.env,
    GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GH_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN
  };

  const client = new McpClient({ command, args, env });
  return fn(client);
}


