import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { createInterface } from 'readline';
import { execa } from 'execa';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { getCurrentBranch } from '../lib/git.js';
import { getBranchList, resolveFileConflicts, getMergeStatus } from '../lib/merge.js';

interface RebaseStatus {
  isInRebase: boolean;
  currentCommit?: string;
  totalCommits?: number;
  conflictedFiles?: string[];
}

export const rebaseCommand = new Command('rebase')
  .description('Interactive rebase with AI-powered conflict resolution')
  .argument('[branch]', 'Branch to rebase onto (default: main/master)')
  .option('-i, --interactive', 'Start interactive rebase')
  .option('--continue', 'Continue rebase after resolving conflicts')
  .option('--abort', 'Abort current rebase')
  .option('--skip', 'Skip current commit and continue rebase')
  .option('--auto-resolve', 'Automatically resolve conflicts with AI')
  .option('--onto <branch>', 'Rebase onto specific branch')
  .option('--root', 'Rebase all commits (including root)')
  .option('--list', 'List available branches for rebasing')
  .action(async (branch: string | undefined, options) => {
    try {
      const spinner = ora('Checking rebase status...').start();
      
      // Handle special options first
      if (options.abort) {
        spinner.text = 'Aborting rebase...';
        await execa('git', ['rebase', '--abort']);
        spinner.succeed('Rebase aborted');
        return;
      }
      
      if (options.skip) {
        spinner.text = 'Skipping current commit...';
        await execa('git', ['rebase', '--skip']);
        spinner.succeed('Commit skipped, continuing rebase...');
        return;
      }
      
      if (options.list) {
        spinner.text = 'Getting branch list...';
        const branches = await getBranchList();
        const currentBranch = await getCurrentBranch();
        
        spinner.succeed('Available branches for rebasing:');
        console.log(chalk.blue('Local branches:'));
        branches.local.forEach(b => {
          if (b !== currentBranch) {
            console.log(chalk.gray(`    ${b}`));
          }
        });
        
        if (branches.remote.length > 0) {
          console.log(chalk.blue('\nRemote branches:'));
          branches.remote.forEach(b => {
            console.log(chalk.gray(`    ${b}`));
          });
        }
        return;
      }
      
      // Check if we're in the middle of a rebase
      const rebaseStatus = await getRebaseStatus();
      
      if (options.continue || rebaseStatus.isInRebase) {
        if (!rebaseStatus.isInRebase) {
          spinner.fail('No rebase in progress');
          return;
        }
        
        spinner.text = 'Checking for conflicts...';
        
        // Check for conflicts using merge status (rebases create similar conflicts)
        const mergeStatus = await getMergeStatus();
        
        if (mergeStatus.conflictedFiles.length === 0) {
          spinner.text = 'Continuing rebase...';
          await execa('git', ['rebase', '--continue']);
          spinner.succeed('Rebase continued successfully!');
          return;
        }
        
        spinner.succeed(`Found ${mergeStatus.conflictedFiles.length} conflicted file(s)`);
        
        console.log(chalk.yellow('Conflicted files:'));
        mergeStatus.conflictedFiles.forEach(file => {
          console.log(chalk.red(`  - ${file}`));
        });
        
        if (options.autoResolve) {
          console.log(chalk.blue('\n🤖 Auto-resolving conflicts with AI...'));
          
          let allResolved = true;
          for (const file of mergeStatus.conflictedFiles) {
            const resolved = await resolveFileConflicts(file);
            if (!resolved) {
              allResolved = false;
            }
          }
          
          if (allResolved) {
            console.log(chalk.green('\n✓ All conflicts resolved automatically'));
            console.log(chalk.blue('Continuing rebase...'));
            await execa('git', ['rebase', '--continue']);
            console.log(chalk.green('🎉 Rebase continued successfully!'));
          } else {
            console.log(chalk.yellow('\n⚠ Some conflicts could not be auto-resolved'));
            console.log(chalk.gray('Resolve manually and use "heimdall rebase --continue"'));
          }
        } else {
          console.log(chalk.yellow('\nOptions:'));
          console.log(chalk.gray('  heimdall rebase --auto-resolve   # Auto-resolve conflicts'));
          console.log(chalk.gray('  heimdall resolve <file>          # Resolve specific file'));
          console.log(chalk.gray('  heimdall rebase --continue       # Continue after resolution'));
          console.log(chalk.gray('  heimdall rebase --skip           # Skip current commit'));
          console.log(chalk.gray('  heimdall rebase --abort          # Abort the rebase'));
        }
        
        return;
      }
      
      // Start new rebase
      if (!branch) {
        // Try to determine default branch
        branch = await getDefaultBranch();
      }
      
      const currentBranch = await getCurrentBranch();
      
      if (branch === currentBranch) {
        spinner.fail(`Cannot rebase ${currentBranch} onto itself`);
        return;
      }
      
      console.log(chalk.blue(`Rebasing ${currentBranch} onto ${branch}...`));
      
      // Ask for confirmation unless it's interactive
      if (!options.interactive) {
        const confirmed = await askConfirmation(`Rebase ${currentBranch} onto ${branch}?`);
        if (!confirmed) {
          console.log(chalk.gray('Rebase cancelled'));
          return;
        }
      }
      
      spinner.text = `Starting rebase...`;
      
      try {
        const rebaseArgs = ['rebase'];
        
        if (options.interactive) {
          rebaseArgs.push('-i');
        }
        
        if (options.onto) {
          rebaseArgs.push('--onto', options.onto);
        }
        
        if (options.root) {
          rebaseArgs.push('--root');
        }
        
        rebaseArgs.push(branch);
        
        await execa('git', rebaseArgs);
        spinner.succeed(`Successfully rebased ${currentBranch} onto ${branch}!`);
        
      } catch (error) {
        // Check if it's a rebase conflict
        const newRebaseStatus = await getRebaseStatus();
        
        if (newRebaseStatus.isInRebase) {
          spinner.warn('Rebase conflicts detected');
          
          // Check for conflicts
          const mergeStatus = await getMergeStatus();
          
          if (mergeStatus.conflictedFiles.length > 0) {
            console.log(chalk.yellow(`\nConflicted files (${mergeStatus.conflictedFiles.length}):`));
            mergeStatus.conflictedFiles.forEach(file => {
              console.log(chalk.red(`  - ${file}`));
            });
            
            if (options.autoResolve) {
              console.log(chalk.blue('\n🤖 Auto-resolving conflicts...'));
              
              let allResolved = true;
              for (const file of mergeStatus.conflictedFiles) {
                const resolved = await resolveFileConflicts(file);
                if (!resolved) {
                  allResolved = false;
                }
              }
              
              if (allResolved) {
                console.log(chalk.green('\n✓ All conflicts resolved automatically'));
                await execa('git', ['rebase', '--continue']);
                console.log(chalk.green('🎉 Rebase completed successfully!'));
              } else {
                console.log(chalk.yellow('\n⚠ Some conflicts need manual attention'));
              }
            } else {
              console.log(chalk.yellow('\nResolve conflicts and then:'));
              console.log(chalk.gray('  heimdall rebase --continue       # Continue rebase'));
              console.log(chalk.gray('  heimdall rebase --auto-resolve   # Auto-resolve with AI'));
              console.log(chalk.gray('  heimdall rebase --abort          # Abort rebase'));
            }
          }
        } else {
          spinner.fail(`Rebase failed: ${error}`);
        }
      }
      
    } catch (error) {
      console.error(chalk.red('Error in rebase command:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

async function getRebaseStatus(): Promise<RebaseStatus> {
  try {
    // Check for rebase directory
    const gitDir = '.git';
    const rebaseApplyExists = existsSync(`${gitDir}/rebase-apply`);
    const rebaseMergeExists = existsSync(`${gitDir}/rebase-merge`);
    
    if (!rebaseApplyExists && !rebaseMergeExists) {
      return { isInRebase: false };
    }
    
    const status: RebaseStatus = { isInRebase: true };
    
    try {
      // Try to get current commit info from rebase-merge
      if (rebaseMergeExists) {
        const currentCommit = await readFile(`${gitDir}/rebase-merge/stopped-sha`, 'utf-8');
        status.currentCommit = currentCommit.trim();
        
        const msgNum = await readFile(`${gitDir}/rebase-merge/msgnum`, 'utf-8');
        const end = await readFile(`${gitDir}/rebase-merge/end`, 'utf-8');
        
        status.totalCommits = parseInt(end.trim());
      }
    } catch {
      // Files might not exist in all rebase scenarios
    }
    
    return status;
  } catch (error) {
    throw new Error(`Failed to get rebase status: ${error}`);
  }
}

async function getDefaultBranch(): Promise<string> {
  try {
    // Try to get the default branch from remote
    const { stdout } = await execa('git', ['symbolic-ref', 'refs/remotes/origin/HEAD']);
    return stdout.replace('refs/remotes/origin/', '').trim();
  } catch {
    // Fall back to common defaults
    try {
      await execa('git', ['show-ref', '--verify', '--quiet', 'refs/heads/main']);
      return 'main';
    } catch {
      try {
        await execa('git', ['show-ref', '--verify', '--quiet', 'refs/heads/master']);
        return 'master';
      } catch {
        return 'main'; // Ultimate fallback
      }
    }
  }
}

async function askConfirmation(question: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(chalk.yellow(`${question} (y/N) `), (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}