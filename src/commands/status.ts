import { Command } from 'commander';
import chalk from 'chalk';
import { getGitStatus } from '../lib/index.js';

export const statusCommand = new Command('status')
  .description('Show Git repository status')
  .option('--json', 'Output in JSON format')
  .action(async (options) => {
    try {
      const status = await getGitStatus();
      
      if (options.json) {
        console.log(JSON.stringify(status, null, 2));
        return;
      }

      // Human-readable output
      console.log(chalk.blue('Repository Status:'));
      console.log(`${chalk.green('Branch:')} ${status.branch}`);
      
      if (status.ahead > 0 || status.behind > 0) {
        console.log(`${chalk.yellow('Sync:')} ${status.ahead} ahead, ${status.behind} behind`);
      } else {
        console.log(`${chalk.green('Sync:')} up to date`);
      }

      console.log(`${chalk.cyan('Staged:')} ${status.staged.length} files`);
      console.log(`${chalk.yellow('Modified:')} ${status.unstaged.length} files`);
      console.log(`${chalk.red('Untracked:')} ${status.untracked.length} files`);

      if (status.staged.length > 0) {
        console.log('\nStaged files:');
        status.staged.forEach(file => console.log(`  ${chalk.green('+')} ${file}`));
      }

      if (status.unstaged.length > 0) {
        console.log('\nModified files:');
        status.unstaged.forEach(file => console.log(`  ${chalk.yellow('M')} ${file}`));
      }

      if (status.untracked.length > 0) {
        console.log('\nUntracked files:');
        status.untracked.forEach(file => console.log(`  ${chalk.red('?')} ${file}`));
      }
    } catch (error) {
      console.error(chalk.red('Error getting status:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
