import type { CommitMessage } from '../types/index.js';

export function parseCommitType(diff: string): string {
  // Simple heuristics to determine commit type from diff
  if (diff.includes('package.json') && (diff.includes('"dependencies"') || diff.includes('"devDependencies"'))) {
    return 'build';
  }
  
  if (diff.includes('test') || diff.includes('spec')) {
    return 'test';
  }
  
  if (diff.includes('README') || diff.includes('.md')) {
    return 'docs';
  }
  
  if (diff.includes('fix') || diff.includes('bug')) {
    return 'fix';
  }
  
  if (diff.includes('refactor')) {
    return 'refactor';
  }
  
  // Default to feat for new functionality
  return 'feat';
}

export function generateCommitDescription(files: string[]): string {
  if (files.length === 1) {
    const file = files[0];
    const fileName = file.split('/').pop() || file;
    return `update ${fileName}`;
  }
  
  if (files.length <= 3) {
    return `update ${files.join(', ')}`;
  }
  
  // Group by directory or type
  const dirs = new Set(files.map(f => f.split('/')[0]));
  if (dirs.size === 1) {
    return `update ${dirs.values().next().value} files`;
  }
  
  return `update ${files.length} files`;
}

export function formatCommitMessage(commit: CommitMessage): string {
  let message = `${commit.type}`;
  
  if (commit.scope) {
    message += `(${commit.scope})`;
  }
  
  message += `: ${commit.description}`;
  
  if (commit.body) {
    message += `\n\n${commit.body}`;
  }
  
  if (commit.footer) {
    message += `\n\n${commit.footer}`;
  }
  
  return message;
}

export function validateEnvironment(): { ghToken: boolean; morphKey: boolean } {
  return {
    ghToken: !!process.env.GH_TOKEN,
    morphKey: !!process.env.MORPH_API_KEY
  };
}
