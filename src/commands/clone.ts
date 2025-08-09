import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execa } from 'execa';
import { analyzeCodebase } from '../lib/codebase.js';

export const cloneCommand = new Command('clone')
  .description('Clone a repository and analyze it with Heimdall')
  .argument('<url>', 'Git repository URL to clone')
  .argument('[directory]', 'Directory name (optional, defaults to repo name)')
  .option('--analyze', 'Automatically analyze the codebase after cloning')
  .option('--fix <instruction>', 'Clone, analyze, and apply fixes in one command')
  .action(async (url: string, directory?: string, options: any = {}) => {
    try {
      const spinner = ora('Cloning repository...').start();
      
      // Extract repo name from URL if no directory specified
      const repoName = directory || url.split('/').pop()?.replace('.git', '') || 'repo';
      
      // Clone the repository
      await execa('git', ['clone', url, repoName]);
      spinner.succeed(`Repository cloned to ${repoName}`);
      
      // Change to the cloned directory
      process.chdir(repoName);
      
      if (options.analyze || options.fix) {
        const analyzeSpinner = ora('Analyzing codebase...').start();
        const analysis = await analyzeCodebase();
        analyzeSpinner.succeed('Codebase analyzed');
        
        console.log(chalk.blue('\n📊 Repository Analysis:'));
        console.log(chalk.gray(analysis));
      }
      
      if (options.fix) {
        console.log(chalk.blue(`\n🤖 Applying fixes: "${options.fix}"`));
        console.log(chalk.yellow('Run this command to continue:'));
        console.log(chalk.cyan(`heimdall chat "${options.fix}"`));
      }
      
      console.log(chalk.green(`\n✅ Repository ready! Navigate with: cd ${repoName}`));
      console.log(chalk.blue('💡 Try these commands:'));
      console.log(chalk.gray('  heimdall explore'));
      console.log(chalk.gray('  heimdall chat "analyze this code and suggest improvements"'));
      console.log(chalk.gray('  heimdall chat "fix any issues and add documentation"'));
      
    } catch (error) {
      console.error(chalk.red('Failed to clone repository:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });