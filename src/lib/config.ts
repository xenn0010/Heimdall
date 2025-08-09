import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import type { HeimdallConfig } from '../types/index.js';

const CONFIG_FILE = '.heimdall.json';

export async function createConfig(): Promise<void> {
  const defaultConfig: HeimdallConfig = {
    defaultBranch: 'main',
    morphModel: process.env.MORPH_MODEL || 'morph/morph-v2',
    mcpGithubCommand: process.env.MCP_GITHUB_CMD,
    mcpGithubArgs: process.env.MCP_GITHUB_ARGS ? JSON.parse(process.env.MCP_GITHUB_ARGS) : undefined
  };
  
  await writeFile(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
}

export async function loadConfig(): Promise<HeimdallConfig> {
  if (!existsSync(CONFIG_FILE)) {
    throw new Error('Heimdall not initialized. Run "heimdall init" first.');
  }
  
  const content = await readFile(CONFIG_FILE, 'utf-8');
  return JSON.parse(content);
}

export async function updateConfig(updates: Partial<HeimdallConfig>): Promise<void> {
  const config = await loadConfig();
  const newConfig = { ...config, ...updates };
  await writeFile(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
}
