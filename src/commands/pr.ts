import { Command } from 'commander';
import chalk from 'chalk';
import { getCurrentBranch, getRemoteInfo, createPullRequest } from '../lib/index.js';

export const prCommand = new Command('pr')
  .description('Create a GitHub pull request')
  .option('--base <branch>', 'Base branch for the pull request', 'main')
  .option('--title <title>', 'Pull request title')
  .option('--body <body>', 'Pull request body')
  .option('--draft', 'Create as draft pull request')
  .action(async (options) => {
    try {
      if (!process.env.GH_TOKEN) {
        console.error(chalk.red('Error: GH_TOKEN environment variable not set.'));
        console.log(chalk.blue('Set it with: export GH_TOKEN=your_github_token'));
        process.exit(1);
      }

      const currentBranch = await getCurrentBranch();
      const remoteInfo = await getRemoteInfo();
      
      if (currentBranch === options.base) {
        console.error(chalk.red(`Error: Cannot create PR from ${options.base} to ${options.base}`));
        console.log(chalk.blue(`Switch to a feature branch first: git checkout -b feature/my-feature`));
        process.exit(1);
      }

      console.log(chalk.blue(`Creating pull request from ${currentBranch} to ${options.base}...`));
      
      const prUrl = await createPullRequest({
        owner: remoteInfo.owner,
        repo: remoteInfo.repo,
        head: currentBranch,
        base: options.base,
        title: options.title || `feat: ${currentBranch}`,
        body: options.body || `Pull request from ${currentBranch}`,
        draft: options.draft || false
      });

      console.log(chalk.green('✓ Pull request created successfully!'));
      console.log(chalk.blue('URL:'), prUrl);
      
    } catch (error) {
      console.error(chalk.red('Error creating pull request:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
