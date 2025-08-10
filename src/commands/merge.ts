import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { createInterface } from 'readline';
import { 
  getMergeStatus, 
  resolveFileConflicts, 
  abortMerge, 
  completeMerge,
  getBranchList,
  mergeBranch
} from '../lib/merge.js';
import { getCurrentBranch } from '../lib/git.js';

export const mergeCommand = new Command('merge')
  .description('Smart merge with AI-powered conflict resolution')
  .argument('[branch]', 'Branch to merge (if not provided, will show status)')
  .option('--no-ff', 'Create a merge commit even if fast-forward is possible')
  .option('--squash', 'Squash commits from the merged branch')
  .option('--strategy <strategy>', 'Use specific merge strategy (recursive, ours, theirs)')
  .option('--abort', 'Abort current merge')
  .option('--continue', 'Continue merge after resolving conflicts')
  .option('--auto-resolve', 'Automatically resolve all conflicts with AI')
  .option('--list', 'List available branches for merging')
  .action(async (branch: string | undefined, options) => {
    try {
      const spinner = ora('Checking merge status...').start();
      
      // Handle special options first
      if (options.abort) {
        spinner.text = 'Aborting merge...';
        await abortMerge();
        spinner.succeed('Merge aborted');
        return;
      }
      
      if (options.list) {
        spinner.text = 'Getting branch list...';
        const branches = await getBranchList();
        const currentBranch = await getCurrentBranch();
        
        spinner.succeed('Available branches:');
        console.log(chalk.blue('Local branches:'));
        branches.local.forEach(b => {
          if (b === currentBranch) {
            console.log(chalk.green(`  * ${b} (current)`));
          } else {
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
      
      // Check current merge status
      const mergeStatus = await getMergeStatus();
      
      if (options.continue || mergeStatus.isInMerge) {
        if (!mergeStatus.isInMerge) {
          spinner.fail('No merge in progress');
          return;
        }
        
        spinner.text = 'Checking for conflicts...';
        
        if (mergeStatus.conflictedFiles.length === 0) {
          spinner.text = 'Completing merge...';
          await completeMerge();
          spinner.succeed('Merge completed successfully!');
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
            console.log(chalk.blue('Completing merge...'));
            await completeMerge();
            console.log(chalk.green('🎉 Merge completed successfully!'));
          } else {
            console.log(chalk.yellow('\n⚠ Some conflicts could not be auto-resolved'));
            console.log(chalk.gray('Use "heimdall resolve <file>" to resolve individual files'));
            console.log(chalk.gray('Or use "heimdall merge --continue" after manual resolution'));
          }
        } else {
          console.log(chalk.yellow('\nOptions:'));
          console.log(chalk.gray('  heimdall merge --auto-resolve    # Auto-resolve all conflicts'));
          console.log(chalk.gray('  heimdall resolve <file>          # Resolve specific file'));
          console.log(chalk.gray('  heimdall merge --continue        # Continue after manual resolution'));
          console.log(chalk.gray('  heimdall merge --abort           # Abort the merge'));
        }
        
        return;
      }
      
      // Start new merge
      if (!branch) {
        spinner.fail('No branch specified and no merge in progress');
        console.log(chalk.gray('Usage: heimdall merge <branch>'));
        console.log(chalk.gray('   or: heimdall merge --list'));
        return;
      }
      
      const currentBranch = await getCurrentBranch();
      console.log(chalk.blue(`Merging ${branch} into ${currentBranch}...`));
      
      // Ask for confirmation
      const confirmed = await askConfirmation(`Merge ${branch} into ${currentBranch}?`);
      if (!confirmed) {
        console.log(chalk.gray('Merge cancelled'));
        return;
      }
      
      spinner.text = `Merging ${branch}...`;
      
      try {
        await mergeBranch(branch, {
          noFf: options.noFf,
          squash: options.squash,
          strategy: options.strategy
        });
        
        spinner.succeed(`Successfully merged ${branch} into ${currentBranch}!`);
        
      } catch (error) {
        // Check if it's a merge conflict
        const newMergeStatus = await getMergeStatus();
        
        if (newMergeStatus.isInMerge && newMergeStatus.conflictedFiles.length > 0) {
          spinner.warn('Merge conflicts detected');
          
          console.log(chalk.yellow(`\nConflicted files (${newMergeStatus.conflictedFiles.length}):`));
          newMergeStatus.conflictedFiles.forEach(file => {
            console.log(chalk.red(`  - ${file}`));
          });
          
          if (options.autoResolve) {
            console.log(chalk.blue('\n🤖 Auto-resolving conflicts...'));
            
            let allResolved = true;
            for (const file of newMergeStatus.conflictedFiles) {
              const resolved = await resolveFileConflicts(file);
              if (!resolved) {
                allResolved = false;
              }
            }
            
            if (allResolved) {
              console.log(chalk.green('\n✓ All conflicts resolved automatically'));
              await completeMerge();
              console.log(chalk.green('🎉 Merge completed successfully!'));
            } else {
              console.log(chalk.yellow('\n⚠ Some conflicts need manual attention'));
            }
          } else {
            console.log(chalk.yellow('\nResolve conflicts and then:'));
            console.log(chalk.gray('  heimdall merge --continue        # Complete the merge'));
            console.log(chalk.gray('  heimdall merge --auto-resolve    # Auto-resolve with AI'));
            console.log(chalk.gray('  heimdall merge --abort           # Abort the merge'));
          }
        } else {
          spinner.fail(`Merge failed: ${error}`);
        }
      }
      
    } catch (error) {
      console.error(chalk.red('Error in merge command:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

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