import { execa } from 'execa';
import type { GitStatus, GitRemote } from '../types/index.js';

export async function isGitRepo(): Promise<boolean> {
  try {
    await execa('git', ['status']);
    return true;
  } catch {
    return false;
  }
}

export async function getCurrentBranch(): Promise<string> {
  const { stdout } = await execa('git', ['branch', '--show-current']);
  return stdout.trim();
}

export async function getGitStatus(): Promise<GitStatus> {
  const [branchInfo, stagedFiles, unstagedFiles, untrackedFiles] = await Promise.all([
    getBranchInfo(),
    getStagedFiles(),
    getUnstagedFiles(),
    getUntrackedFiles()
  ]);

  return {
    branch: branchInfo.branch,
    ahead: branchInfo.ahead,
    behind: branchInfo.behind,
    staged: stagedFiles,
    unstaged: unstagedFiles,
    untracked: untrackedFiles
  };
}

async function getBranchInfo(): Promise<{ branch: string; ahead: number; behind: number }> {
  const branch = await getCurrentBranch();
  
  try {
    const { stdout } = await execa('git', ['status', '--porcelain=v1', '--branch']);
    const branchLine = stdout.split('\n')[0];
    
    let ahead = 0;
    let behind = 0;
    
    if (branchLine.includes('[ahead ')) {
      const aheadMatch = branchLine.match(/\[ahead (\d+)/);
      if (aheadMatch) ahead = parseInt(aheadMatch[1]);
    }
    
    if (branchLine.includes('behind ')) {
      const behindMatch = branchLine.match(/behind (\d+)\]/);
      if (behindMatch) behind = parseInt(behindMatch[1]);
    }
    
    return { branch, ahead, behind };
  } catch {
    return { branch, ahead: 0, behind: 0 };
  }
}

export async function getStagedFiles(): Promise<string[]> {
  try {
    const { stdout } = await execa('git', ['diff', '--cached', '--name-only']);
    return stdout ? stdout.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

async function getUnstagedFiles(): Promise<string[]> {
  try {
    const { stdout } = await execa('git', ['diff', '--name-only']);
    return stdout ? stdout.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

async function getUntrackedFiles(): Promise<string[]> {
  try {
    const { stdout } = await execa('git', ['ls-files', '--others', '--exclude-standard']);
    return stdout ? stdout.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

export async function getRemoteInfo(): Promise<GitRemote> {
  const { stdout } = await execa('git', ['remote', 'get-url', 'origin']);
  const url = stdout.trim();
  
  // Parse GitHub URL (supports both HTTPS and SSH)
  let match = url.match(/github\.com[\/:]([^\/]+)\/(.+?)(?:\.git)?$/);
  
  if (!match) {
    throw new Error('Unable to parse GitHub repository from remote URL');
  }
  
  return {
    owner: match[1],
    repo: match[2]
  };
}

export async function gitCommit(message: string): Promise<void> {
  await execa('git', ['commit', '-m', message]);
}

export async function getStagedDiff(): Promise<string> {
  try {
    const { stdout } = await execa('git', ['diff', '--cached']);
    return stdout;
  } catch {
    return '';
  }
}

export async function getRepoContext(): Promise<string> {
  try {
    // Check if we're in a Git repository first
    const isRepo = await isGitRepo();
    if (!isRepo) {
      return 'Error: Not in a Git repository. Run "git init" or navigate to a Git repository first.';
    }

    const [status, recentCommits, currentDiff] = await Promise.all([
      getGitStatus(),
      getRecentCommits(),
      getStagedDiff()
    ]);
    
    const context = [
      `Branch: ${status.branch}`,
      status.ahead > 0 ? `Ahead: ${status.ahead} commits` : '',
      status.behind > 0 ? `Behind: ${status.behind} commits` : '',
      status.staged.length > 0 ? `Staged files: ${status.staged.join(', ')}` : '',
      status.unstaged.length > 0 ? `Modified files: ${status.unstaged.join(', ')}` : '',
      status.untracked.length > 0 ? `Untracked files: ${status.untracked.join(', ')}` : '',
      '',
      'Recent commits:',
      recentCommits,
      currentDiff ? '\nCurrent staged changes:\n' + currentDiff : ''
    ].filter(Boolean).join('\n');
    
    return context;
  } catch (error) {
    return `Error getting repo context: ${error}`;
  }
}

async function getRecentCommits(): Promise<string> {
  try {
    const { stdout } = await execa('git', ['log', '--oneline', '-5']);
    return stdout;
  } catch {
    return 'No recent commits available';
  }
}

export async function commitChanges(message: string): Promise<void> {
  await execa('git', ['commit', '-m', message]);
}
