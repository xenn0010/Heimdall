import { getStagedDiff } from './git.js';
import { parseCommitType, generateCommitDescription, formatCommitMessage } from './utils.js';
import type { CommitMessage } from '../types/index.js';

export async function generateCommitMessage(stagedFiles: string[]): Promise<string> {
  try {
    const diff = await getStagedDiff();
    const type = parseCommitType(diff);
    const description = generateCommitDescription(stagedFiles);
    
    const commit: CommitMessage = {
      type,
      description
    };
    
    return formatCommitMessage(commit);
  } catch (error) {
    // Fallback to simple message if diff parsing fails
    return `chore: update ${stagedFiles.length} file${stagedFiles.length === 1 ? '' : 's'}`;
  }
}
