import { Command } from 'commander';
import chalk from 'chalk';
import { getGitStatus, generateCommitMessage, gitCommit } from '../lib/index.js';

export const commitCommand = new Command('commit')
  .description('Generate and create a conventional commit from staged changes')
  .option('--message <message>', 'Use custom commit message instead of generating one')
  .option('--dry', 'Show generated commit message without committing')
  .action(async (options) => {
    try {
      const status = await getGitStatus();
      
      if (status.staged.length === 0) {
        console.log(chalk.yellow('No staged changes found.'));
        console.log(chalk.blue('Run "git add -A" to stage all changes, or "git add <files>" to stage specific files.'));
        return;
      }

      let commitMessage: string;
      
      if (options.message) {
        commitMessage = options.message;
      } else {
        console.log(chalk.blue('Generating commit message from staged changes...'));
        commitMessage = await generateCommitMessage(status.staged);
      }

      console.log(chalk.green('Generated commit message:'));
      console.log(chalk.gray('---'));
      console.log(commitMessage);
      console.log(chalk.gray('---'));

      if (options.dry) {
        console.log(chalk.yellow('Dry run mode - commit not created'));
        return;
      }

      await gitCommit(commitMessage);
      console.log(chalk.green('✓ Commit created successfully!'));
      
    } catch (error) {
      console.error(chalk.red('Error creating commit:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
