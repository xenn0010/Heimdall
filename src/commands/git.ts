import { Command } from 'commander';
import chalk from 'chalk';
import { execa } from 'execa';

export const gitCommand = new Command('git')
  .description('Execute git commands through Heimdall')
  .argument('<gitArgs...>', 'Git command arguments')
  .action(async (gitArgs: string[]) => {
    try {
      console.log(chalk.blue(`Running: git ${gitArgs.join(' ')}`));
      
      const { stdout, stderr } = await execa('git', gitArgs, {
        stdio: ['inherit', 'pipe', 'pipe']
      });
      
      if (stdout) {
        console.log(stdout);
      }
      
      if (stderr) {
        console.error(chalk.yellow(stderr));
      }
      
      console.log(chalk.green('✓ Git command completed'));
      
    } catch (error) {
      console.error(chalk.red('Git command failed:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });