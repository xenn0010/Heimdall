import { Command } from 'commander';
import chalk from 'chalk';
import { isGitRepo, createConfig } from '../lib/index.js';

export const initCommand = new Command('init')
  .description('Initialize Heimdall in a Git repository')
  .action(async () => {
    try {
      // Check if we're in a git repository
      if (!await isGitRepo()) {
        console.error(chalk.red('Error: Not in a Git repository. Please run this command in a Git repository.'));
        process.exit(1);
      }

      // Check for required environment variables
      if (!process.env.GH_TOKEN) {
        console.warn(chalk.yellow('Warning: GH_TOKEN environment variable not set. GitHub features will not work.'));
        console.log(chalk.blue('Set it with: export GH_TOKEN=your_github_token'));
      }

      // Create .heimdall.json config
      await createConfig();
      
      console.log(chalk.green('✓ Heimdall initialized successfully!'));
      console.log(chalk.blue('Next steps:'));
      console.log('  1. Set environment variables (GH_TOKEN, MORPH_API_KEY)');
      console.log('  2. Run "heimdall status" to check your repository status');
    } catch (error) {
      console.error(chalk.red('Error initializing Heimdall:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
