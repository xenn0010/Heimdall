import { execa } from 'execa';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import chalk from 'chalk';
import { applyUpdate } from './morph.js';

export interface ConflictMarker {
  start: number;
  middle: number;
  end: number;
  currentContent: string;
  incomingContent: string;
  currentBranch: string;
  incomingBranch: string;
}

export interface MergeStatus {
  isInMerge: boolean;
  conflictedFiles: string[];
  mergeHead?: string;
  mergeBranch?: string;
}

export async function getMergeStatus(): Promise<MergeStatus> {
  try {
    // Check if we're in the middle of a merge
    const gitDir = '.git';
    const mergeHeadExists = existsSync(`${gitDir}/MERGE_HEAD`);
    
    if (!mergeHeadExists) {
      return {
        isInMerge: false,
        conflictedFiles: []
      };
    }

    // Get conflicted files
    const { stdout } = await execa('git', ['diff', '--name-only', '--diff-filter=U']);
    const conflictedFiles = stdout ? stdout.split('\n').filter(Boolean) : [];

    // Get merge head info
    let mergeHead: string | undefined;
    let mergeBranch: string | undefined;
    
    try {
      const mergeHeadContent = await readFile(`${gitDir}/MERGE_HEAD`, 'utf-8');
      mergeHead = mergeHeadContent.trim();
      
      // Try to get branch name from MERGE_MSG
      const mergeMsgContent = await readFile(`${gitDir}/MERGE_MSG`, 'utf-8');
      const branchMatch = mergeMsgContent.match(/Merge branch '([^']+)'/);
      if (branchMatch) {
        mergeBranch = branchMatch[1];
      }
    } catch {
      // Files might not exist in all merge scenarios
    }

    return {
      isInMerge: true,
      conflictedFiles,
      mergeHead,
      mergeBranch
    };
  } catch (error) {
    throw new Error(`Failed to get merge status: ${error}`);
  }
}

export async function parseConflicts(filePath: string): Promise<ConflictMarker[]> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const conflicts: ConflictMarker[] = [];
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      
      // Look for conflict start marker
      if (line.startsWith('<<<<<<<')) {
        const currentBranch = line.substring(7).trim() || 'HEAD';
        const start = i;
        
        // Find the middle marker
        let middle = -1;
        let j = i + 1;
        while (j < lines.length && !lines[j].startsWith('=======')) {
          j++;
        }
        if (j < lines.length) {
          middle = j;
        }
        
        // Find the end marker
        let end = -1;
        let incomingBranch = '';
        j = middle + 1;
        while (j < lines.length && !lines[j].startsWith('>>>>>>>')) {
          j++;
        }
        if (j < lines.length) {
          end = j;
          incomingBranch = lines[j].substring(7).trim();
        }
        
        if (middle !== -1 && end !== -1) {
          const currentContent = lines.slice(start + 1, middle).join('\n');
          const incomingContent = lines.slice(middle + 1, end).join('\n');
          
          conflicts.push({
            start,
            middle,
            end,
            currentContent,
            incomingContent,
            currentBranch,
            incomingBranch
          });
          
          i = end + 1;
        } else {
          i++;
        }
      } else {
        i++;
      }
    }
    
    return conflicts;
  } catch (error) {
    throw new Error(`Failed to parse conflicts in ${filePath}: ${error}`);
  }
}

export async function resolveConflictWithAI(filePath: string, conflict: ConflictMarker): Promise<string> {
  const instruction = `
Resolve this merge conflict intelligently by analyzing both versions and creating the best combined result:

CURRENT BRANCH (${conflict.currentBranch}):
${conflict.currentContent}

INCOMING BRANCH (${conflict.incomingBranch}):
${conflict.incomingContent}

Instructions:
1. Analyze both versions and understand the intent of each change
2. Merge the changes in the most logical way possible
3. Remove all conflict markers (<<<<<<<, =======, >>>>>>>)
4. Ensure the result is syntactically correct
5. Preserve functionality from both branches when possible
6. If changes conflict logically, prefer the incoming branch but add comments explaining the decision

Return ONLY the resolved content without any conflict markers.
`;

  try {
    // Get the full file content for context
    const fullContent = await readFile(filePath, 'utf-8');
    const lines = fullContent.split('\n');
    
    // Create context around the conflict
    const contextStart = Math.max(0, conflict.start - 5);
    const contextEnd = Math.min(lines.length, conflict.end + 6);
    const contextLines = lines.slice(contextStart, contextEnd);
    const conflictContext = contextLines.join('\n');
    
    const resolvedContent = await applyUpdate(conflictContext, instruction);
    
    return resolvedContent;
  } catch (error) {
    throw new Error(`Failed to resolve conflict with AI: ${error}`);
  }
}

export async function resolveFileConflicts(filePath: string): Promise<boolean> {
  try {
    console.log(chalk.blue(`🔍 Analyzing conflicts in ${filePath}...`));
    
    const conflicts = await parseConflicts(filePath);
    if (conflicts.length === 0) {
      console.log(chalk.green(`✓ No conflicts found in ${filePath}`));
      return true;
    }
    
    console.log(chalk.yellow(`Found ${conflicts.length} conflict(s) in ${filePath}`));
    
    // Read the full file
    const originalContent = await readFile(filePath, 'utf-8');
    let resolvedContent = originalContent;
    
    // Process conflicts in reverse order to maintain line numbers
    for (let i = conflicts.length - 1; i >= 0; i--) {
      const conflict = conflicts[i];
      console.log(chalk.blue(`🤖 Resolving conflict ${i + 1}/${conflicts.length}...`));
      
      const resolution = await resolveConflictWithAI(filePath, conflict);
      
      // Replace the conflict section with the resolution
      const lines = resolvedContent.split('\n');
      const beforeConflict = lines.slice(0, conflict.start);
      const afterConflict = lines.slice(conflict.end + 1);
      const resolvedLines = resolution.split('\n');
      
      resolvedContent = [...beforeConflict, ...resolvedLines, ...afterConflict].join('\n');
      console.log(chalk.green(`✓ Conflict ${i + 1} resolved`));
    }
    
    // Write the resolved content back
    await writeFile(filePath, resolvedContent, 'utf-8');
    
    // Stage the resolved file
    await execa('git', ['add', filePath]);
    
    console.log(chalk.green(`✓ ${filePath} conflicts resolved and staged`));
    return true;
    
  } catch (error) {
    console.error(chalk.red(`✗ Failed to resolve conflicts in ${filePath}: ${error}`));
    return false;
  }
}

export async function abortMerge(): Promise<void> {
  await execa('git', ['merge', '--abort']);
}

export async function completeMerge(message?: string): Promise<void> {
  if (message) {
    await execa('git', ['commit', '-m', message]);
  } else {
    // Let git use the default merge commit message
    await execa('git', ['commit', '--no-edit']);
  }
}

export async function getBranchList(): Promise<{ local: string[]; remote: string[] }> {
  try {
    const [localResult, remoteResult] = await Promise.all([
      execa('git', ['branch', '--format=%(refname:short)']),
      execa('git', ['branch', '-r', '--format=%(refname:short)'])
    ]);
    
    const local = localResult.stdout ? localResult.stdout.split('\n').filter(Boolean) : [];
    const remote = remoteResult.stdout ? 
      remoteResult.stdout.split('\n').filter(Boolean).filter(b => !b.includes('HEAD')) : [];
    
    return { local, remote };
  } catch (error) {
    throw new Error(`Failed to get branch list: ${error}`);
  }
}

export async function mergeBranch(branch: string, options: {
  noFf?: boolean;
  squash?: boolean;
  strategy?: string;
} = {}): Promise<void> {
  const args = ['merge'];
  
  if (options.noFf) args.push('--no-ff');
  if (options.squash) args.push('--squash');
  if (options.strategy) args.push('--strategy', options.strategy);
  
  args.push(branch);
  
  await execa('git', args);
}